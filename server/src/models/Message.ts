import mongoose, { Schema, Document } from 'mongoose';

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'voice' | 'document' | 'system';

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
}

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  type: MessageType;
  content: string;
  media?: IMessageMedia;
  replyTo?: mongoose.Types.ObjectId;
  reactions: IMessageReaction[];
  deliveredTo: mongoose.Types.ObjectId[];
  readBy: mongoose.Types.ObjectId[];
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
      enum: ['text', 'image', 'video', 'audio', 'voice', 'document', 'system'],
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
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
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

export const Message = mongoose.model<IMessage>('Message', MessageSchema);

