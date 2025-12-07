import { Request, Response } from "express";
import { BookingService } from "./booking.service";
import { successResponse } from "../../utils/apiResponse";
import { AuthRequest } from "../../middleware/auth.middleware";

export class BookingController {
  static async createBooking(req: AuthRequest, res: Response) {
    try {
      const currentUser = req.user!;
      const booking = await BookingService.createBooking(
        req.body,
        currentUser.id,
        currentUser.role
      );

      res
        .status(201)
        .json(successResponse("Booking created successfully", booking));
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getAllBookings(req: AuthRequest, res: Response) {
    try {
      const currentUser = req.user!;
      const bookings = await BookingService.getAllBookings(
        currentUser.id,
        currentUser.role
      );

      const message =
        currentUser.role === "admin"
          ? "Bookings retrieved successfully"
          : "Your bookings retrieved successfully";

      res
        .status(200)
        .json(
          successResponse(
            bookings.length > 0 ? message : "No bookings found",
            bookings
          )
        );
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async updateBooking(req: AuthRequest, res: Response) {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const { status } = req.body;
      const currentUser = req.user!;

      const updatedBooking = await BookingService.updateBooking(
        bookingId,
        status,
        currentUser.id,
        currentUser.role
      );

      let message = "";
      if (status === "cancelled") {
        message = "Booking cancelled successfully";
      } else if (status === "returned") {
        message = "Booking marked as returned. Vehicle is now available";
      }

      res.status(200).json(successResponse(message, updatedBooking));
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
