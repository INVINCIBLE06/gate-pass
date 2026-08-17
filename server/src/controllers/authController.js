import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByEmail, findUserById } from '../queries/authQueries.js';
import { asyncHandler } from '../middleware/auth.js';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = await findUserByEmail(email);
  if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, COOKIE_OPTS);
  res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
});

export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
};

export const me = asyncHandler(async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await findUserById(payload.id);
  if (!user || !user.isActive) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
});
