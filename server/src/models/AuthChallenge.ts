import mongoose, { Schema, Document } from 'mongoose';

export type ChallengeStatus = 'PENDING_PAIRING' | 'PAIRED' | 'VERIFIED' | 'EXPIRED';

export interface IAuthChallenge extends Document {
  phoneNumber: string;
  pairingToken: string;
  otpHash?: string;
  telegramChatId?: string;
  telegramUserId?: string;
  status: ChallengeStatus;
  attempts: number;
  pairedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

const AuthChallengeSchema = new Schema<IAuthChallenge>(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    pairingToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    otpHash: {
      type: String,
    },
    telegramChatId: {
      type: String,
    },
    telegramUserId: {
      type: String,
    },
    status: {
      type: String,
      enum: ['PENDING_PAIRING', 'PAIRED', 'VERIFIED', 'EXPIRED'],
      default: 'PENDING_PAIRING',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    pairedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL auto-cleanup
    },
  },
  {
    timestamps: true,
  }
);

export const AuthChallenge = mongoose.model<IAuthChallenge>('AuthChallenge', AuthChallengeSchema);

