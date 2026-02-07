import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../../config";
import { pool } from "../../config/db";

export class AuthService {
  static async signup(userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: string;
  }) {
    const { name, email, password, phone, role } = userData;

    // User Exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      throw new Error("User already exists");
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const result = await pool.query(
      `INSERT INTO users (name, email, password, phone, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, phone, role`,
      [name, email.toLowerCase(), hashedPassword, phone, role],
    );

    return result.rows[0];
  }

  static async signin(email: string, password: string) {
    // Find User
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);

    if (result.rows.length === 0) {
      throw new Error("Invalid credentials");
    }
    const user = result.rows[0];

    // Verify Password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Generate Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt_secret,
      { expiresIn: "7d" },
    );

    // Remove Password
    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  }
}
