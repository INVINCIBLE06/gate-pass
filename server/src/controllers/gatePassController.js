import { asyncHandler } from '../middleware/auth.js';
import {
  listGatePasses, getGatePassByCode, getGatePassByVehicle,
  createGatePass, updateGatePassStatus, assertGatePassUnlocked
} from '../queries/gatePassQueries.js';
import {
  getInvoicesByGatePass, createInvoice, getItemsByGatePass,
  getItemsByInvoice, createItem, updateItem, getItemById,
  updateItemStatus, markItemPosted, addItemEvent, getItemEvents
} from '../queries/invoiceQueries.js';

export const getDashboard = asyncHandler(async (req, res) => {
  res.json(await listGatePasses());
});

export const createGatePassWithInvoices = asyncHandler(async (req, res) => {
  const {
    vehicleNumber, vehicleType, driverName, driverPhone, driverLicense,
    poNumber, transporterName, fromCity, numberOfPackages, grossWeightKg,
    sealNumber, remarks, invoices
  } = req.body;

  if (!vehicleNumber || !poNumber) return res.status(400).json({ error: 'vehicleNumber and poNumber required' });

  const parsedInvoices = typeof invoices === 'string' ? JSON.parse(invoices) : (invoices || []);
  const files = req.files || [];

  const gp = await createGatePass({
    vehicleNumber, vehicleType, driverName, driverPhone, driverLicense,
    poNumber, transporterName, fromCity,
    numberOfPackages: numberOfPackages ? parseInt(numberOfPackages) : null,
    grossWeightKg: grossWeightKg ? parseFloat(grossWeightKg) : null,
    sealNumber, remarks,
  });

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const meta = parsedInvoices[i] || {};
    const inv = await createInvoice(gp._id, file, {
      supplierName: meta.supplierName || 'Unknown',
      invoiceNumber: meta.invoiceNumber || `INV-${Date.now()}`,
      invoiceDate: meta.invoiceDate || new Date().toISOString().split('T')[0],
    });
    for (const item of (meta.items || [])) {
      await createItem(inv._id, gp._id, item);
    }
  }
  res.status(201).json(gp);
});

export const getGatePass = asyncHandler(async (req, res) => {
  const gp = await getGatePassByCode(req.params.code);
  if (!gp) return res.status(404).json({ error: 'Gate pass not found' });
  const invoices = await getInvoicesByGatePass(gp._id);
  const withItems = await Promise.all(invoices.map(async inv => ({ ...inv, items: await getItemsByInvoice(inv._id) })));
  res.json({ ...gp, invoices: withItems });
});

export const searchGatePasses = asyncHandler(async (req, res) => {
  const { vehicle } = req.query;
  if (!vehicle) return res.status(400).json({ error: 'vehicle query param required' });
  res.json(await getGatePassByVehicle(vehicle));
});

export const addInvoice = asyncHandler(async (req, res) => {
  const gp = await getGatePassByCode(req.params.code);
  if (!gp) return res.status(404).json({ error: 'Gate pass not found' });
  assertGatePassUnlocked(gp);
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'Invoice file required' });
  const { supplierName, invoiceNumber, invoiceDate } = req.body;
  res.status(201).json(await createInvoice(gp._id, file, { supplierName, invoiceNumber, invoiceDate }));
});

export const addItem = asyncHandler(async (req, res) => {
  const gp = await getGatePassByCode(req.params.code);
  if (!gp) return res.status(404).json({ error: 'Gate pass not found' });
  assertGatePassUnlocked(gp);
  const { invoiceId, partNumber, internalPartNumber, quantity } = req.body;
  if (!invoiceId || !partNumber || !quantity) return res.status(400).json({ error: 'invoiceId, partNumber, quantity required' });
  res.status(201).json(await createItem(invoiceId, gp._id, { partNumber, internalPartNumber, quantity: parseInt(quantity) }));
});

export const editItem = asyncHandler(async (req, res) => {
  const item = await getItemById(req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const gp = await getGatePassByCode(req.params.code);
  if (!gp) return res.status(404).json({ error: 'Gate pass not found' });
  assertGatePassUnlocked(gp);
  const { partNumber, internalPartNumber, quantity } = req.body;
  res.json(await updateItem(item._id, { partNumber, internalPartNumber, quantity: parseInt(quantity) }));
});

export const startUnloading = asyncHandler(async (req, res) => {
  const gp = await getGatePassByCode(req.params.code);
  if (!gp) return res.status(404).json({ error: 'Gate pass not found' });
  assertGatePassUnlocked(gp);
  if (gp.status !== 'in_checking') return res.status(409).json({ error: 'Gate pass not in checking state' });
  res.json(await updateGatePassStatus(gp._id, 'unloading_started'));
});

export const getQcItems = asyncHandler(async (req, res) => {
  const gp = await getGatePassByCode(req.params.code);
  if (!gp) return res.status(404).json({ error: 'Gate pass not found' });
  res.json({ gatePass: gp, items: await getItemsByGatePass(gp._id) });
});

export const routeItem = asyncHandler(async (req, res) => {
  const { code, itemId } = req.params;
  const { status, description } = req.body;
  if (!['quarantine', 'grn'].includes(status)) return res.status(400).json({ error: 'status must be quarantine or grn' });
  const gp = await getGatePassByCode(code);
  if (!gp) return res.status(404).json({ error: 'Gate pass not found' });
  assertGatePassUnlocked(gp);
  const item = await getItemById(itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (!description) return res.status(400).json({ error: 'description required' });
  const updated = await updateItemStatus(itemId, status);
  const event = await addItemEvent(itemId, status, description);
  res.json({ item: updated, event });
});

export const postItem = asyncHandler(async (req, res) => {
  const { code, itemId } = req.params;
  const gp = await getGatePassByCode(code);
  if (!gp) return res.status(404).json({ error: 'Gate pass not found' });
  assertGatePassUnlocked(gp);
  const item = await getItemById(itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (item.status !== 'grn') return res.status(409).json({ error: 'Item must be in grn status to post' });
  if (item.posted) return res.status(409).json({ error: 'Item already posted' });
  const updated = await markItemPosted(itemId);
  const event = await addItemEvent(itemId, 'posted', 'Posted to Digital Drive');
  res.json({ item: updated, event });
});

export const getItemDetail = asyncHandler(async (req, res) => {
  const item = await getItemById(req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const events = await getItemEvents(req.params.itemId);
  res.json({ item, events });
});

export const checkoutTransition = asyncHandler(async (req, res) => {
  const gp = await getGatePassByCode(req.params.code);
  if (!gp) return res.status(404).json({ error: 'Gate pass not found' });
  assertGatePassUnlocked(gp);
  const transitions = { unloading_started: 'unloading_over', unloading_over: 'checked_out' };
  const next = transitions[gp.status];
  if (!next) return res.status(409).json({ error: `Cannot transition from status: ${gp.status}` });
  res.json(await updateGatePassStatus(gp._id, next));
});
