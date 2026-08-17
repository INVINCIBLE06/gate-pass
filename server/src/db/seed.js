import bcrypt from 'bcrypt';
import { User } from '../models/User.js';

export async function seedAdmin() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await User.findOneAndUpdate(
    { email: ADMIN_EMAIL.toLowerCase() },
    { name: ADMIN_NAME || 'Admin', email: ADMIN_EMAIL.toLowerCase(), passwordHash: hash, role: 'admin', isActive: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Admin ready: ${ADMIN_EMAIL}`);
}
