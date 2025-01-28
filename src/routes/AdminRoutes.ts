import express, { Request, Response, NextFunction } from "express";
import {
  CreateVendor,
  DeleteCustomerAccount,
  GetVendor,
  GetVendorById,
  RefreshToken,
} from "../controllers";
import { images } from ".";
const router = express.Router();

router.get("/RefreshToken", RefreshToken);
router.post("/vendor", images, CreateVendor);
router.get("/vendor", GetVendor);
router.get("/vendor/:id", GetVendorById);
router.delete("/user/deleteCustomer/:customerID", DeleteCustomerAccount);
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: "Hello from  Admin" });
});
export { router as AdminRoute };
