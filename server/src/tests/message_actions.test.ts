import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { signAccessToken } from '../utils/jwt.js';
import { addOrUpdateConversation, StoredConversation } from '../utils/dataStore.js';

describe('BecuGram Phase 3: Advanced Message Actions Integration Tests', () => {
  const app = createApp();

  // Test users
  const userA = { userId: 'test_phase3_alice', username: 'alice_p3', displayName: 'Alice P3' };
  const userB = { userId: 'test_phase3_bob', username: 'bob_p3', displayName: 'Bob P3' };
  const userEve = { userId: 'test_phase3_eve', username: 'eve_p3', displayName: 'Eve Intruder' };

  const tokenA = signAccessToken(userA);
  const tokenB = signAccessToken(userB);
  const tokenEve = signAccessToken(userEve);

  const chatAB = `chat_actions_ab_${Date.now()}`;
  const chatAEve = `chat_actions_aeve_${Date.now()}`;

  beforeAll(() => {
    // Seed test conversation between Alice and Bob
    const conversationAB: StoredConversation = {
      _id: chatAB,
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
    addOrUpdateConversation(conversationAB);

    // Seed test conversation between Alice and Eve
    const conversationAEve: StoredConversation = {
      _id: chatAEve,
      type: 'direct',
      participants: [userA.userId, userEve.userId],
      partner: {
        _id: userEve.userId,
        displayName: userEve.displayName,
        username: userEve.username,
        isOnline: true,
        isVerified: false,
      },
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    };
    addOrUpdateConversation(conversationAEve);
  });

  describe('1. Message Reply System', () => {
    let originalMessageId: string;

    it('should send an initial message from Alice', async () => {
      const res = await request(app)
        .post(`/api/chats/${chatAB}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          content: 'Salom Bob, loyihani boshlaymizmi?',
          type: 'text',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      originalMessageId = res.body.data._id;
      expect(originalMessageId).toBeDefined();
    });

    it('should reply to Alice message from Bob and preserve quoted context', async () => {
      const res = await request(app)
        .post(`/api/chats/${chatAB}/messages`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          content: 'Ha albatta, tayyorman!',
          type: 'text',
          replyToId: originalMessageId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.replyTo).toBeDefined();
      expect(res.body.data.replyTo._id).toBe(originalMessageId);
      expect(res.body.data.replyTo.content).toBe('Salom Bob, loyihani boshlaymizmi?');
    });

    it('should retrieve reply in message history with full quoted information', async () => {
      const res = await request(app)
        .get(`/api/chats/${chatAB}/messages`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const messages = res.body.data.messages;
      const replyMsg = messages.find((m: any) => m.replyTo && m.replyTo._id === originalMessageId);
      expect(replyMsg).toBeDefined();
      expect(replyMsg.content).toBe('Ha albatta, tayyorman!');
    });
  });

  describe('2. Message Forwarding System', () => {
    let messageToForwardId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/chats/${chatAB}/messages`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          content: 'Ushbu muhim xabarni boshqalarga ham uzatish kerak',
          type: 'text',
        });
      messageToForwardId = res.body.data._id;
    });

    it('should forward message from Alice to another conversation (chatAEve)', async () => {
      const res = await request(app)
        .post('/api/messages/forward')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          messageIds: [messageToForwardId],
          targetConversationIds: [chatAEve],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);

      const forwarded = res.body.data[0];
      expect(forwarded.content).toBe('Ushbu muhim xabarni boshqalarga ham uzatish kerak');
      expect(forwarded.forwardedFrom).toBeDefined();
      expect(forwarded.forwardedFrom.displayName).toBe(userB.displayName);
    });

    it('should reject forwarding if user is not a participant in destination chat (403)', async () => {
      // Bob is not a participant in chatAEve
      const res = await request(app)
        .post('/api/messages/forward')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          messageIds: [messageToForwardId],
          targetConversationIds: [chatAEve],
        });

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN_NOT_PARTICIPANT');
    });

    it('should reject forwarding with invalid empty arrays (400)', async () => {
      const res = await request(app)
        .post('/api/messages/forward')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          messageIds: [],
          targetConversationIds: [chatAEve],
        });

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('INVALID_MESSAGES');
    });
  });

  describe('3. Message Editing System', () => {
    let msgToEditId: string;
    let originalCreatedAt: string;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/chats/${chatAB}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          content: 'Dastlabki xabar matni (xatolik bilan)',
          type: 'text',
        });
      msgToEditId = res.body.data._id;
      originalCreatedAt = res.body.data.createdAt;
    });

    it('should successfully edit message by the owner (Alice)', async () => {
      const res = await request(app)
        .patch(`/api/messages/${msgToEditId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          content: 'Tuzatilgan xabar matni (muvaffaqiyatli!)',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Tuzatilgan xabar matni (muvaffaqiyatli!)');
      expect(res.body.data.isEdited).toBe(true);
      expect(res.body.data.editedAt).toBeDefined();
      if (res.body.data.createdAt) {
        expect(res.body.data.createdAt).toBe(originalCreatedAt);
      }
    });

    it('should reject editing by non-owner Bob (403 FORBIDDEN_NOT_OWNER)', async () => {
      const res = await request(app)
        .patch(`/api/messages/${msgToEditId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          content: 'Bob tahrirlamoqchi (ruxsatsiz)',
        });

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN_NOT_OWNER');
    });

    it('should reject editing with empty content (400 EMPTY_CONTENT)', async () => {
      const res = await request(app)
        .patch(`/api/messages/${msgToEditId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          content: '   ',
        });

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('EMPTY_CONTENT');
    });

    it('should return 404 for non-existent message', async () => {
      const res = await request(app)
        .patch('/api/messages/non_existent_msg_12345')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          content: 'Yangi matn',
        });

      expect(res.status).toBe(404);
      expect(res.body.error?.code).toBe('MESSAGE_NOT_FOUND');
    });
  });

  describe('4. Message Deletion (Delete for Everyone vs Delete for Myself)', () => {
    let msgDeleteEveryoneId: string;
    let msgDeleteForMeId: string;

    beforeAll(async () => {
      // Alice sends message to be deleted for everyone
      const res1 = await request(app)
        .post(`/api/chats/${chatAB}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          content: "Hammaga o'chirilishi kerak bo'lgan xabar",
          type: 'text',
        });
      msgDeleteEveryoneId = res1.body.data._id;

      // Alice sends message for Bob to delete for himself
      const res2 = await request(app)
        .post(`/api/chats/${chatAB}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          content: "Faqat Bob o'zi uchun o'chiradigan xabar",
          type: 'text',
        });
      msgDeleteForMeId = res2.body.data._id;
    });

    it('should reject deleting for everyone by non-owner (Bob tries to delete Alice message)', async () => {
      const res = await request(app)
        .delete(`/api/messages/${msgDeleteEveryoneId}?forEveryone=true`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN_NOT_OWNER');
    });

    it('should allow owner (Alice) to delete message for everyone', async () => {
      const res = await request(app)
        .delete(`/api/messages/${msgDeleteEveryoneId}?forEveryone=true`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it does not appear in chat messages for either Alice or Bob
      const checkRes = await request(app)
        .get(`/api/chats/${chatAB}/messages`)
        .set('Authorization', `Bearer ${tokenA}`);

      const found = checkRes.body.data.messages.find((m: any) => m._id === msgDeleteEveryoneId);
      expect(found).toBeUndefined();
    });

    it('should allow Bob to delete Alice message for himself (Delete for me)', async () => {
      const res = await request(app)
        .delete(`/api/messages/${msgDeleteForMeId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ forEveryone: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deletedForMe).toBe(true);

      // Message must NOT appear for Bob
      const bobRes = await request(app)
        .get(`/api/chats/${chatAB}/messages`)
        .set('Authorization', `Bearer ${tokenB}`);
      const foundForBob = bobRes.body.data.messages.find((m: any) => m._id === msgDeleteForMeId);
      expect(foundForBob).toBeUndefined();

      // Message MUST still appear for Alice!
      const aliceRes = await request(app)
        .get(`/api/chats/${chatAB}/messages`)
        .set('Authorization', `Bearer ${tokenA}`);
      const foundForAlice = aliceRes.body.data.messages.find((m: any) => m._id === msgDeleteForMeId);
      expect(foundForAlice).toBeDefined();
    });
  });

  describe('5. Message Reactions (Add, Toggle, Multi-user)', () => {
    let targetMsgId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/chats/${chatAB}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          content: 'Ajoyib natija! 🔥',
          type: 'text',
        });
      targetMsgId = res.body.data._id;
    });

    it('should allow Bob to react to Alices message with thumbs up', async () => {
      const res = await request(app)
        .post(`/api/messages/${targetMsgId}/react`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ emoji: '👍' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const reactions = res.body.data.reactions;
      expect(reactions.some((r: any) => r.userId === userB.userId && r.emoji === '👍')).toBe(true);
    });

    it('should toggle off reaction when Bob reacts with same emoji again', async () => {
      const res = await request(app)
        .post(`/api/messages/${targetMsgId}/react`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ emoji: '👍' });

      expect(res.status).toBe(200);
      const reactions = res.body.data.reactions;
      expect(reactions.some((r: any) => r.userId === userB.userId && r.emoji === '👍')).toBe(false);
    });

    it('should allow multiple users to react and aggregate counts', async () => {
      // Alice reacts with heart
      await request(app)
        .post(`/api/messages/${targetMsgId}/react`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ emoji: '❤️' });

      // Bob reacts with heart
      const resBob = await request(app)
        .post(`/api/messages/${targetMsgId}/react`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ emoji: '❤️' });

      expect(resBob.status).toBe(200);
      const reacts = resBob.body.data.reactions.filter((r: any) => r.emoji === '❤️');
      expect(reacts.length).toBe(2);
    });

    it('should reject non-participant (Eve) trying to react (403)', async () => {
      const res = await request(app)
        .post(`/api/messages/${targetMsgId}/react`)
        .set('Authorization', `Bearer ${tokenEve}`)
        .send({ emoji: '🎉' });

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN_NOT_PARTICIPANT');
    });
  });

  describe('6. Pinned Messages in Conversations', () => {
    let msgToPinId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/chats/${chatAB}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          content: 'Eslatma: Ertaga soat 10:00 da onlayn miting!',
          type: 'text',
        });
      msgToPinId = res.body.data._id;
    });

    it('should pin message in chatAB', async () => {
      const res = await request(app)
        .post(`/api/chats/${chatAB}/pin-message/${msgToPinId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pinnedMessageId).toBe(msgToPinId);
    });

    it('should reject non-participant (Eve) trying to pin in chatAB (403)', async () => {
      const res = await request(app)
        .post(`/api/chats/${chatAB}/pin-message/${msgToPinId}`)
        .set('Authorization', `Bearer ${tokenEve}`);

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN_NOT_PARTICIPANT');
    });

    it('should reject pinning non-existent message (404)', async () => {
      const res = await request(app)
        .post(`/api/chats/${chatAB}/pin-message/non_existent_msg_xyz`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.error?.code).toBe('MESSAGE_NOT_FOUND');
    });

    it('should unpin pinned message in chatAB', async () => {
      const res = await request(app)
        .delete(`/api/chats/${chatAB}/pin-message`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pinnedMessageId).toBeFalsy();
    });
  });
});
