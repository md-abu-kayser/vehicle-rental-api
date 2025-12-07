import { pool } from "../../config/db";

export class BookingService {
  static async createBooking(
    bookingData: {
      vehicle_id: number;
      rent_start_date: string;
      rent_end_date: string;
    },
    customerId: number,
    userRole: string
  ) {
    // Check if vehicle exists and is available
    const vehicleResult = await pool.query(
      "SELECT * FROM vehicles WHERE id = $1",
      [bookingData.vehicle_id]
    );

    if (vehicleResult.rows.length === 0) {
      throw new Error("Vehicle not found");
    }

    const vehicle = vehicleResult.rows[0];

    if (vehicle.availability_status !== "available") {
      throw new Error("Vehicle is not available for booking");
    }

    // Calculate number of days
    const startDate = new Date(bookingData.rent_start_date);
    const endDate = new Date(bookingData.rent_end_date);
    const numberOfDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (numberOfDays <= 0) {
      throw new Error("End date must be after start date");
    }

    // Calculate total price
    const totalPrice = vehicle.daily_rent_price * numberOfDays;

    // Create booking
    const result = await pool.query(
      `INSERT INTO bookings 
       (customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        customerId,
        bookingData.vehicle_id,
        bookingData.rent_start_date,
        bookingData.rent_end_date,
        totalPrice,
        "active",
      ]
    );

    const booking = result.rows[0];

    // Update vehicle status to booked
    await pool.query(
      "UPDATE vehicles SET availability_status = 'booked' WHERE id = $1",
      [bookingData.vehicle_id]
    );

    // Add vehicle details to booking
    booking.vehicle = {
      vehicle_name: vehicle.vehicle_name,
      daily_rent_price: vehicle.daily_rent_price,
    };

    return booking;
  }

  static async getAllBookings(userId: number, userRole: string) {
    let query = "";
    let params: any[] = [];

    if (userRole === "admin") {
      query = `
        SELECT b.*, 
               u.name as customer_name, u.email as customer_email,
               v.vehicle_name, v.registration_number
        FROM bookings b
        JOIN users u ON b.customer_id = u.id
        JOIN vehicles v ON b.vehicle_id = v.id
        ORDER BY b.created_at DESC
      `;
    } else {
      query = `
        SELECT b.*, 
               v.vehicle_name, v.registration_number, v.type
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        WHERE b.customer_id = $1
        ORDER BY b.created_at DESC
      `;
      params = [userId];
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async updateBooking(
    bookingId: number,
    status: string,
    userId: number,
    userRole: string
  ) {
    // Get booking details
    const bookingResult = await pool.query(
      `SELECT b.*, v.availability_status 
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      throw new Error("Booking not found");
    }

    const booking = bookingResult.rows[0];
    const currentDate = new Date();
    const rentStartDate = new Date(booking.rent_start_date);

    // Check permissions
    if (userRole === "customer") {
      if (booking.customer_id !== userId) {
        throw new Error("You can only update your own bookings");
      }

      // Customer can only cancel before start date
      if (status !== "cancelled") {
        throw new Error("Customers can only cancel bookings");
      }

      if (currentDate >= rentStartDate) {
        throw new Error("Cannot cancel booking after start date");
      }
    }

    if (userRole === "admin" && status === "returned") {
      // Admin can mark as returned
      if (booking.status === "returned") {
        throw new Error("Booking is already returned");
      }
    }

    // Update booking status
    const result = await pool.query(
      `UPDATE bookings 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [status, bookingId]
    );

    const updatedBooking = result.rows[0];

    // If booking is cancelled or returned, update vehicle availability
    if (status === "cancelled" || status === "returned") {
      await pool.query(
        `UPDATE vehicles 
         SET availability_status = 'available' 
         WHERE id = $1`,
        [booking.vehicle_id]
      );

      // Add vehicle info to response
      const vehicleResult = await pool.query(
        "SELECT * FROM vehicles WHERE id = $1",
        [booking.vehicle_id]
      );

      updatedBooking.vehicle = {
        availability_status: "available",
      };
    }

    return updatedBooking;
  }

  // Auto-return expired bookings (to be called periodically)
  static async processExpiredBookings() {
    const currentDate = new Date().toISOString().split("T")[0];

    // Find active bookings where rent_end_date has passed
    const expiredBookings = await pool.query(
      `SELECT b.id, b.vehicle_id 
       FROM bookings b
       WHERE b.status = 'active' 
       AND b.rent_end_date < $1`,
      [currentDate]
    );

    for (const booking of expiredBookings.rows) {
      // Mark as returned
      await pool.query(
        "UPDATE bookings SET status = 'returned', updated_at = NOW() WHERE id = $1",
        [booking.id]
      );

      // Update vehicle availability
      await pool.query(
        "UPDATE vehicles SET availability_status = 'available' WHERE id = $1",
        [booking.vehicle_id]
      );
    }

    return expiredBookings.rows.length;
  }
}
