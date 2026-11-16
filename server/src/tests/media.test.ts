import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { createApp } from '../app.js';
import { signAccessToken } from '../utils/jwt.js';
import { addOrUpdateConversation, StoredConversation, getAllConversationMessages } from '../utils/dataStore.js';

describe('BecuGram Phase 4: Media Engine & Storage Architecture Integration Tests', () => {
  const app = createApp();

  const userA = { userId: 'media_test_alice', username: 'alice_media', displayName: 'Alice Media' };
  const userB = { userId: 'media_test_bob', username: 'bob_media', displayName: 'Bob Media' };
  const userEve = { userId: 'media_test_eve', username: 'eve_media', displayName: 'Eve Media' };

  const tokenA = signAccessToken(userA);
  const tokenB = signAccessToken(userB);
  const tokenEve = signAccessToken(userEve);

  const testChatId = `chat_media_${Date.now()}`;

  beforeAll(() => {
    const conv: StoredConversation = {
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
    addOrUpdateConversation(conv);
  });

  describe('1. File Upload Security & Validation', () => {
    it('rejects upload without authentication', async () => {
      const res = await request(app)
        .post('/api/media/upload')
        .attach('file', Buffer.from('fake image content'), 'test.png');

      expect(res.status).toBe(401);
    });

    it('rejects upload when no file is attached', async () => {
      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('NO_FILE');
    });

    it('blocks dangerous executable files (.exe)', async () => {
      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenA}`)
        .attach('file', Buffer.from('MZ... executable header'), 'trojan.exe');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('FORBIDDEN_FILE_TYPE');
    });

    it('blocks script files (.sh, .bat)', async () => {
      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenA}`)
        .attach('file', Buffer.from('#!/bin/bash\nrm -rf /'), 'danger.sh');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('FORBIDDEN_FILE_TYPE');
    });

    it('blocks unauthorized user from uploading to a private conversation', async () => {
      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenEve}`)
        .field('conversationId', testChatId)
        .attach('file', Buffer.from('image bytes'), 'pic.png');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('successfully uploads valid image file and assigns secure storage key', async () => {
      const validPng = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082', 'hex');
      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenA}`)
        .field('conversationId', testChatId)
        .attach('file', validPng, 'sample.png');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toMatch(/^\/uploads\/images\/\d+_[a-f0-9]+\.png$/);
      expect(res.body.data.name).toBe('sample.png');
      expect(res.body.data.size).toBeGreaterThan(0);
      expect(res.body.data.mimeType).toBe('image/png');
    });

    it('successfully uploads audio with duration and waveform metadata', async () => {
      const waveform = [10, 30, 85, 40, 95, 60, 20];
      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenA}`)
        .field('type', 'voice')
        .field('duration', '14.5')
        .field('waveform', JSON.stringify(waveform))
        .attach('file', Buffer.from('MOCK_AUDIO_DATA'), { filename: 'voice.webm', contentType: 'audio/webm' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toMatch(/^\/uploads\/audio\/\d+_[a-f0-9]+\.webm$/);
      expect(res.body.data.duration).toBe(14.5);
      expect(res.body.data.waveform).toEqual(waveform);
    });

    it('successfully uploads document file', async () => {
      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenA}`)
        .attach('file', Buffer.from('%PDF-1.4 mock pdf content'), 'report.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toMatch(/^\/uploads\/documents\/\d+_[a-f0-9]+\.pdf$/);
    });
  });

  describe('2. Media Message Dispatch & Persistence', () => {
    let uploadedImageUrl: string;
    let uploadedVoiceUrl: string;

    beforeAll(async () => {
      // Upload media files for subsequent messages with authentic headers
      const validJpg = Buffer.from('ffd8ffe000104a46494600010101006000600000ffd9', 'hex');
      const imgRes = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenA}`)
        .attach('file', validJpg, 'sunset.jpg');
      uploadedImageUrl = imgRes.body.data.url;

      // WebM Matroska signature 0x1A 0x45 0xDF 0xA3
      const validWebm = Buffer.from('1a45dfa3934282886d6174726f736b61', 'hex');
      const voiceRes = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenA}`)
        .field('type', 'voice')
        .attach('file', validWebm, { filename: 'voice.webm', contentType: 'audio/webm' });
      uploadedVoiceUrl = voiceRes.body.data.url;
    });

    it('sends an image message with caption and media object', async () => {
      const res = await request(app)
        .post(`/api/chats/${testChatId}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          type: 'image',
          content: 'Chiroyli quyosh botishi 🌅',
          clientTempId: 'client-img-' + Date.now(),
          media: {
            url: uploadedImageUrl,
            name: 'sunset.jpg',
            size: 102400,
            mimeType: 'image/jpeg',
            width: 1280,
            height: 720,
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('image');
      expect(res.body.data.content).toBe('Chiroyli quyosh botishi 🌅');
      expect(res.body.data.media.url).toBe(uploadedImageUrl);
      expect(res.body.data.media.width).toBe(1280);
    });

    it('sends a voice message with duration and waveform', async () => {
      const waveform = [15, 45, 90, 75, 50, 30, 80];
      const res = await request(app)
        .post(`/api/chats/${testChatId}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          type: 'voice',
          content: '',
          clientTempId: 'client-voice-' + Date.now(),
          media: {
            url: uploadedVoiceUrl,
            duration: 8.2,
            waveform,
            mimeType: 'audio/webm',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('voice');
      expect(res.body.data.media.duration).toBe(8.2);
      expect(res.body.data.media.waveform).toEqual(waveform);
    });

    it('sends a circular round video (video note) message', async () => {
      const res = await request(app)
        .post(`/api/chats/${testChatId}/messages`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          type: 'round_video',
          content: '',
          clientTempId: 'client-round-' + Date.now(),
          media: {
            url: '/uploads/videos/round_sample.webm',
            duration: 12.0,
            mimeType: 'video/webm',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('round_video');
      expect(res.body.data.media.duration).toBe(12.0);
    });

    it('sends a document message with file metadata', async () => {
      const res = await request(app)
        .post(`/api/chats/${testChatId}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          type: 'document',
          content: 'Loyiha hujjati',
          clientTempId: 'client-doc-' + Date.now(),
          media: {
            url: '/uploads/documents/specification.pdf',
            name: 'specification.pdf',
            size: 2450000,
            mimeType: 'application/pdf',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('document');
      expect(res.body.data.media.name).toBe('specification.pdf');
    });

    it('sends a sticker message', async () => {
      const res = await request(app)
        .post(`/api/chats/${testChatId}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          type: 'sticker',
          content: 'icon:Rocket',
          clientTempId: 'client-sticker-' + Date.now(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('sticker');
      expect(res.body.data.content).toBe('icon:Rocket');
    });

    it('sends an animated GIF message', async () => {
      const res = await request(app)
        .post(`/api/chats/${testChatId}/messages`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          type: 'gif',
          content: '',
          clientTempId: 'client-gif-' + Date.now(),
          media: {
            url: '/stickers/gifs/celebrate.gif',
            name: 'celebrate.gif',
            mimeType: 'image/gif',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('gif');
    });

    it('retrieves all sent media messages in conversation history', async () => {
      const res = await request(app)
        .get(`/api/chats/${testChatId}/messages`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const types = res.body.data.messages.map((m: any) => m.type);
      expect(types).toContain('image');
      expect(types).toContain('voice');
      expect(types).toContain('round_video');
      expect(types).toContain('document');
      expect(types).toContain('sticker');
      expect(types).toContain('gif');
    });
  });

  describe('3. Static Media Streaming & Range Request Headers', () => {
    it('serves static files with Accept-Ranges and long-term caching', async () => {
      // First ensure an upload file exists
      const up = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenA}`)
        .attach('file', Buffer.from('VIDEO_STREAMING_BYTES_1234567890'), 'stream_test.mp4');

      const url = up.body.data.url;
      const res = await request(app).get(url);

      expect(res.status).toBe(200);
      expect(res.headers['accept-ranges']).toBe('bytes');
      expect(res.headers['cache-control']).toContain('max-age=');
    });
  });
});
