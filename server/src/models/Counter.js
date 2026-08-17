import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({ _id: String, value: { type: Number, default: 0 } });

export const Counter = mongoose.model('Counter', counterSchema);

export async function nextCode(name, prefix, pad = 6) {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return `${prefix}-${String(doc.value).padStart(pad, '0')}`;
}
