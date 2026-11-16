import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { signAccessToken } from '../utils/jwt.js';
import { addOrUpdateConversation, StoredConversation } from '../utils/dataStore.js';

describe('BecuGram Phase 1: Core Messaging & Data Layer Tests', () => {
  const app = createApp();

  // Test users
  const userA = { userId: 'test_user_alice', username: 'alice', displayName: 'Alice' };
  const userB = { userId: 'test_user_bob', username: 'bob', displayName: 'Bob' };
  const userEve = { userId: 'test_user_eve', username: 'eve', displayName: 'Eve (Intruder)' };

  const tokenA = signAccessToken(userA);
  const tokenB = signAccessToken(userB);
  const tokenEve = signAccessToken(userEve);

  const testChatId = `test_chat_${Date.now()}`;

  beforeAll(() => {
    // Seed test conversation between Alice and Bob
    const conversation: StoredConversation = {
      _id: testChatId,
      type: 'direct',
      participants: [userA.userId, userB.userId],
      partner: {
        _id: userB.userId,
        displayName: userB.displayName,
        username: userB.username,
        isOnline: true,
        isVerified: false,
      },
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    };
    addOrUpdateConversation(conversation);
  });

  describe('1. Access Control & Membership Validation', () => {
    it('should reject unauthorized requests without token (401)', async () => {
      const res = await request(app).get(`/api/chats/${testChatId}/messages`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 CHAT_NOT_FOUND when requesting non-existent conversation', async () => {
      const res = await request(app)
        .get('/api/chats/non_existent_chat_id_xyz/messages')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.error?.code).toBe('CHAT_NOT_FOUND');
    });

    it('should return 403 FORBIDDEN_NOT_PARTICIPANT when non-member user tries to read chat', async () => {
      const res = await request(app)
        .get(`/api/chats/${testChatId}/messages`)
        .set('Authorization', `Bearer ${tokenEve}`);

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN_NOT_PARTICIPANT');
    });

    it('should return 403 FORBIDDEN_NOT_PARTICIPANT when non-member user tries to send message', async () => {
      const res = await request(app)
        .post(`/api/chats/${testChatId}/messages`)
        .set('Authorization', `Bearer ${tokenEve}`)
        .send({ content: 'I should not be able to send this!' });

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN_NOT_PARTICIPANT');
    });
  });

  describe('2. Message Sending, Validation & Persistence', () => {
    it('should reject empty message submissions (400 EMPTY_MESSAGE)', async () => {
      const res = await request(app)
        .post(`/api/chats/${testChatId}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ content: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('EMPTY_MESSAGE');
    });

    it('should successfully send a text message and persist it', async () => {
      const tempId = `temp_${Date.now()}_1`;
      const res = await request(app)
        .post(`/api/chats/${testChatId}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          content: 'Salom Bob, BecuGram yaxshi ishlayaptimi?',
          type: 'text',
          clientTempId: tempId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Salom Bob, BecuGram yaxshi ishlayaptimi?');
      expect(res.body.data.clientTempId).toBe(tempId);
      expect(res.body.data.conversationId).toBe(testChatId);
    });

    it('should prevent duplicate messages with identical clientTempId (Idempotence)', async () => {
      const duplicateTempId = `unique_uuid_retry_test_${Date.now()}`;

      // First send
      const firstRes = await request(app)
        .post(`/api/chats/${testChatId}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          content: 'Ushbu xabar tarmoq uzilishi tufayli qayta yuborilishi mumkin',
          type: 'text',
          clientTempId: duplicateTempId,
        });

      expect(firstRes.status).toBe(201);
      const firstMsgId = firstRes.body.data._id;

      // Duplicate retry submission
      const retryRes = await request(app)
        .post(`/api/chats/${testChatId}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          content: 'Ushbu xabar tarmoq uzilishi tufayli qayta yuborilishi mumkin',
          type: 'text',
          clientTempId: duplicateTempId,
        });

      // Must return 200 with the exact existing message
      expect(retryRes.status).toBe(200);
      expect(retryRes.body.data._id).toBe(firstMsgId);
      expect(retryRes.body.data.clientTempId).toBe(duplicateTempId);
    });
  });

  describe('3. Message Pagination & Ordering', () => {
    it('should paginate messages using limit and return chronological order', async () => {
      // Send 5 sequenced messages
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post(`/api/chats/${testChatId}/messages`)
          .set('Authorization', `Bearer ${tokenB}`)
          .send({
            content: `Ketma-ket xabar #${i}`,
            type: 'text',
            clientTempId: `seq_${Date.now()}_${i}`,
          });
      }

      // Query with limit = 3
      const pageRes = await request(app)
        .get(`/api/chats/${testChatId}/messages?limit=3`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(pageRes.status).toBe(200);
      expect(pageRes.body.success).toBe(true);
      expect(pageRes.body.data.messages.length).toBe(3);
      expect(pageRes.body.data.nextCursor).toBeDefined();

      // Next page with cursor
      const nextRes = await request(app)
        .get(`/api/chats/${testChatId}/messages?limit=3&before=${encodeURIComponent(pageRes.body.data.nextCursor)}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(nextRes.status).toBe(200);
      expect(nextRes.body.data.messages.length).toBeGreaterThan(0);
    });
  });

  describe('4. Message Ownership, Editing & Deletion', () => {
    let aliceMessageId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/chats/${testChatId}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          content: "Alice tomonidan yozilgan o'zgartiriladigan xabar",
          type: 'text',
        });
      aliceMessageId = res.body.data._id;
    });

    it('should reject editing empty content (400 EMPTY_CONTENT)', async () => {
      const res = await request(app)
        .patch(`/api/messages/${aliceMessageId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ content: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('EMPTY_CONTENT');
    });

    it('should return 403 FORBIDDEN_NOT_OWNER when Bob tries to edit Alices message', async () => {
      const res = await request(app)
        .patch(`/api/messages/${aliceMessageId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ content: 'Bob is trying to tamper with Alice message' });

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN_NOT_OWNER');
    });

    it('should allow Alice to successfully edit her own message', async () => {
      const res = await request(app)
        .patch(`/api/messages/${aliceMessageId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ content: 'Alice o\'z xabarini yangiladi (tahrirlandi) ✅' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isEdited).toBe(true);
      expect(res.body.data.content).toBe('Alice o\'z xabarini yangiladi (tahrirlandi) ✅');
    });

    it('should return 403 FORBIDDEN_NOT_OWNER when Bob tries to delete Alices message', async () => {
      const res = await request(app)
        .delete(`/api/messages/${aliceMessageId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN_NOT_OWNER');
    });

    it('should allow Alice to successfully delete her own message', async () => {
      const res = await request(app)
        .delete(`/api/messages/${aliceMessageId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isDeleted).toBe(true);
    });
  });

  describe('5. Message Reactions', () => {
    let targetMessageId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/chats/${testChatId}/messages`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          content: 'Bob sent a message to receive reactions',
          type: 'text',
        });
      targetMessageId = res.body.data._id;
    });

    it('should reject reaction without emoji (400 EMPTY_EMOJI)', async () => {
      const res = await request(app)
        .post(`/api/messages/${targetMessageId}/react`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('EMPTY_EMOJI');
    });

    it('should reject reaction from non-participant Eve (403 FORBIDDEN_NOT_PARTICIPANT)', async () => {
      const res = await request(app)
        .post(`/api/messages/${targetMessageId}/react`)
        .set('Authorization', `Bearer ${tokenEve}`)
        .send({ emoji: '🔥' });

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN_NOT_PARTICIPANT');
    });

    it('should allow Alice to add a reaction to Bobs message', async () => {
      const res = await request(app)
        .post(`/api/messages/${targetMessageId}/react`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ emoji: '👍' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reactions).toEqual(
        expect.arrayContaining([expect.objectContaining({ userId: userA.userId, emoji: '👍' })])
      );
    });
  });
});
