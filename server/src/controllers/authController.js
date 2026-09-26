import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/HttpError.js';

const signToken = (user) => jwt.sign({ id: user._id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  bookmarks: (u.bookmarks || []).map(String),
});

const isString = (v) => typeof v === 'string';

export async function register(req, res) {
  const { name, email, password } = req.body ?? {};
  if (![name, email, password].every(isString)) {
    throw new HttpError(400, 'नाम, ईमेल और पासवर्ड ज़रूरी हैं');
  }
  if (await User.exists({ email: email.toLowerCase().trim() })) {
    throw new HttpError(409, 'इस ईमेल से खाता पहले से मौजूद है');
  }
  // Role is never taken from the request body: public sign-ups are always readers.
  const user = await User.create({ name, email, password });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body ?? {};
  if (!isString(email) || !isString(password)) {
    throw new HttpError(400, 'ईमेल और पासवर्ड ज़रूरी हैं');
  }
  const id = email.toLowerCase().trim();
  // Local-dev shortcut (see env.simpleAdmin): the ID "admin" means the seeded admin account.
  const lookup = env.simpleAdmin && id === 'admin' ? env.adminEmail : id;
  const user = await User.findOne({ email: lookup }).select('+password');
  if (!user || !(await user.matchesPassword(password))) {
    throw new HttpError(401, 'ईमेल या पासवर्ड गलत है');
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}

export const me = (req, res) => res.json({ user: publicUser(req.user) });
