import express, { Request, Response, NextFunction } from "express";
import { CreateVandor, GetVandor, GetVandorById } from "../controllers";
const router = express.Router();

router.post("/Vandor", CreateVandor);
router.get("/Vandor", GetVandor);
router.get("/Vandor/:id", GetVandorById);
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: "Hello from  Admin" });
});
export { router as AdminRoute };
