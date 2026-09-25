import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/HttpError.js';

async function userFromRequest(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const { id } = jwt.verify(header.slice(7), env.jwtSecret);
    return await User.findById(id);
  } catch {
    return null;
  }
}

/** Attaches req.user when a valid token is present; never rejects. */
export async function optionalAuth(req, _res, next) {
  req.user = await userFromRequest(req);
  next();
}

export async function protect(req, _res, next) {
  const user = await userFromRequest(req);
  if (!user) return next(new HttpError(401, 'कृपया लॉगिन करें'));
  req.user = user;
  next();
}

export const restrictTo =
  (...roles) =>
  (req, _res, next) =>
    roles.includes(req.user?.role) ? next() : next(new HttpError(403, 'आपको इसकी अनुमति नहीं है'));
