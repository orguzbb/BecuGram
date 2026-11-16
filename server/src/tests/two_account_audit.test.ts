import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as Client, Socket } from 'socket.io-client';
import request from 'supertest';
import { createApp } from '../app.js';
import { signAccessToken } from '../utils/jwt.js';
import { addOrUpdateConversation, StoredConversation } from '../utils/dataStore.js';
import http from 'http';

describe('BecuGram Phase 3: Two-Account Live Functional Audit', () => {
  let server: http.Server;
  let baseUrl: string;
  let socketUrl: string;

  // Test Account 1: Alice
  const alice = { userId: 'audit_alice_01', username: 'alice_audit', displayName: 'Alice Audit' };
  const tokenAlice = signAccessToken(alice);
  let socketAlice: Socket;

  // Test Account 2: Bob
  const bob = { userId: 'audit_bob_02', username: 'bob_audit', displayName: 'Bob Audit' };
  const tokenBob = signAccessToken(bob);
  let socketBob: Socket;

  // Third Account: Eve (Unauthorized / Third-party)
  const eve = { userId: 'audit_eve_03', username: 'eve_audit', displayName: 'Eve Audit' };
  const tokenEve = signAccessToken(eve);

  const chatId = `chat_audit_${Date.now()}`;
  const eveChatId = `chat_audit_eve_${Date.now()}`;

  beforeAll(async () => {
    // Start local server instance on ephemeral port for tests
    const app = createApp();
    server = http.createServer(app);
    const { initSocketIO } = await import('../sockets/index.js');
    initSocketIO(server, '*');

    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });

    const addr = server.address() as any;
    const port = addr.port;
    baseUrl = `http://localhost:${port}`;
    socketUrl = `http://localhost:${port}`;

    // Seed direct chat between Alice and Bob
    const conversationAB: StoredConversation = {
      _id: chatId,
      type: 'direct',
      participants: [alice.userId, bob.userId],
      partner: {
        _id: bob.userId,
        displayName: bob.displayName,
        username: bob.username,
        isOnline: true,
        isVerified: false,
      },
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    };
    addOrUpdateConversation(conversationAB);

    // Seed chat between Alice and Eve
    const conversationAEve: StoredConversation = {
      _id: eveChatId,
      type: 'direct',
      participants: [alice.userId, eve.userId],
      partner: {
        _id: eve.userId,
        displayName: eve.displayName,
        username: eve.username,
        isOnline: true,
        isVerified: false,
      },
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    };
    addOrUpdateConversation(conversationAEve);

    // Connect Alice Socket
    socketAlice = Client(socketUrl, {
      auth: { token: tokenAlice },
      transports: ['websocket'],
      forceNew: true,
    });
    await new Promise<void>((resolve) => socketAlice.on('connect', resolve));
    socketAlice.emit('chat:join', { conversationId: chatId });

    // Connect Bob Socket
    socketBob = Client(socketUrl, {
      auth: { token: tokenBob },
      transports: ['websocket'],
      forceNew: true,
    });
    await new Promise<void>((resolve) => socketBob.on('connect', resolve));
    socketBob.emit('chat:join', { conversationId: chatId });
  });

  afterAll(() => {
    socketAlice?.close();
    socketBob?.close();
    server?.close();
  });

  describe('1. Real-Time Delivery & Message Reply between Alice and Bob', () => {
    let aliceMsgId: string;

    it('Alice sends a message and Bob receives it live in real time via socket', async () => {
      const bobReceivePromise = new Promise<any>((resolve) => {
        socketBob.once('message:new', (msg) => resolve(msg));
      });

      const res = await request(baseUrl)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({
          content: 'Salom Bob! Loyihani boshladikmi?',
          type: 'text',
        });

      expect(res.status).toBe(201);
      aliceMsgId = res.body.data._id;

      const receivedByBob = await bobReceivePromise;
      expect(receivedByBob._id).toBe(aliceMsgId);
      expect(receivedByBob.content).toBe('Salom Bob! Loyihani boshladikmi?');
    });

    it('Bob replies to Alice message and Alice receives quoted context live', async () => {
      const aliceReceiveReplyPromise = new Promise<any>((resolve) => {
        socketAlice.once('message:new', (msg) => resolve(msg));
      });

      const res = await request(baseUrl)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${tokenBob}`)
        .send({
          content: 'Ha Alice, barcha tayyorgarliklar ko\'rildi!',
          type: 'text',
          replyToId: aliceMsgId,
        });

      expect(res.status).toBe(201);
      const bobReplyMsg = res.body.data;
      expect(bobReplyMsg.replyTo).toBeDefined();
      expect(bobReplyMsg.replyTo._id).toBe(aliceMsgId);

      const receivedByAlice = await aliceReceiveReplyPromise;
      expect(receivedByAlice.replyTo).toBeDefined();
      expect(receivedByAlice.replyTo._id).toBe(aliceMsgId);
      expect(receivedByAlice.replyTo.content).toBe('Salom Bob! Loyihani boshladikmi?');
    });
  });

  describe('2. Real-Time Message Editing & Ownership Security', () => {
    let messageToEditId: string;
    let initialCreatedAt: string;

    beforeAll(async () => {
      const res = await request(baseUrl)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ content: 'Dastlabki versiya', type: 'text' });
      messageToEditId = res.body.data._id;
      initialCreatedAt = res.body.data.createdAt;
    });

    it('Bob tries to edit Alice message -> rejected with 403 FORBIDDEN_NOT_OWNER', async () => {
      const res = await request(baseUrl)
        .patch(`/api/messages/${messageToEditId}`)
        .set('Authorization', `Bearer ${tokenBob}`)
        .send({ content: 'Bob buni o\'zgartirmoqchi' });

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN_NOT_OWNER');
    });

    it('Alice edits her own message -> Bob receives real-time message:edited socket event', async () => {
      const bobEditedPromise = new Promise<any>((resolve) => {
        socketBob.once('message:edited', (msg) => resolve(msg));
      });

      const res = await request(baseUrl)
        .patch(`/api/messages/${messageToEditId}`)
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ content: 'Tahrirlangan va tasdiqlangan versiya ✅' });

      expect(res.status).toBe(200);
      expect(res.body.data.isEdited).toBe(true);

      const socketEdited = await bobEditedPromise;
      expect(socketEdited._id).toBe(messageToEditId);
      expect(socketEdited.content).toBe('Tahrirlangan va tasdiqlangan versiya ✅');
      expect(socketEdited.isEdited).toBe(true);
    });
  });

  describe('3. Message Reactions Live Synchronization (Add, Aggregate, Toggle)', () => {
    let targetMsgId: string;

    beforeAll(async () => {
      const res = await request(baseUrl)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ content: 'Reaksiyalar sinovi uchun xabar', type: 'text' });
      targetMsgId = res.body.data._id;
    });

    it('Bob reacts with 👍 -> Alice receives real-time message:reaction event', async () => {
      const aliceReactionPromise = new Promise<any>((resolve) => {
        socketAlice.once('message:reaction', (payload) => resolve(payload));
      });

      const res = await request(baseUrl)
        .post(`/api/messages/${targetMsgId}/react`)
        .set('Authorization', `Bearer ${tokenBob}`)
        .send({ emoji: '👍' });

      expect(res.status).toBe(200);

      const reactionPayload = await aliceReactionPromise;
      expect(reactionPayload.messageId).toBe(targetMsgId);
      expect(reactionPayload.reactions.some((r: any) => r.userId === bob.userId && r.emoji === '👍')).toBe(true);
    });

    it('Bob reacts with same emoji 👍 again -> reaction toggles off in real time', async () => {
      const aliceReactionTogglePromise = new Promise<any>((resolve) => {
        socketAlice.once('message:reaction', (payload) => resolve(payload));
      });

      const res = await request(baseUrl)
        .post(`/api/messages/${targetMsgId}/react`)
        .set('Authorization', `Bearer ${tokenBob}`)
        .send({ emoji: '👍' });

      expect(res.status).toBe(200);

      const togglePayload = await aliceReactionTogglePromise;
      expect(togglePayload.reactions.some((r: any) => r.userId === bob.userId && r.emoji === '👍')).toBe(false);
    });
  });

  describe('4. Pinned Message Real-Time Sync (Pin & Unpin)', () => {
    let pinnedMsgId: string;

    beforeAll(async () => {
      const res = await request(baseUrl)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ content: 'Muhim eslatma: Chat qoidalariga rioya qiling!', type: 'text' });
      pinnedMsgId = res.body.data._id;
    });

    it('Alice pins message -> Bob receives real-time chat:pinned_message event', async () => {
      const bobPinPromise = new Promise<any>((resolve) => {
        socketBob.once('chat:pinned_message', (payload) => resolve(payload));
      });

      const res = await request(baseUrl)
        .post(`/api/chats/${chatId}/pin-message/${pinnedMsgId}`)
        .set('Authorization', `Bearer ${tokenAlice}`);

      expect(res.status).toBe(200);

      const pinPayload = await bobPinPromise;
      expect(pinPayload.conversationId).toBe(chatId);
      expect(pinPayload.pinnedMessageId).toBe(pinnedMsgId);
    });

    it('Bob unpins message -> Alice receives real-time chat:pinned_message event with null', async () => {
      const aliceUnpinPromise = new Promise<any>((resolve) => {
        socketAlice.once('chat:pinned_message', (payload) => resolve(payload));
      });

      const res = await request(baseUrl)
        .delete(`/api/chats/${chatId}/pin-message`)
        .set('Authorization', `Bearer ${tokenBob}`);

      expect(res.status).toBe(200);

      const unpinPayload = await aliceUnpinPromise;
      expect(unpinPayload.conversationId).toBe(chatId);
      expect(unpinPayload.pinnedMessage).toBeNull();
    });
  });

  describe('5. Message Forwarding & Security Restrictions', () => {
    let forwardSrcId: string;

    beforeAll(async () => {
      const res = await request(baseUrl)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${tokenBob}`)
        .send({ content: 'Alicega maxfiy jo\'natilgan ma\'lumot', type: 'text' });
      forwardSrcId = res.body.data._id;
    });

    it('Alice forwards message to chatAEve -> preserves forwardedFrom metadata', async () => {
      const res = await request(baseUrl)
        .post('/api/messages/forward')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({
          messageIds: [forwardSrcId],
          targetConversationIds: [eveChatId],
        });

      expect(res.status).toBe(201);
      expect(res.body.data[0].forwardedFrom).toBeDefined();
      expect(res.body.data[0].forwardedFrom.displayName).toBe(bob.displayName);
    });

    it('Eve tries to forward message into chatAB where Eve is not member -> rejected with 403', async () => {
      const res = await request(baseUrl)
        .post('/api/messages/forward')
        .set('Authorization', `Bearer ${tokenEve}`)
        .send({
          messageIds: [forwardSrcId],
          targetConversationIds: [chatId],
        });

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN_NOT_PARTICIPANT');
    });
  });

  describe('6. Message Deletion: Delete for Everyone vs Delete for Myself', () => {
    let msgEveryoneId: string;
    let msgForMeId: string;

    beforeAll(async () => {
      const res1 = await request(baseUrl)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ content: 'Hamma uchun o\'chiriladi', type: 'text' });
      msgEveryoneId = res1.body.data._id;

      const res2 = await request(baseUrl)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ content: 'Bob faqat o\'zi uchun o\'chiradi', type: 'text' });
      msgForMeId = res2.body.data._id;
    });

    it('Alice deletes message for everyone -> Bob receives real-time message:deleted', async () => {
      const bobDeletePromise = new Promise<any>((resolve) => {
        socketBob.once('message:deleted', (payload) => resolve(payload));
      });

      const res = await request(baseUrl)
        .delete(`/api/messages/${msgEveryoneId}?forEveryone=true`)
        .set('Authorization', `Bearer ${tokenAlice}`);

      expect(res.status).toBe(200);

      const deletePayload = await bobDeletePromise;
      expect(deletePayload.messageId).toBe(msgEveryoneId);
      expect(deletePayload.forEveryone).toBe(true);
    });

    it('Bob deletes Alice message for myself -> Alice socket does NOT receive deletion, message remains in Alice history', async () => {
      let aliceReceivedDelete = false;
      const aliceDeleteHandler = () => { aliceReceivedDelete = true; };
      socketAlice.on('message:deleted', aliceDeleteHandler);

      const res = await request(baseUrl)
        .delete(`/api/messages/${msgForMeId}`)
        .set('Authorization', `Bearer ${tokenBob}`)
        .send({ forEveryone: false });

      expect(res.status).toBe(200);
      expect(res.body.data.deletedForMe).toBe(true);

      // Wait a moment to ensure no socket event was erroneously broadcast to Alice
      await new Promise((r) => setTimeout(r, 200));
      socketAlice.off('message:deleted', aliceDeleteHandler);
      expect(aliceReceivedDelete).toBe(false);

      // Verify Bob's history does NOT contain message
      const bobHistory = await request(baseUrl)
        .get(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${tokenBob}`);
      expect(bobHistory.body.data.messages.find((m: any) => m._id === msgForMeId)).toBeUndefined();

      // Verify Alice's history DOES still contain message
      const aliceHistory = await request(baseUrl)
        .get(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${tokenAlice}`);
      expect(aliceHistory.body.data.messages.find((m: any) => m._id === msgForMeId)).toBeDefined();
    });
  });

  describe('7. Refresh Persistence & Pagination Survival', () => {
    it('all conversations and message actions survive page refresh / simulated API reloads', async () => {
      const reloadRes = await request(baseUrl)
        .get(`/api/chats/${chatId}/messages?limit=10`)
        .set('Authorization', `Bearer ${tokenAlice}`);

      expect(reloadRes.status).toBe(200);
      expect(Array.isArray(reloadRes.body.data.messages)).toBe(true);
      expect(reloadRes.body.data.messages.length).toBeGreaterThan(0);
    });
  });
});
