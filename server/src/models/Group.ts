import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description?: string;
  avatar?: string;
  creatorId: mongoose.Types.ObjectId;
  inviteCode: string;
  memberCount: number;
  isPublic: boolean;
  conversationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
    },
    description: {
      type: String,
      default: '',
      maxlength: 256,
    },
    avatar: {
      type: String,
      default: '',
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    inviteCode: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    memberCount: {
      type: Number,
      default: 1,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
    },
  },
  {
    timestamps: true,
  }
);

export const Group = mongoose.model<IGroup>('Group', GroupSchema);

