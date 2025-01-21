import express, { Request, Response, NextFunction } from "express";
import {
  AddFood,
  GetCurrentOrders,
  GetFoods,
  GetOrderDetails,
  GetVendorProfile,
  ProcessOrder,
  UpdateVendorCoverImage,
  UpdateVendorProfile,
  UpdateVendorService,
  VendorLogin,
} from "../controllers";
import { Authenticate } from "../middlewares";
const router = express.Router();

import { images } from ".";

// const imageStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "images"); // Destination folder
//   },
//   filename: function (req, file, cb) {
//     console.log(file.originalname);
//     const safeFilename =
//       Date.now() + "_" + file.originalname.replace(/[:\s]+|[^\w.-]+/g, "_");
//     console.log(safeFilename);
//     cb(null, safeFilename);
//   },
// });

// const images = multer({ storage: imageStorage }).array("images", 10); // Expecting an array of files under "images"

router.post("/login", VendorLogin);

router.use(Authenticate);
router.get("/profile", GetVendorProfile);
router.patch("/profile", UpdateVendorProfile);
router.patch("/service", UpdateVendorService);
router.patch("/coverimage", images, UpdateVendorCoverImage);

// router.post("/food", AddFood);
router.post("/food", images, AddFood);
router.get("/foods", GetFoods);

//Orders
router.get("/orders", GetCurrentOrders);
router.put("/order/:id/process", ProcessOrder);
router.get("/order/:id", GetOrderDetails);
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: "Hello from  Vendor" });
});

export { router as VendorRoute };
