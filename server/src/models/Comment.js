import mongoose from 'mongoose';

const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    article: { type: Schema.Types.ObjectId, ref: 'Article', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    text: {
      type: String,
      required: [true, 'टिप्पणी खाली नहीं हो सकती'],
      trim: true,
      maxlength: [1000, 'टिप्पणी 1000 अक्षरों से छोटी होनी चाहिए'],
    },
  },
  { timestamps: true }
);

export const Comment = mongoose.model('Comment', commentSchema);
