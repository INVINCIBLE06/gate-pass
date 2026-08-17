import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  gatePassId: { type: mongoose.Schema.Types.ObjectId, ref: 'GatePass', required: true },
  itemCode: { type: String, required: true, unique: true },
  partNumber: { type: String, required: true },
  internalPartNumber: { type: String, default: null },
  quantity: { type: Number, required: true, min: 1 },
  status: {
    type: String,
    enum: ['pending_qc', 'quarantine', 'grn'],
    default: 'pending_qc',
  },
  posted: { type: Boolean, default: false },
  postedAt: { type: Date, default: null },
}, { timestamps: true });

export const InvoiceItem = mongoose.model('InvoiceItem', invoiceItemSchema);
