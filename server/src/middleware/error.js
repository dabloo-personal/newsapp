import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';
import { langOf, translateMessage } from '../utils/i18n.js';

export const notFound = () => {
  throw new HttpError(404, 'यह पेज नहीं मिला');
};

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const lang = langOf(req);
  let status = err.status || 500;
  let message = err.message;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => translateMessage(e.message, lang))
      .join(', ');
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = 'अमान्य अनुरोध';
  } else if (err.code === 11000) {
    status = 409;
    message = 'यह प्रविष्टि पहले से मौजूद है';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'अमान्य JSON';
  }

  if (status >= 500) {
    console.error(err);
    if (env.isProd) message = 'सर्वर में कुछ गड़बड़ हुई';
  }
  res.status(status).json({ message: translateMessage(message, lang) });
}
