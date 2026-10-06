import mongoose from 'mongoose';
import { makeSlug } from '../utils/slug.js';

const { Schema } = mongoose;

export const STATUSES = ['draft', 'published'];

const httpUrl = {
  validator: (v) => !v || /^https?:\/\/\S+$/i.test(v) || /^data:image\/[a-zA-Z+-]+;base64,.+/i.test(v),
  message: 'इमेज लिंक सही होना चाहिए (http://, https:// या डिवाइस की फोटो)',
};

const articleSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'शीर्षक ज़रूरी है'],
      trim: true,
      maxlength: [200, 'शीर्षक 200 अक्षरों से छोटा होना चाहिए'],
    },
    slug: { type: String, unique: true, trim: true },
    summary: {
      type: String,
      required: [true, 'सार ज़रूरी है'],
      trim: true,
      maxlength: [400, 'सार 400 अक्षरों से छोटा होना चाहिए'],
    },
    body: {
      type: String,
      required: [true, 'खबर का मुख्य हिस्सा ज़रूरी है'],
      trim: true,
      maxlength: [50000, 'खबर बहुत लंबी है'],
    },
    image: { type: String, trim: true, default: '', validate: httpUrl },
    imageAlt: { type: String, trim: true, default: '', maxlength: [200, 'इमेज का विवरण 200 अक्षरों से छोटा होना चाहिए'] },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: [true, 'श्रेणी चुनें'] },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, trim: true, default: 'नवभारत डेस्क', maxlength: [80, 'लेखक का नाम 80 अक्षरों से छोटा होना चाहिए'] },
    tags: {
      type: [{ type: String, trim: true, maxlength: [30, 'टैग 30 अक्षरों से छोटा होना चाहिए'] }],
      validate: [(v) => v.length <= 10, 'अधिकतम 10 टैग जोड़ सकते हैं'],
    },
    // Optional English version. Title, summary and body are all-or-nothing (see pre-validate).
    en: {
      title: { type: String, trim: true, maxlength: [200, 'शीर्षक 200 अक्षरों से छोटा होना चाहिए'] },
      summary: { type: String, trim: true, maxlength: [400, 'सार 400 अक्षरों से छोटा होना चाहिए'] },
      body: { type: String, trim: true, maxlength: [50000, 'खबर बहुत लंबी है'] },
      imageAlt: { type: String, trim: true, maxlength: [200, 'इमेज का विवरण 200 अक्षरों से छोटा होना चाहिए'] },
      tags: {
        type: [{ type: String, trim: true, maxlength: [30, 'टैग 30 अक्षरों से छोटा होना चाहिए'] }],
        validate: [(v) => v.length <= 10, 'अधिकतम 10 टैग जोड़ सकते हैं'],
      },
    },
    isBreaking: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: STATUSES, default: 'published' },
    views: { type: Number, default: 0, min: 0 },
    readingTime: { type: Number, default: 1 },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ category: 1, status: 1, publishedAt: -1 });
articleSchema.index({ status: 1, views: -1 });

articleSchema.pre('validate', function prepare() {
  if (!this.slug) this.slug = makeSlug();
  if (this.isModified('body')) {
    const words = this.body.split(/\s+/).filter(Boolean).length;
    this.readingTime = Math.max(1, Math.ceil(words / 200));
  }
  if (this.status === 'published' && !this.publishedAt) this.publishedAt = new Date();

  const filled = [this.en?.title, this.en?.summary, this.en?.body].filter(Boolean).length;
  if (filled > 0 && filled < 3) {
    this.invalidate('en', 'अंग्रेज़ी अनुवाद के लिए शीर्षक, सार और खबर तीनों ज़रूरी हैं');
  }
});

export const Article = mongoose.model('Article', articleSchema);
