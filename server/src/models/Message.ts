import mongoose, { Schema, Document } from 'mongoose';

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'voice'
  | 'round_video'
  | 'video_note'
  | 'document'
  | 'file'
  | 'sticker'
  | 'gif'
  | 'system';

export interface IMessageReaction {
  userId: mongoose.Types.ObjectId;
  emoji: string;
}

export interface IMessageMedia {
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
  duration?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  waveform?: number[];
}

export interface IMessageForwardedFrom {
  displayName: string;
  username?: string;
  userId?: mongoose.Types.ObjectId;
}

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  type: MessageType;
  content: string;
  media?: IMessageMedia;
  replyTo?: mongoose.Types.ObjectId;
  clientTempId?: string;
  forwardedFrom?: IMessageForwardedFrom;
  reactions: IMessageReaction[];
  deliveredTo: mongoose.Types.ObjectId[];
  readBy: mongoose.Types.ObjectId[];
  deletedFor: mongoose.Types.ObjectId[];
  isPinned: boolean;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'text',
        'image',
        'video',
        'audio',
        'voice',
        'round_video',
        'video_note',
        'document',
        'file',
        'sticker',
        'gif',
        'system',
      ],
      default: 'text',
      required: true,
    },
    content: {
      type: String,
      default: '',
      trim: true,
    },
    media: {
      url: String,
      name: String,
      size: Number,
      mimeType: String,
      duration: Number,
      width: Number,
      height: Number,
      thumbnailUrl: String,
      waveform: [Number],
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    clientTempId: {
      type: String,
      trim: true,
      sparse: true,
    },
    forwardedFrom: {
      displayName: String,
      username: String,
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    reactions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String, required: true },
      },
    ],
    deliveredTo: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    deletedFor: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index for fast cursor pagination: { conversationId: 1, createdAt: -1 }
MessageSchema.index({ conversationId: 1, createdAt: -1 });
// Compound index for client deduplication: { conversationId: 1, clientTempId: 1 } (sparse)
MessageSchema.index({ conversationId: 1, clientTempId: 1 }, { sparse: true });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);

