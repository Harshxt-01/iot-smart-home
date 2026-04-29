import { Router } from "express";
import { createDevice, deleteDevice, getDevices, seedDevices, updateDevice } from "../controllers/deviceController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);
router.get("/", getDevices);
router.post("/", createDevice);
router.post("/seed", seedDevices);
router.put("/:id", updateDevice);
router.delete("/:id", deleteDevice);

export default router;
