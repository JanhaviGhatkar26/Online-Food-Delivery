import express, { Request, Response, NextFunction } from "express";
import {
  UpdateAddressToCustomer,
  DeleteAddressById,
  GeteAddressByID,
} from "../controllers";
import { Authenticate } from "../middlewares";

const router = express.Router();
/* ------------------- Authentication --------------------- */
router.use(Authenticate);
router.get("/:addressId?", GeteAddressByID);
router.patch("/update/:addressId", UpdateAddressToCustomer);
router.delete("/:addressId", DeleteAddressById);
export { router as CustomerAddressesRoutes };
