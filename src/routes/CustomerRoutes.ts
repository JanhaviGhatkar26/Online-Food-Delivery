import express, { Request, Response, NextFunction } from "express";
import {
  CustomerLogin,
  CustomerSignUp,
  RequestOtp,
  CustomerVerify,
  EditCustomerProfile,
  GetCustomerProfile,
  // CreateOrder,
  // GetOrderByID,
  // GetOrders,
  // CreateCart,
  // GetCart,
  // DeleteCart,
  // DeleteCartItem,
  DeactiveMyAcc,
} from "../controllers";
import { Authenticate } from "../middlewares";

const router = express.Router();

/* ------------------- Suignup / Create Customer --------------------- */
router.post("/signup", CustomerSignUp);

/* ------------------- Login --------------------- */
router.post("/login", CustomerLogin);

/* ------------------- Authentication --------------------- */
router.use(Authenticate);

/* ------------------- Authentication --------------------- */
router.patch("/verify", CustomerVerify);

/* ------------------- OTP / request OTP --------------------- */
router.get("/otp", RequestOtp);

/* ------------------- Profile --------------------- */
router.get("/profile", GetCustomerProfile);
router.patch("/profile", EditCustomerProfile);
router.delete("/deactivate", DeactiveMyAcc);

// //Cart
// router.post("/cart", CreateCart);
// router.get("/cart", GetCart);
// router.delete("/cart", DeleteCart);
// router.delete("/cart/:vendorId/:cartItemId?", DeleteCartItem);
// // Order
// router.post("/create-order", CreateOrder);
// router.get("/orders", GetOrders);
// router.get("/order/:id", GetOrderByID);
// Payment
export { router as CustomerRoutes };
