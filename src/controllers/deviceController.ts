import { Request, Response } from "express";
import Device from "../models/Device";

type DeviceRequest = Request & { userId?: string };

function getUserId(req: DeviceRequest): string | undefined {
  return req.header("x-user-id") || req.userId;
}

function syncPowerStatus(body: Record<string, any>) {
  const update = { ...body };

  if (typeof update.power === "boolean") {
    update.status = update.power ? "Online" : "Offline";
  } else if (update.status === "Online") {
    update.power = true;
  } else if (update.status === "Offline") {
    update.power = false;
  }

  return update;
}

function cleanTypeSpecificFields(body: Record<string, any>) {
  const data = { ...body };

  if (data.type === "Light") {
    data.brightness = Number(data.brightness || 80);
    delete data.battery;
    delete data.temperature;
    delete data.speed;
    delete data.locked;
  }

  if (data.type === "Fan") {
    data.speed = data.speed || "Medium";
    delete data.battery;
    delete data.temperature;
    delete data.brightness;
    delete data.locked;
  }

  if (data.type === "Thermostat") {
    data.temperature = Number(data.temperature || 24);
    delete data.battery;
    delete data.brightness;
    delete data.speed;
    delete data.locked;
  }

  if (data.type === "Alarm" || data.type === "Camera") {
    data.battery = Number(data.battery || 90);
    delete data.temperature;
    delete data.brightness;
    delete data.speed;
    delete data.locked;
  }

  if (data.type === "Lock") {
    data.battery = Number(data.battery || 90);
    data.locked = typeof data.locked === "boolean" ? data.locked : true;
    delete data.temperature;
    delete data.brightness;
    delete data.speed;
  }

  return data;
}

export async function getDevices(req: DeviceRequest, res: Response): Promise<void> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, message: "Login required" });
    return;
  }

  const { search, type, room, status, validation } = req.query;
  const filter: Record<string, unknown> = { owner: userId };

  if (search) filter.name = { $regex: String(search), $options: "i" };
  if (type && type !== "All") filter.type = type;
  if (room && room !== "All") filter.room = room;
  if (status && status !== "All") filter.status = status;
  if (validation && validation !== "All") filter.validation = validation;

  const devices = await Device.find(filter).sort({ updatedAt: -1 });
  res.json({ success: true, count: devices.length, devices });
}

export async function createDevice(req: DeviceRequest, res: Response): Promise<void> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, message: "Login required" });
    return;
  }

  const prepared = cleanTypeSpecificFields(syncPowerStatus({ ...req.body, owner: userId, lastUpdated: new Date() }));
  const device = await Device.create(prepared);
  res.status(201).json({ success: true, device });
}

export async function updateDevice(req: DeviceRequest, res: Response): Promise<void> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, message: "Login required" });
    return;
  }

  const update = syncPowerStatus({ ...req.body, lastUpdated: new Date() });
  const device = await Device.findOneAndUpdate(
    { _id: req.params.id, owner: userId },
    update,
    { new: true, runValidators: true }
  );

  if (!device) {
    res.status(404).json({ success: false, message: "Device not found" });
    return;
  }

  res.json({ success: true, device });
}

export async function deleteDevice(req: DeviceRequest, res: Response): Promise<void> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, message: "Login required" });
    return;
  }

  const device = await Device.findOneAndDelete({ _id: req.params.id, owner: userId });
  if (!device) {
    res.status(404).json({ success: false, message: "Device not found" });
    return;
  }
  res.json({ success: true, message: "Device deleted" });
}

export async function seedDevices(req: DeviceRequest, res: Response): Promise<void> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, message: "Login required" });
    return;
  }

  const count = await Device.countDocuments({ owner: userId });
  if (count > 0) {
    res.json({ success: true, message: "Sample data already exists for this user" });
    return;
  }

  await Device.insertMany([
    { owner: userId, name: "Living Room Ceiling Light", type: "Light", room: "Living Room", status: "Online", validation: "Validated", power: true, brightness: 85 },
    { owner: userId, name: "Bedroom Thermostat", type: "Thermostat", room: "Bedroom", status: "Online", validation: "Validated", power: true, temperature: 24 },
    { owner: userId, name: "Main Door Smart Lock", type: "Lock", room: "Entrance", status: "Online", validation: "Pending", power: true, battery: 77, locked: true },
    { owner: userId, name: "Kitchen Smoke Alarm", type: "Alarm", room: "Kitchen", status: "Online", validation: "Validated", power: true, battery: 64 },
    { owner: userId, name: "Garage Camera", type: "Camera", room: "Garage", status: "Offline", validation: "Rejected", power: false, battery: 36 },
    { owner: userId, name: "Study Room Fan", type: "Fan", room: "Study", status: "Offline", validation: "Validated", power: false, speed: "Medium" }
  ]);

  res.status(201).json({ success: true, message: "Sample devices created" });
}
