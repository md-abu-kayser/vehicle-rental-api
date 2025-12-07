import { Router } from "express";
import { VehicleController } from "./vehicle.controller";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validation.middleware";
import { createVehicleSchema, updateVehicleSchema } from "./vehicle.validation";

const router = Router();

// Public routes
router.get("/", VehicleController.getAllVehicles);
router.get("/:vehicleId", VehicleController.getVehicleById);

// Admin only routes (require authentication and admin role)
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(createVehicleSchema),
  VehicleController.createVehicle
);

router.put(
  "/:vehicleId",
  authenticate,
  authorize("admin"),
  validate(updateVehicleSchema),
  VehicleController.updateVehicle
);

router.delete(
  "/:vehicleId",
  authenticate,
  authorize("admin"),
  VehicleController.deleteVehicle
);

export default router;
