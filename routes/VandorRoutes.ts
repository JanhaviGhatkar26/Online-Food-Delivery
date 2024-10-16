import express, { Request, Response, NextFunction } from "express";
import {
  AddFood,
  GetFoods,
  GetVandorProfile,
  UpdateVandorCoverImage,
  UpdateVandorProfile,
  UpdateVandorService,
  VandorLogin,
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

router.post("/login", VandorLogin);

router.use(Authenticate);
router.get("/profile", GetVandorProfile);
router.patch("/profile", UpdateVandorProfile);
router.patch("/service", UpdateVandorService);
router.patch("/coverimage", images, UpdateVandorCoverImage);
router.post("/food", images, AddFood);
// router.post("/food", AddFood);
router.get("/foods", GetFoods);

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: "Hello from  Vandor" });
});

export { router as VandorRoute };
