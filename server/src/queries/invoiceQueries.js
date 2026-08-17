import { Invoice } from '../models/Invoice.js';
import { InvoiceItem } from '../models/InvoiceItem.js';
import { ItemEvent } from '../models/ItemEvent.js';
import { nextCode } from '../models/Counter.js';

export async function getInvoicesByGatePass(gatePassId) {
  return Invoice.find({ gatePassId }).sort({ createdAt: 1 }).lean();
}

export async function createInvoice(gatePassId, fileInfo, meta) {
  return Invoice.create({
    gatePassId,
    filePath: fileInfo.path,
    fileOriginalName: fileInfo.originalname,
    fileMimeType: fileInfo.mimetype,
    fileSizeBytes: fileInfo.size,
    supplierName: meta.supplierName,
    invoiceNumber: meta.invoiceNumber,
    invoiceDate: meta.invoiceDate,
  });
}

export async function getInvoiceById(id) {
  return Invoice.findById(id).lean();
}

export async function getItemsByGatePass(gatePassId) {
  return InvoiceItem.find({ gatePassId }).sort({ createdAt: 1 }).lean();
}

export async function getItemsByInvoice(invoiceId) {
  return InvoiceItem.find({ invoiceId }).sort({ createdAt: 1 }).lean();
}

export async function createItem(invoiceId, gatePassId, data) {
  const itemCode = await nextCode('invoice_item', 'IT');
  return InvoiceItem.create({
    invoiceId,
    gatePassId,
    itemCode,
    partNumber: data.partNumber,
    internalPartNumber: data.internalPartNumber || null,
    quantity: data.quantity,
  });
}

export async function updateItem(id, data) {
  return InvoiceItem.findByIdAndUpdate(
    id,
    { partNumber: data.partNumber, internalPartNumber: data.internalPartNumber || null, quantity: data.quantity },
    { new: true }
  ).lean();
}

export async function getItemById(id) {
  const item = await InvoiceItem.findById(id).lean();
  if (!item) return null;
  const invoice = await Invoice.findById(item.invoiceId).lean();
  return { ...item, supplierName: invoice?.supplierName, invoiceNumber: invoice?.invoiceNumber, invoiceDate: invoice?.invoiceDate };
}

export async function updateItemStatus(id, status) {
  return InvoiceItem.findByIdAndUpdate(id, { status }, { new: true }).lean();
}

export async function markItemPosted(id) {
  return InvoiceItem.findByIdAndUpdate(id, { posted: true, postedAt: new Date() }, { new: true }).lean();
}

export async function addItemEvent(invoiceItemId, eventType, description) {
  return ItemEvent.create({ invoiceItemId, eventType, description: description || null });
}

export async function getItemEvents(invoiceItemId) {
  return ItemEvent.find({ invoiceItemId }).sort({ createdAt: 1 }).lean();
}
