import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Group } from '../models/Group.js';
import { GroupMember } from '../models/GroupMember.js';
import { Contact } from '../models/Contact.js';
import { logger } from './logger.js';

export async function runSeed(): Promise<void> {
  try {
    logger.info('Starting BecuGram Database Seeding...');
    await connectDB();

    // Clean existing seed collections
    await User.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    await Group.deleteMany({});
    await GroupMember.deleteMany({});
    await Contact.deleteMany({});

    logger.info('Purged old data.');

    // 1. Create Users matching reference image
    const abdurahim = await User.create({
      phoneNumber: '+998889008081',
      username: 'abdurahim',
      displayName: 'Abdurahim',
      avatar: '',
      bio: 'UI/UX Designer & Tech Enthusiast 🚀',
      isVerified: true,
      isOnline: true,
      lastSeen: new Date(),
      privacySettings: {
        lastSeenVisibility: 'everyone',
        phoneVisibility: 'everyone',
        profilePhotoVisibility: 'everyone',
      },
    });

    const azizbek = await User.create({
      phoneNumber: '+998909876543',
      username: 'azizbek',
      displayName: 'Azizbek',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      bio: 'Full-stack software engineer & open source fan',
      isVerified: true,
      isOnline: true,
      lastSeen: new Date(),
    });

    const muhammad = await User.create({
      phoneNumber: '+998905551122',
      username: 'muhammad',
      displayName: 'Muhammad',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      bio: 'Mobile Engineer @ BecuGram',
      isVerified: false,
      isOnline: false,
      lastSeen: new Date(Date.now() - 3600000),
    });

    const farrux = await User.create({
      phoneNumber: '+998907773344',
      username: 'farrux',
      displayName: 'Farrux',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
      bio: 'Product Designer',
      isVerified: false,
      isOnline: true,
      lastSeen: new Date(),
    });

    const sardor = await User.create({
      phoneNumber: '+998903338899',
      username: 'sardor',
      displayName: 'Sardor',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
      bio: 'Audio producer & sound designer',
      isVerified: false,
      isOnline: false,
      lastSeen: new Date(Date.now() - 86400000),
    });

    logger.info('Created sample users (Abdurahim, Azizbek, Muhammad, Farrux, Sardor).');

    // 2. Create Contacts for Abdurahim
    await Contact.create([
      { userId: abdurahim._id, contactUserId: azizbek._id, customName: 'Azizbek' },
      { userId: abdurahim._id, contactUserId: farrux._id, customName: 'Farrux' },
      { userId: abdurahim._id, contactUserId: muhammad._id, customName: 'Muhammad' },
      { userId: abdurahim._id, contactUserId: sardor._id, customName: 'Sardor' },
    ]);

    // 3. Create Groups matching Screen 04
    const designCommunity = await Group.create({
      name: 'Design Community',
      description: 'Worldwide UI/UX designers collaborating on modern product experiences.',
      avatar: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&auto=format&fit=crop&q=80',
      creatorId: abdurahim._id,
      inviteCode: 'design123',
      memberCount: 12400,
      isPublic: true,
    });

    const devTeam = await Group.create({
      name: 'Development Team',
      description: 'Core BecuGram platform engineering team.',
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80',
      creatorId: abdurahim._id,
      inviteCode: 'devteam01',
      memberCount: 18,
      isPublic: false,
    });

    const familyGroup = await Group.create({
      name: 'Family Group',
      description: 'Family chat & photo updates ❤️',
      avatar: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&auto=format&fit=crop&q=80',
      creatorId: abdurahim._id,
      inviteCode: 'family01',
      memberCount: 6,
      isPublic: false,
    });

    // 4. Create Group Memberships
    await GroupMember.create([
      { groupId: devTeam._id, userId: abdurahim._id, role: 'owner' },
      { groupId: devTeam._id, userId: azizbek._id, role: 'admin' },
      { groupId: devTeam._id, userId: muhammad._id, role: 'member' },
      { groupId: familyGroup._id, userId: abdurahim._id, role: 'owner' },
      { groupId: familyGroup._id, userId: sardor._id, role: 'member' },
      { groupId: designCommunity._id, userId: abdurahim._id, role: 'owner' },
      { groupId: designCommunity._id, userId: farrux._id, role: 'member' },
    ]);

    // 5. Create Group Conversations
    const devConv = await Conversation.create({
      type: 'group',
      groupId: devTeam._id,
      participants: [abdurahim._id, azizbek._id, muhammad._id],
      lastMessageAt: new Date(Date.now() - 40 * 60 * 1000),
      unreadCounts: new Map([[abdurahim._id.toString(), 0]]),
    });
    devTeam.conversationId = devConv._id as any;
    await devTeam.save();

    const devMsg = await Message.create({
      conversationId: devConv._id,
      senderId: azizbek._id,
      type: 'text',
      content: 'New update is ready! 🚀',
      createdAt: new Date(Date.now() - 40 * 60 * 1000),
    });
    devConv.lastMessage = devMsg._id as any;
    await devConv.save();

    const familyConv = await Conversation.create({
      type: 'group',
      groupId: familyGroup._id,
      participants: [abdurahim._id, sardor._id],
      lastMessageAt: new Date(Date.now() - 45 * 60 * 1000),
      unreadCounts: new Map([[abdurahim._id.toString(), 0]]),
    });
    familyGroup.conversationId = familyConv._id as any;
    await familyGroup.save();

    const familyMsg = await Message.create({
      conversationId: familyConv._id,
      senderId: sardor._id,
      type: 'image',
      content: 'Photo attached 📸',
      media: {
        url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80',
        name: 'weekend_family.jpg',
        size: 142000,
        mimeType: 'image/jpeg',
      },
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
    });
    familyConv.lastMessage = familyMsg._id as any;
    await familyConv.save();

    // 6. Direct Conversation: Abdurahim & Azizbek (Matching Screen 03)
    const azizbekConv = await Conversation.create({
      type: 'direct',
      participants: [abdurahim._id, azizbek._id],
      lastMessageAt: new Date(),
      unreadCounts: new Map([[abdurahim._id.toString(), 0], [azizbek._id.toString(), 0]]),
    });

    const m1 = await Message.create({
      conversationId: azizbekConv._id,
      senderId: abdurahim._id,
      type: 'text',
      content: 'Hey! Have you seen the new update?',
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
    });

    const m2 = await Message.create({
      conversationId: azizbekConv._id,
      senderId: azizbek._id,
      type: 'text',
      content: 'Yes, the new design looks amazing.',
      createdAt: new Date(Date.now() - 12 * 60 * 1000),
    });

    const m3 = await Message.create({
      conversationId: azizbekConv._id,
      senderId: abdurahim._id,
      type: 'text',
      content: 'We are launching BecuGram soon.',
      replyTo: m2._id,
      createdAt: new Date(Date.now() - 8 * 60 * 1000),
    });

    const m4 = await Message.create({
      conversationId: azizbekConv._id,
      senderId: azizbek._id,
      type: 'text',
      content: "Can't wait! 🔥",
      reactions: [{ userId: abdurahim._id, emoji: '🔥' }],
      createdAt: new Date(Date.now() - 2 * 60 * 1000),
    });

    azizbekConv.lastMessage = m4._id as any;
    azizbekConv.lastMessageAt = m4.createdAt;
    await azizbekConv.save();

    // 7. Direct Conversation: Abdurahim & Muhammad (Unread: 3)
    const muhammadConv = await Conversation.create({
      type: 'direct',
      participants: [abdurahim._id, muhammad._id],
      lastMessageAt: new Date(Date.now() - 20 * 60 * 1000),
      unreadCounts: new Map([[abdurahim._id.toString(), 3], [muhammad._id.toString(), 0]]),
    });

    const muhammadMsg = await Message.create({
      conversationId: muhammadConv._id,
      senderId: muhammad._id,
      type: 'text',
      content: 'Send the project files',
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
    });
    muhammadConv.lastMessage = muhammadMsg._id as any;
    await muhammadConv.save();

    // 8. Direct Conversation: Abdurahim & Sardor (Voice Message 0:45)
    const sardorConv = await Conversation.create({
      type: 'direct',
      participants: [abdurahim._id, sardor._id],
      lastMessageAt: new Date(Date.now() - 86400000),
      unreadCounts: new Map([[abdurahim._id.toString(), 0], [sardor._id.toString(), 0]]),
    });

    const sardorMsg = await Message.create({
      conversationId: sardorConv._id,
      senderId: sardor._id,
      type: 'voice',
      content: 'Voice message (0:45)',
      media: {
        url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
        duration: 45,
        mimeType: 'audio/ogg',
      },
      createdAt: new Date(Date.now() - 86400000),
    });
    sardorConv.lastMessage = sardorMsg._id as any;
    await sardorConv.save();

    logger.info('Database seeded successfully with all reference screen data!');
    await disconnectDB();
  } catch (err) {
    logger.error('Error during seed:', err);
    process.exit(1);
  }
}

// Run directly if called as a script
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  runSeed();
}

