import { Router } from "express";
import { BookingController } from "./booking.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validation.middleware";
import { createBookingSchema, updateBookingSchema } from "./booking.validation";

const router = Router();

// All Routes Require Authentication
router.use(authenticate);

router.post(
  "/",
  validate(createBookingSchema),
  BookingController.createBooking,
);

router.get("/", BookingController.getAllBookings);

router.put(
  "/:bookingId",
  validate(updateBookingSchema),
  BookingController.updateBooking,
);

export default router;
