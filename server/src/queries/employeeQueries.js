import { User } from '../models/User.js';

export async function listEmployees() {
  return User.find({ role: 'employee' }).select('-passwordHash').sort({ createdAt: -1 }).lean();
}

export async function createEmployee(name, email, passwordHash) {
  const user = await User.create({ name, email, passwordHash, role: 'employee' });
  const { passwordHash: _, ...safe } = user.toObject();
  return safe;
}

export async function setEmployeeActive(id, isActive) {
  return User.findOneAndUpdate(
    { _id: id, role: 'employee' },
    { isActive },
    { new: true }
  ).select('-passwordHash').lean();
}
