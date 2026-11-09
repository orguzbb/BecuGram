import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  userId: mongoose.Types.ObjectId;
  contactUserId: mongoose.Types.ObjectId;
  customName?: string;
  createdAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contactUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
  },
  {
    timestamps: true,
  }
);

ContactSchema.index({ userId: 1, contactUserId: 1 }, { unique: true });

export const Contact = mongoose.model<IContact>('Contact', ContactSchema);

