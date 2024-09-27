import { Request, Response, NextFunction } from "express";
import { VandorLoginInputs } from "../dto";
import { FindVandor } from "./AdminController";
import { GenerateSignature, ValidatePassword } from "../utility";

export const VandorLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = <VandorLoginInputs>req.body;
  const exsitingVandor = await FindVandor("", email);

  if (exsitingVandor !== null) {
    const validation = await ValidatePassword(
      password,
      exsitingVandor?.password,
      exsitingVandor?.salt
    );
    if (validation) {
      const signature = GenerateSignature({
        _id: String(exsitingVandor?._id),
        name: exsitingVandor?.name,
        email: exsitingVandor?.email,
        foodTypes: exsitingVandor?.foodType,
      });
      return res.json(signature);
    } else {
      return res.json({ message: "Password is not valid" });
    }
  }
  return res.json({ message: "Login credentials not valid" });
};

export const GetVandorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (user) {
    const exsitingVandor = await FindVandor(user._id);
    return res.json();
  }
};
export const UpdateVandorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};
export const UpdateVandorService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};
