import mongoose from 'mongoose';
import 'dotenv/config';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gate_pass_db';
  await mongoose.connect(uri);
  console.log('MongoDB connected:', uri);
}

export default mongoose;
