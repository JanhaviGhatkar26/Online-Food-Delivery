import express, { Request, Response, NextFunction } from "express";
import { CreateVandor, GetVandor, GetVandorById } from "../controllers";
import { images } from ".";
const router = express.Router();

router.post("/vandor", images, CreateVandor);
router.get("/vandor", GetVandor);
router.get("/vandor/:id", GetVandorById);
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: "Hello from  Admin" });
});
export { router as AdminRoute };
