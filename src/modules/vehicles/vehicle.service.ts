import { pool } from "../../config/db";

export class VehicleService {
  static async createVehicle(vehicleData: {
    vehicle_name: string;
    type: string;
    registration_number: string;
    daily_rent_price: number;
    availability_status: string;
  }) {
    // Check if registration number exists
    const existingVehicle = await pool.query(
      "SELECT * FROM vehicles WHERE registration_number = $1",
      [vehicleData.registration_number]
    );

    if (existingVehicle.rows.length > 0) {
      throw new Error("Vehicle with this registration number already exists");
    }

    const result = await pool.query(
      `INSERT INTO vehicles 
       (vehicle_name, type, registration_number, daily_rent_price, availability_status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        vehicleData.vehicle_name,
        vehicleData.type,
        vehicleData.registration_number,
        vehicleData.daily_rent_price,
        vehicleData.availability_status,
      ]
    );

    return result.rows[0];
  }

  static async getAllVehicles() {
    const result = await pool.query(
      "SELECT * FROM vehicles ORDER BY created_at DESC"
    );
    return result.rows;
  }

  static async getVehicleById(id: number) {
    const result = await pool.query("SELECT * FROM vehicles WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      throw new Error("Vehicle not found");
    }

    return result.rows[0];
  }

  static async updateVehicle(id: number, updateData: any) {
    // Check if vehicle exists
    const vehicleExists = await pool.query(
      "SELECT * FROM vehicles WHERE id = $1",
      [id]
    );

    if (vehicleExists.rows.length === 0) {
      throw new Error("Vehicle not found");
    }

    // Check if registration number is being updated and if it already exists
    if (updateData.registration_number) {
      const existingRegistration = await pool.query(
        "SELECT * FROM vehicles WHERE registration_number = $1 AND id != $2",
        [updateData.registration_number, id]
      );

      if (existingRegistration.rows.length > 0) {
        throw new Error("Registration number already exists");
      }
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    if (updateData.vehicle_name) {
      updates.push(`vehicle_name = $${valueIndex}`);
      values.push(updateData.vehicle_name);
      valueIndex++;
    }

    if (updateData.type) {
      updates.push(`type = $${valueIndex}`);
      values.push(updateData.type);
      valueIndex++;
    }

    if (updateData.registration_number) {
      updates.push(`registration_number = $${valueIndex}`);
      values.push(updateData.registration_number);
      valueIndex++;
    }

    if (updateData.daily_rent_price) {
      updates.push(`daily_rent_price = $${valueIndex}`);
      values.push(updateData.daily_rent_price);
      valueIndex++;
    }

    if (updateData.availability_status) {
      updates.push(`availability_status = $${valueIndex}`);
      values.push(updateData.availability_status);
      valueIndex++;
    }

    updates.push(`updated_at = NOW()`);

    values.push(id);

    const query = `
      UPDATE vehicles 
      SET ${updates.join(", ")} 
      WHERE id = $${valueIndex} 
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async deleteVehicle(id: number) {
    // Check for active bookings
    const activeBookings = await pool.query(
      `SELECT COUNT(*) FROM bookings 
       WHERE vehicle_id = $1 AND status = 'active'`,
      [id]
    );

    if (parseInt(activeBookings.rows[0].count) > 0) {
      throw new Error("Cannot delete vehicle with active bookings");
    }

    const result = await pool.query(
      "DELETE FROM vehicles WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error("Vehicle not found");
    }

    return { id };
  }
}
