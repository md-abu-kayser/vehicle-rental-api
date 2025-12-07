import { z } from "zod";

export const createVehicleSchema = z.object({
  body: z.object({
    vehicle_name: z.string().min(1, "Vehicle name is required"),
    type: z.enum(["car", "bike", "van", "SUV"], {
      errorMap: () => ({ message: "Type must be car, bike, van, or SUV" }),
    }),
    registration_number: z.string().min(1, "Registration number is required"),
    daily_rent_price: z.number().positive("Daily rent price must be positive"),
    availability_status: z
      .enum(["available", "booked"])
      .optional()
      .default("available"),
  }),
});

export const updateVehicleSchema = z.object({
  body: z.object({
    vehicle_name: z.string().min(1).optional(),
    type: z.enum(["car", "bike", "van", "SUV"]).optional(),
    registration_number: z.string().min(1).optional(),
    daily_rent_price: z.number().positive().optional(),
    availability_status: z.enum(["available", "booked"]).optional(),
  }),
  params: z.object({
    vehicleId: z.string(),
  }),
});
