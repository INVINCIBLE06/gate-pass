import bcrypt from 'bcrypt';
import { connectDB } from './mongoose.js';
import { User } from '../models/User.js';
import 'dotenv/config';

async function setup() {
  await connectDB();
  console.log('Connected to MongoDB.');

  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping admin seed.');
    process.exit(0);
  }

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await User.findOneAndUpdate(
    { email: ADMIN_EMAIL.toLowerCase() },
    { name: ADMIN_NAME || 'Admin', email: ADMIN_EMAIL.toLowerCase(), passwordHash: hash, role: 'admin', isActive: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Admin user upserted: ${ADMIN_EMAIL}`);
  process.exit(0);
}

setup().catch(err => { console.error(err); process.exit(1); });
