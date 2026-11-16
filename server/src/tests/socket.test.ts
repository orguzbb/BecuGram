import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../app.js';
import { initSocketIO, getSocketIO } from '../sockets/index.js';
import { signAccessToken } from '../utils/jwt.js';
import { addOrUpdateConversation, StoredConversation } from '../utils/dataStore.js';

describe('BecuGram Phase 2: Real-Time WebSocket Communication & Presence Tests', () => {
  let server: http.Server;
  let serverAddress: string;

  // Test users
  const userA = { userId: 'socket_user_alice', username: 'alice', displayName: 'Alice' };
  const userB = { userId: 'socket_user_bob', username: 'bob', displayName: 'Bob' };
  const userEve = { userId: 'socket_user_eve', username: 'eve', displayName: 'Eve (Intruder)' };

  const tokenA = signAccessToken(userA);
  const tokenB = signAccessToken(userB);
  const tokenEve = signAccessToken(userEve);

  const testChatId = `socket_chat_${Date.now()}`;

  beforeAll(async () => {
    // 1. Seed conversation between Alice and Bob
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

    // 2. Start ephemeral HTTP server with Socket.IO
    const app = createApp();
    server = http.createServer(app);
    initSocketIO(server, 'http://localhost');

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address() as any;
        serverAddress = `http://localhost:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    const io = getSocketIO();
    if (io) {
      io.disconnectSockets(true);
      await new Promise<void>((resolve) => io.close(() => resolve()));
    }
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  function createClient(token?: string): ClientSocket {
    return ioClient(serverAddress, {
      auth: token ? { token } : undefined,
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });
  }

  describe('1. Authentication & Connection Security', () => {
    it('should reject socket connection without token', async () => {
      const client = createClient();
      const err = await new Promise<any>((resolve) => {
        client.on('connect_error', (error) => resolve(error));
      });

      expect(err.message).toContain('Authentication token required');
      client.close();
    });

    it('should reject socket connection with invalid token', async () => {
      const client = createClient('invalid.bogus.token');
      const err = await new Promise<any>((resolve) => {
        client.on('connect_error', (error) => resolve(error));
      });

      expect(err.message).toContain('Invalid socket authentication token');
      client.close();
    });

    it('should successfully connect with valid JWT token', async () => {
      const client = createClient(tokenA);
      await new Promise<void>((resolve) => {
        client.on('connect', () => resolve());
      });

      expect(client.connected).toBe(true);
      expect(client.id).toBeDefined();
      client.close();
    });
  });

  describe('2. Online/Offline Presence Tracking', () => {
    it('should broadcast presence:update when a user comes online and goes offline', async () => {
      const listenerClient = createClient(tokenA);
      await new Promise<void>((resolve) => listenerClient.on('connect', resolve));

      // Bob connects
      const onlinePromise = new Promise<any>((resolve) => {
        listenerClient.on('presence:update', (payload) => {
          if (payload.userId === userB.userId && payload.isOnline === true) {
            resolve(payload);
          }
        });
      });

      const bobClient = createClient(tokenB);
      await new Promise<void>((resolve) => bobClient.on('connect', resolve));

      const onlinePayload = await onlinePromise;
      expect(onlinePayload.userId).toBe(userB.userId);
      expect(onlinePayload.isOnline).toBe(true);

      // Bob disconnects
      const offlinePromise = new Promise<any>((resolve) => {
        listenerClient.on('presence:update', (payload) => {
          if (payload.userId === userB.userId && payload.isOnline === false) {
            resolve(payload);
          }
        });
      });

      bobClient.disconnect();
      const offlinePayload = await offlinePromise;
      expect(offlinePayload.userId).toBe(userB.userId);
      expect(offlinePayload.isOnline).toBe(false);

      listenerClient.close();
    });

    it('should provide active online roster via presence:get_online', async () => {
      const clientA = createClient(tokenA);
      await new Promise<void>((resolve) => clientA.on('connect', resolve));

      const roster = await new Promise<any>((resolve) => {
        clientA.emit('presence:get_online', (res: any) => resolve(res));
      });

      expect(roster.success).toBe(true);
      expect(roster.onlineUserIds).toContain(userA.userId);
      clientA.close();
    });
  });

  describe('3. Room Authorization & Chat Membership', () => {
    it('should reject unauthorized user (Eve) trying to join Alices chat room', async () => {
      const eveClient = createClient(tokenEve);
      await new Promise<void>((resolve) => eveClient.on('connect', resolve));

      const joinRes = await new Promise<any>((resolve) => {
        eveClient.emit('chat:join', { conversationId: testChatId }, (res: any) => resolve(res));
      });

      expect(joinRes.success).toBe(false);
      expect(joinRes.error.code).toBe('FORBIDDEN_NOT_PARTICIPANT');
      eveClient.close();
    });

    it('should allow conversation participant (Alice) to join chat room', async () => {
      const aliceClient = createClient(tokenA);
      await new Promise<void>((resolve) => aliceClient.on('connect', resolve));

      const joinRes = await new Promise<any>((resolve) => {
        aliceClient.emit('chat:join', { conversationId: testChatId }, (res: any) => resolve(res));
      });

      expect(joinRes.success).toBe(true);
      aliceClient.close();
    });
  });

  describe('4. Reliable Real-Time Message Delivery & Acknowledgements', () => {
    it('should deliver message from Alice to Bob and acknowledge with message:ack', async () => {
      const aliceClient = createClient(tokenA);
      const bobClient = createClient(tokenB);

      await Promise.all([
        new Promise<void>((resolve) => aliceClient.on('connect', resolve)),
        new Promise<void>((resolve) => bobClient.on('connect', resolve)),
      ]);

      // Both join room
      await Promise.all([
        new Promise((res) => aliceClient.emit('chat:join', { conversationId: testChatId }, res)),
        new Promise((res) => bobClient.emit('chat:join', { conversationId: testChatId }, res)),
      ]);

      const tempId = `temp_socket_ack_${Date.now()}`;
      const messageContent = 'Salom Bob, WebSocket orqali xabar jo\'natildi! 🚀';

      const bobReceivedPromise = new Promise<any>((resolve) => {
        bobClient.on('message:new', (msg) => {
          if (msg.conversationId === testChatId) resolve(msg);
        });
      });

      const aliceAckPromise = new Promise<any>((resolve) => {
        aliceClient.on('message:ack', (ack) => {
          if (ack.tempId === tempId) resolve(ack);
        });
      });

      aliceClient.emit('message:send', {
        tempId,
        conversationId: testChatId,
        content: messageContent,
        type: 'text',
      });

      const [ack, receivedMsg] = await Promise.all([aliceAckPromise, bobReceivedPromise]);

      expect(ack.tempId).toBe(tempId);
      expect(ack.status).toBe('sent');
      expect(ack.message.content).toBe(messageContent);

      expect(receivedMsg.content).toBe(messageContent);
      expect(receivedMsg.conversationId).toBe(testChatId);

      aliceClient.close();
      bobClient.close();
    });

    it('should prevent duplicate socket message sends using tempId', async () => {
      const aliceClient = createClient(tokenA);
      await new Promise<void>((resolve) => aliceClient.on('connect', resolve));
      aliceClient.emit('chat:join', { conversationId: testChatId });

      const duplicateTempId = `dup_temp_${Date.now()}`;

      // First send
      const firstSend = await new Promise<any>((resolve) => {
        aliceClient.emit(
          'message:send',
          { tempId: duplicateTempId, conversationId: testChatId, content: 'Takrorlanmas xabar', type: 'text' },
          (res: any) => resolve(res)
        );
      });

      expect(firstSend.success).toBe(true);
      const firstMsgId = firstSend.data._id;

      // Second send with same tempId
      const secondSend = await new Promise<any>((resolve) => {
        aliceClient.emit(
          'message:send',
          { tempId: duplicateTempId, conversationId: testChatId, content: 'Takrorlanmas xabar', type: 'text' },
          (res: any) => resolve(res)
        );
      });

      // Must return the exact same message without committing duplicate
      expect(secondSend.data._id).toBe(firstMsgId);

      aliceClient.close();
    });
  });

  describe('5. Real-Time Typing Indicators', () => {
    it('should broadcast typing:update when user starts and stops typing', async () => {
      const aliceClient = createClient(tokenA);
      const bobClient = createClient(tokenB);

      await Promise.all([
        new Promise<void>((resolve) => aliceClient.on('connect', resolve)),
        new Promise<void>((resolve) => bobClient.on('connect', resolve)),
      ]);

      await Promise.all([
        new Promise((res) => aliceClient.emit('chat:join', { conversationId: testChatId }, res)),
        new Promise((res) => bobClient.emit('chat:join', { conversationId: testChatId }, res)),
      ]);

      // Alice starts typing
      const typingStartPromise = new Promise<any>((resolve) => {
        bobClient.on('typing:update', (payload) => {
          if (payload.conversationId === testChatId && payload.isTyping === true) {
            resolve(payload);
          }
        });
      });

      aliceClient.emit('typing:start', { conversationId: testChatId });
      const startPayload = await typingStartPromise;
      expect(startPayload.isTyping).toBe(true);
      expect(startPayload.userId).toBe(userA.userId);

      // Alice stops typing
      const typingStopPromise = new Promise<any>((resolve) => {
        bobClient.on('typing:update', (payload) => {
          if (payload.conversationId === testChatId && payload.isTyping === false) {
            resolve(payload);
          }
        });
      });

      aliceClient.emit('typing:stop', { conversationId: testChatId });
      const stopPayload = await typingStopPromise;
      expect(stopPayload.isTyping).toBe(false);

      aliceClient.close();
      bobClient.close();
    });
  });

  describe('6. Read Receipts & Delivery Status', () => {
    it('should broadcast message:read_receipt when recipient reads messages', async () => {
      const aliceClient = createClient(tokenA);
      const bobClient = createClient(tokenB);

      await Promise.all([
        new Promise<void>((resolve) => aliceClient.on('connect', resolve)),
        new Promise<void>((resolve) => bobClient.on('connect', resolve)),
      ]);

      await Promise.all([
        new Promise((res) => aliceClient.emit('chat:join', { conversationId: testChatId }, res)),
        new Promise((res) => bobClient.emit('chat:join', { conversationId: testChatId }, res)),
      ]);

      // Send a message first
      const msgRes = await new Promise<any>((resolve) => {
        aliceClient.emit(
          'message:send',
          { conversationId: testChatId, content: 'Read receipt test', type: 'text' },
          (res: any) => resolve(res)
        );
      });
      const messageId = msgRes.data._id;

      // Alice listens for read receipt
      const receiptPromise = new Promise<any>((resolve) => {
        aliceClient.on('message:read_receipt', (receipt) => {
          if (receipt.conversationId === testChatId) resolve(receipt);
        });
      });

      // Bob marks as read
      bobClient.emit('message:read', { conversationId: testChatId, messageIds: [messageId] });

      const receipt = await receiptPromise;
      expect(receipt.conversationId).toBe(testChatId);
      expect(receipt.readerId).toBe(userB.userId);
      expect(receipt.readAt).toBeDefined();

      aliceClient.close();
      bobClient.close();
    });
  });

  describe('7. Multi-Device Synchronization', () => {
    it('should synchronize sent messages and read receipts across multiple tabs of the same user', async () => {
      const aliceDevice1 = createClient(tokenA);
      const aliceDevice2 = createClient(tokenA);

      await Promise.all([
        new Promise<void>((resolve) => aliceDevice1.on('connect', resolve)),
        new Promise<void>((resolve) => aliceDevice2.on('connect', resolve)),
      ]);

      // Alice Device 2 listens for message sent from Device 1
      const syncPromise = new Promise<any>((resolve) => {
        aliceDevice2.on('message:new', (msg) => {
          if (msg.content === 'Multi-device sync check') resolve(msg);
        });
      });

      aliceDevice1.emit('message:send', {
        conversationId: testChatId,
        content: 'Multi-device sync check',
        type: 'text',
      });

      const syncedMsg = await syncPromise;
      expect(syncedMsg.content).toBe('Multi-device sync check');

      aliceDevice1.close();
      aliceDevice2.close();
    });
  });
});
