import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  gatePassId: { type: mongoose.Schema.Types.ObjectId, ref: 'GatePass', required: true },
  filePath: { type: String, required: true },
  fileOriginalName: { type: String, required: true },
  fileMimeType: { type: String, required: true },
  fileSizeBytes: { type: Number, required: true },
  supplierName: { type: String, required: true },
  invoiceNumber: { type: String, required: true },
  invoiceDate: { type: Date, required: true },
}, { timestamps: true });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
