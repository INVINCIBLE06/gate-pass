import bcrypt from 'bcrypt';
import { asyncHandler } from '../middleware/auth.js';
import { listEmployees, createEmployee, setEmployeeActive } from '../queries/employeeQueries.js';

export const getEmployees = asyncHandler(async (req, res) => {
  res.json(await listEmployees());
});

export const addEmployee = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });

  const hash = await bcrypt.hash(password, 12);
  try {
    const employee = await createEmployee(name, email, hash);
    res.status(201).json(employee);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already in use' });
    throw err;
  }
});

export const toggleEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  if (typeof is_active !== 'boolean') return res.status(400).json({ error: 'is_active (boolean) required' });

  const emp = await setEmployeeActive(id, is_active);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  res.json(emp);
});
