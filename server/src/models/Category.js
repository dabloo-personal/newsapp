import mongoose from 'mongoose';

// `color` maps to a CSS tag modifier on the client (lime is the default).
export const CATEGORY_COLORS = ['lime', 'green', 'orange', 'blue', 'purple', 'red'];

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameEn: { type: String, trim: true, default: '' },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    color: { type: String, enum: CATEGORY_COLORS, default: 'lime' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Category = mongoose.model('Category', categorySchema);
