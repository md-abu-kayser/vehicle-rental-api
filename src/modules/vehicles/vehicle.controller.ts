import { Request, Response } from "express";
import { VehicleService } from "./vehicle.service";
import { successResponse } from "../../utils/apiResponse";

export class VehicleController {
  static async createVehicle(req: Request, res: Response) {
    try {
      const vehicle = await VehicleService.createVehicle(req.body);

      res
        .status(201)
        .json(successResponse("Vehicle created successfully", vehicle));
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getAllVehicles(req: Request, res: Response) {
    try {
      const vehicles = await VehicleService.getAllVehicles();

      res
        .status(200)
        .json(
          successResponse(
            vehicles.length > 0
              ? "Vehicles retrieved successfully"
              : "No vehicles found",
            vehicles
          )
        );
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getVehicleById(req: Request, res: Response) {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const vehicle = await VehicleService.getVehicleById(vehicleId);

      res
        .status(200)
        .json(successResponse("Vehicle retrieved successfully", vehicle));
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async updateVehicle(req: Request, res: Response) {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const vehicle = await VehicleService.updateVehicle(vehicleId, req.body);

      res
        .status(200)
        .json(successResponse("Vehicle updated successfully", vehicle));
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async deleteVehicle(req: Request, res: Response) {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      await VehicleService.deleteVehicle(vehicleId);

      res.status(200).json(successResponse("Vehicle deleted successfully"));
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
