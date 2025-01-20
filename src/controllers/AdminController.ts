import { NextFunction, Request, Response } from "express";
import { CreateVandorInput } from "../dto";
import { Customer, Vandor } from "../models";
import { GeneratePassword, GenerateSalt } from "../utility";
import path from "path";
import fs from "fs";

export const FindVandor = async (
  id: string | undefined,
  email?: string,
  phone?: string
) => {
  if (email || phone) {
    return await Vandor.findOne({
      $or: [{ email }, { phone }],
    });
  } else {
    return await Vandor.findById(id);
  }
};

export const CreateVandor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    name,
    address,
    email,
    foodType,
    coverImage,
    ownerName,
    password,
    pincode,
    phone,
  } = <CreateVandorInput>req.body;

  const existVandor = await FindVandor(email, phone);
  if (existVandor !== null) {
    return res.json({
      message: "A Vandor is already exist with this email ID or phone number",
    });
  }
  const salt = await GenerateSalt();
  const userPassword = await GeneratePassword(password, salt);
  // crypt password
  const createdVandor = await Vandor.create({
    name: name,
    address: address,
    pincode: pincode,
    foodType: foodType,
    email: email,
    password: userPassword,
    salt: salt,
    ownerName: ownerName,
    phone: phone,
    rating: 0,
    serviceAvailable: false,
    coverImage: [],
    foods: [],
  });
  const vandorCoverImgPath = path.join(
    __dirname,
    "..",
    "images",
    "Vandor",
    String(createdVandor._id)
  );

  if (!fs.existsSync(vandorCoverImgPath)) {
    fs.mkdirSync(vandorCoverImgPath, { recursive: true });
  }

  const files = req.files as Express.Multer.File[]; // Adjusted for types

  let images: string[] = [];
  files.forEach((file: Express.Multer.File) => {
    const filePath = path.join(vandorCoverImgPath, file.filename);
    fs.renameSync(file.path, filePath); // Move the uploaded file to the new folder
    images.push(file.filename);
  });

  createdVandor.coverImage.push(...images);
  const saveResult = await createdVandor.save();
  return res.json(saveResult);
};

export const GetVandor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const vandors = await Vandor.find({ is_deleted: "0" });
  if (vandors !== null) {
    return res.json(vandors);
  }
  return res.json({ message: "Vandors data not availale" });
};

export const GetVandorById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const vandorId = req.params.id;
  const vandorById = await FindVandor(vandorId);
  if (vandorById !== null) {
    return res.json(vandorById);
  }
  return res.json({ message: "Vandor data not availale" });
};
export const DeleteCustomerAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customerID = req.params;
  console.log(customerID);
  // const customer = req.user;
  if (customerID?.customerID) {
    const profile = await Customer.findById(customerID?.customerID);
    if (!profile) {
      return res.status(404).json({ message: "Customer profile not found." });
    }
    await Customer.findByIdAndUpdate(profile._id, {
      isActive: "0",
      is_deleted: "1",
    });
    return res.json({ message: "Account Delete successfully." });
  }
  return res
    .status(404)
    .json({ message: "Something went wrong while Deleting account." });
};
