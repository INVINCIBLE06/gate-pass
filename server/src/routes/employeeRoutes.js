import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { getEmployees, addEmployee, toggleEmployee } from '../controllers/employeeController.js';

const router = Router();
router.use(requireAuth, requireAdmin);
router.get('/', getEmployees);
router.post('/', addEmployee);
router.patch('/:id', toggleEmployee);

export default router;
