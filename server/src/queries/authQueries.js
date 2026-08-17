import { User } from '../models/User.js';

export async function findUserByEmail(email) {
  return User.findOne({ email: email.toLowerCase() }).lean();
}

export async function findUserById(id) {
  return User.findById(id).select('-passwordHash').lean();
}
