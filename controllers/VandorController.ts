import { Request, Response, NextFunction } from "express";
import { EditVandorInputs, VandorLoginInputs } from "../dto";
import { FindVandor } from "./AdminController";
import { GenerateSignature, ValidatePassword } from "../utility";

//Login the vandor by email and password
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
      const signature = await GenerateSignature({
        _id: String(exsitingVandor?._id),
        name: exsitingVandor?.name,
        email: exsitingVandor?.email,
        foodType: exsitingVandor?.foodType,
      });
      // console.log(signature);
      return res.json(signature);
    } else {
      return res.json({ message: "Password is not valid" });
    }
  }
  return res.json({ message: "Login credentials not valid" });
};

//Get the vandor profile detail
export const GetVandorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (user) {
    const exsitingVandor = await FindVandor(user._id);
    return res.json(exsitingVandor);
  }
  return res.json({ message: "Vandor information Not Found" });
};

//Update the vandor profile details
export const UpdateVandorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { address, phone, foodType, name } = <EditVandorInputs>req.body;
  const user = req.user;
  if (user) {
    const exsitingVandor = await FindVandor(user._id);
    if (exsitingVandor !== null) {
      exsitingVandor.name = name;
      exsitingVandor.address = address;
      exsitingVandor.phone = phone;
      exsitingVandor.foodType = foodType;
      const savedVandor = await exsitingVandor.save();
      return res.json(savedVandor);
    }
    return res.json(exsitingVandor);
  }
  return res.json({ message: "Vandor information Not Found" });
};
//Update the vandor service status
export const UpdateVandorService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (user) {
    const existingVendor = await FindVandor(user._id);
    if (existingVendor !== null) {
      existingVendor.serviceAvailable = !existingVendor.serviceAvailable;
      const saveResult = await existingVendor.save();
      return res.json(saveResult);
    }
  }
  return res.json({ message: "Unable to Update vendor profile " });
};

// Add food item
export const AddFood = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (user) {
  }
  return res.json({ message: "Something went wrong while adding food." });
};
// Get all food item
export const GetFood = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (user) {
  }
  return res.json({ message: "Food information nott found." });
};
