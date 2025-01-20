import { NextFunction, Request, Response } from "express";
import { CreateVendorInput } from "../dto";
import { Customer, Vendor } from "../models";
import { GeneratePassword, GenerateSalt } from "../utility";
import path from "path";
import fs from "fs";

export const FindVendor = async (
  id: string | undefined,
  email?: string,
  phone?: string
) => {
  if (email || phone) {
    return await Vendor.findOne({
      $or: [{ email }, { phone }],
    });
  } else {
    return await Vendor.findById(id);
  }
};

export const CreateVendor = async (
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
  } = <CreateVendorInput>req.body;

  const existVendor = await FindVendor(email, phone);
  if (existVendor !== null) {
    return res.json({
      message: "A Vendor is already exist with this email ID or phone number",
    });
  }
  const salt = await GenerateSalt();
  const userPassword = await GeneratePassword(password, salt);
  // crypt password
  const createdVendor = await Vendor.create({
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
  const vendorCoverImgPath = path.join(
    __dirname,
    "..",
    "images",
    "Vendor",
    String(createdVendor._id)
  );

  if (!fs.existsSync(vendorCoverImgPath)) {
    fs.mkdirSync(vendorCoverImgPath, { recursive: true });
  }

  const files = req.files as Express.Multer.File[]; // Adjusted for types

  let images: string[] = [];
  files.forEach((file: Express.Multer.File) => {
    const filePath = path.join(vendorCoverImgPath, file.filename);
    fs.renameSync(file.path, filePath); // Move the uploaded file to the new folder
    images.push(file.filename);
  });

  createdVendor.coverImage.push(...images);
  const saveResult = await createdVendor.save();
  return res.json(saveResult);
};

export const GetVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const vendors = await Vendor.find({ is_deleted: "0" });
  if (vendors !== null) {
    return res.json(vendors);
  }
  return res.json({ message: "Vendors data not availale" });
};

export const GetVendorById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const vendorId = req.params.id;
  const vendorById = await FindVendor(vendorId);
  if (vendorById !== null) {
    return res.json(vendorById);
  }
  return res.json({ message: "Vendor data not availale" });
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
