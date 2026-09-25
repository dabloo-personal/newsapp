import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

export const ROLES = ['user', 'editor', 'admin'];

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'नाम ज़रूरी है'],
      trim: true,
      maxlength: [60, 'नाम 60 अक्षरों से छोटा होना चाहिए'],
    },
    email: {
      type: String,
      required: [true, 'ईमेल ज़रूरी है'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'सही ईमेल दर्ज करें'],
    },
    password: {
      type: String,
      required: [true, 'पासवर्ड ज़रूरी है'],
      minlength: [8, 'पासवर्ड कम से कम 8 अक्षर का होना चाहिए'],
      select: false,
    },
    role: { type: String, enum: ROLES, default: 'user' },
    bookmarks: [{ type: Schema.Types.ObjectId, ref: 'Article' }],
  },
  { timestamps: true }
);

// Length validation runs on the plain text first; hashing happens after validation.
userSchema.pre('save', async function hashPassword() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

userSchema.methods.matchesPassword = function matchesPassword(plain) {
  return bcrypt.compare(plain, this.password);
};

export const User = mongoose.model('User', userSchema);
