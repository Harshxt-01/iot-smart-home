import mongoose, { Schema, Document, Types } from "mongoose";

export type DeviceType = "Light" | "Thermostat" | "Alarm" | "Camera" | "Lock" | "Fan";
export type DeviceStatus = "Online" | "Offline";
export type ValidationStatus = "Validated" | "Pending" | "Rejected";

export interface IDevice extends Document {
  name: string;
  type: DeviceType;
  room: string;
  owner: Types.ObjectId;
  status: DeviceStatus;
  validation: ValidationStatus;
  power: boolean;
  temperature?: number;
  brightness?: number;
  speed?: "Low" | "Medium" | "High";
  locked?: boolean;
  battery?: number;
  lastUpdated: Date;
}

const DeviceSchema = new Schema<IDevice>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ["Light", "Thermostat", "Alarm", "Camera", "Lock", "Fan"] },
    room: { type: String, required: true, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["Online", "Offline"], default: "Offline" },
    validation: { type: String, enum: ["Validated", "Pending", "Rejected"], default: "Pending" },
    power: { type: Boolean, default: false },
    temperature: { type: Number, min: 10, max: 35 },
    brightness: { type: Number, min: 0, max: 100 },
    speed: { type: String, enum: ["Low", "Medium", "High"] },
    locked: { type: Boolean },
    battery: { type: Number, min: 0, max: 100 },
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model<IDevice>("Device", DeviceSchema);
