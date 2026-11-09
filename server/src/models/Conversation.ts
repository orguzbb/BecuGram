import mongoose, { Schema, Document } from 'mongoose';

export type ConversationType = 'direct' | 'group';

export interface IConversation extends Document {
  type: ConversationType;
  participants: mongoose.Types.ObjectId[];
  groupId?: mongoose.Types.ObjectId;
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt: Date;
  pinnedFor: mongoose.Types.ObjectId[];
  mutedFor: mongoose.Types.ObjectId[];
  unreadCounts: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    type: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct',
      required: true,
      index: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
    ],
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      index: true,
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    pinnedFor: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    mutedFor: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast direct chat lookup between two participants
ConversationSchema.index({ participants: 1, type: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);

