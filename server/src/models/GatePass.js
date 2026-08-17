import mongoose from 'mongoose';

const gatePassSchema = new mongoose.Schema({
  gatePassCode:       { type: String, required: true, unique: true },
  vehicleNumber:      { type: String, required: true },
  vehicleType:        { type: String, enum: ['Truck','Tempo','Container','Mini Truck','Trailer','Others'], default: 'Truck' },
  driverName:         { type: String, default: '' },
  driverPhone:        { type: String, default: '' },
  driverLicense:      { type: String, default: '' },
  poNumber:           { type: String, required: true },
  transporterName:    { type: String, default: '' },
  fromCity:           { type: String, default: '' },
  numberOfPackages:   { type: Number, default: null },
  grossWeightKg:      { type: Number, default: null },
  sealNumber:         { type: String, default: '' },
  remarks:            { type: String, default: '' },
  status: {
    type: String,
    enum: ['in_checking','unloading_started','unloading_over','checked_out'],
    default: 'in_checking',
  },
  locked:             { type: Boolean, default: false },
  unloadingStartedAt: Date,
  unloadingOverAt:    Date,
  checkedOutAt:       Date,
}, { timestamps: true });

export const GatePass = mongoose.model('GatePass', gatePassSchema);
