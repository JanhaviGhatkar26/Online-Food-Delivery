import express, { Request, Response, NextFunction } from "express";
import {
  AddFood,
  GetFoods,
  GetVandorProfile,
  UpdateVandorProfile,
  UpdateVandorService,
  VandorLogin,
} from "../controllers";
import { Authenticate } from "../middlewares";
const router = express.Router();

import multer from "multer";

console.log("Routher__dirname");
console.log(__dirname);

const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("first");
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    const safeFilename =
      new Date().toISOString().replace(/:/g, "-") + "_" + file.originalname;
    cb(null, safeFilename); // Use the safe filename  },
  },
});
const images = multer({ storage: imageStorage }).array("images", 10);

router.post("/login", VandorLogin);

router.use(Authenticate);
router.get("/profile", GetVandorProfile);
router.patch("/profile", UpdateVandorProfile);
router.patch("/service", UpdateVandorService);
router.post("/food", images, AddFood);
// router.post("/food", AddFood);
router.get("/foods", GetFoods);

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: "Hello from  Vandor" });
});

export { router as VandorRoute };
