import { z } from "zod";

export const createBookingSchema = z
  .object({
    body: z.object({
      vehicle_id: z.number().int().positive("Vehicle ID must be positive"),
      rent_start_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
      rent_end_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    }),
  })
  .refine(
    (data) =>
      new Date(data.body.rent_end_date) > new Date(data.body.rent_start_date),
    {
      message: "End date must be after start date",
      path: ["body", "rent_end_date"],
    }
  );

export const updateBookingSchema = z.object({
  body: z.object({
    status: z.enum(["cancelled", "returned"]),
  }),
  params: z.object({
    bookingId: z.string(),
  }),
});
