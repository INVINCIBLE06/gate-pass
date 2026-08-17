import { GatePass } from '../models/GatePass.js';
import { nextCode } from '../models/Counter.js';

export async function listGatePasses() {
  return GatePass.find().sort({ createdAt: -1 }).lean();
}

export async function getGatePassByCode(code) {
  return GatePass.findOne({ gatePassCode: code }).lean();
}

export async function getGatePassById(id) {
  return GatePass.findById(id).lean();
}

export async function getGatePassByVehicle(vehicleNumber) {
  return GatePass.find({ vehicleNumber: { $regex: vehicleNumber, $options: 'i' } })
    .sort({ createdAt: -1 }).lean();
}

export async function createGatePass(fields) {
  const gatePassCode = await nextCode('gate_pass', 'GP');
  return GatePass.create({ gatePassCode, ...fields });
}

const TS_FIELDS = {
  unloading_started: 'unloadingStartedAt',
  unloading_over:    'unloadingOverAt',
  checked_out:       'checkedOutAt',
};

export async function updateGatePassStatus(id, status) {
  const update = { status, locked: status === 'checked_out' };
  const tsField = TS_FIELDS[status];
  if (tsField) update[tsField] = new Date();
  return GatePass.findByIdAndUpdate(id, update, { new: true }).lean();
}

export function assertGatePassUnlocked(gp) {
  if (gp.locked) {
    const err = new Error('Gate pass is locked (checked out)');
    err.status = 409;
    throw err;
  }
}
