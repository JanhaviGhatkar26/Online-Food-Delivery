import { Request, Response, NextFunction } from "express";
import { VandorLoginInputs } from "../dto";
import { FindVandor } from "./AdminController";
import { ValidatePassword } from "../utility";

export const VendorLogin = async (
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
      return res.json(exsitingVandor);
    } else {
      return res.json({ message: "Password is not valid" });
    }
  }
  return res.json({ message: "Login credentials not valid" });
};
