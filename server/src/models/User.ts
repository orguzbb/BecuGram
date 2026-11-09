import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  phoneNumber: string;
  telegramChatId?: string;
  telegramUserId?: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: Date;
  privacySettings: {
    lastSeenVisibility: 'everyone' | 'contacts' | 'nobody';
    phoneVisibility: 'everyone' | 'contacts' | 'nobody';
    profilePhotoVisibility: 'everyone' | 'contacts' | 'nobody';
  };
  notificationSettings: {
    privateChats: boolean;
    groupChats: boolean;
    soundEnabled: boolean;
    messagePreview: boolean;
  };
  appearanceSettings: {
    theme: 'dark' | 'light' | 'system';
    accentColor: string;
    fontSize: 'small' | 'medium' | 'large';
  };
  blockedUsers: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    telegramChatId: {
      type: String,
      sparse: true,
      index: true,
    },
    telegramUserId: {
      type: String,
      sparse: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: 150,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    privacySettings: {
      lastSeenVisibility: {
        type: String,
        enum: ['everyone', 'contacts', 'nobody'],
        default: 'everyone',
      },
      phoneVisibility: {
        type: String,
        enum: ['everyone', 'contacts', 'nobody'],
        default: 'contacts',
      },
      profilePhotoVisibility: {
        type: String,
        enum: ['everyone', 'contacts', 'nobody'],
        default: 'everyone',
      },
    },
    notificationSettings: {
      privateChats: { type: Boolean, default: true },
      groupChats: { type: Boolean, default: true },
      soundEnabled: { type: Boolean, default: true },
      messagePreview: { type: Boolean, default: true },
    },
    appearanceSettings: {
      theme: {
        type: String,
        enum: ['dark', 'light', 'system'],
        default: 'dark',
      },
      accentColor: {
        type: String,
        default: '#35CBA0', // mint
      },
      fontSize: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium',
      },
    },
    blockedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Never expose sensitive fields in public JSON
UserSchema.methods.toPublicJSON = function (viewerIsOwner: boolean = false) {
  const obj = this.toObject();
  if (!viewerIsOwner && obj.privacySettings?.phoneVisibility === 'nobody') {
    delete obj.phoneNumber;
  }
  delete obj.telegramChatId;
  delete obj.telegramUserId;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model<IUser>('User', UserSchema);

