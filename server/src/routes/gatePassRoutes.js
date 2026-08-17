import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  getDashboard, createGatePassWithInvoices, getGatePass, searchGatePasses,
  addInvoice, addItem, editItem, startUnloading,
  getQcItems, routeItem, postItem, getItemDetail, checkoutTransition
} from '../controllers/gatePassController.js';

const router = Router();
router.use(requireAuth);

router.get('/dashboard', getDashboard);
router.post('/', upload.array('files'), createGatePassWithInvoices);
router.get('/search', searchGatePasses);
router.get('/:code', getGatePass);
router.post('/:code/invoices', upload.single('file'), addInvoice);
router.post('/:code/items', addItem);
router.put('/:code/items/:itemId', editItem);
router.post('/:code/unloading/start', startUnloading);
router.get('/:code/qc', getQcItems);
router.patch('/:code/items/:itemId/route', routeItem);
router.post('/:code/items/:itemId/post', postItem);
router.get('/:code/items/:itemId', getItemDetail);
router.post('/:code/checkout', checkoutTransition);

export default router;
