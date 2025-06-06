import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    ip: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Device = mongoose.model('Device', deviceSchema);

export default Device;
