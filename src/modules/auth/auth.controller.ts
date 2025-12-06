import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { successResponse } from "../../utils/apiResponse";

export class AuthController {
  static async signup(req: Request, res: Response) {
    try {
      const user = await AuthService.signup(req.body);

      res
        .status(201)
        .json(successResponse("User registered successfully", user));
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async signin(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.signin(email, password);

      res.status(200).json(successResponse("Login successful", result));
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }
}
