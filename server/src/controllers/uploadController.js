import { HttpError } from '../utils/HttpError.js';

export async function uploadImage(req, res) {
  const { file } = req.body || {};
  if (!file) throw new HttpError(400, 'कोई फ़ाइल नहीं मिली');

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || 'ezj0mde9';
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || process.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'efgh0aig';

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data.secure_url) {
      return res.json({ url: data.secure_url });
    }

    console.error('Cloudinary API error:', data);
    throw new HttpError(500, data?.error?.message || 'Cloudinary upload failed');
  } catch (err) {
    if (err instanceof HttpError) throw err;
    console.error('Server image upload failed:', err.message);
    throw new HttpError(500, 'इमेज अपलोड विफल रहा: ' + err.message);
  }
}
