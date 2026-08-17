import mongoose from 'mongoose';

const itemEventSchema = new mongoose.Schema({
  invoiceItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InvoiceItem', required: true },
  eventType: { type: String, enum: ['quarantine', 'grn', 'posted'], required: true },
  description: { type: String, default: null },
}, { timestamps: true });

export const ItemEvent = mongoose.model('ItemEvent', itemEventSchema);
