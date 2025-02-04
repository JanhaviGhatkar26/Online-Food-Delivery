import { NextFunction, Request, Response } from "express";
import { CreateVendorDTO, CreateVendorInput, findVendor } from "../dto";
import { Customer, Vendor } from "../models";
import {
  GenerateAccessSignature,
  GeneratePassword,
  GenerateSalt,
  RefreshAcessToken,
} from "../utility";
import path from "path";
import fs from "fs";
import { validate } from "class-validator";
import mongoose from "mongoose";

export const FindVendor = async ({
  _id,
  email = "",
  phone = "",
  activeCheck = false, // Default is false
}: {
  _id?: string;
  email?: string;
  phone?: string;
  activeCheck?: boolean;
}) => {
  const filter: any = { isDeleted: false }; // ✅ Always enforce `isDeleted: false`

  if (email || phone) {
    filter["$or"] = [{ email }, { phone }];
  } else if (_id) {
    filter["_id"] = _id;
  }

  // ✅ If `acticveCheck` is true, also check `isActive: true`
  if (activeCheck) {
    filter["isActive"] = true;
  }

  const vendor = await Vendor.findOne(filter).lean();
  return vendor;
};

export const CreateVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // ✅ Validate input using DTO
  const dto = Object.assign(new CreateVendorDTO(), req.body);
  const errors = await validate(dto);
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.map((e) => e.constraints),
    });
  }
  const {
    name,
    address,
    email,
    foodType,
    ownerName,
    password,
    pincode,
    phone,
    closingHours,
    openingHours,
  } = dto;
  const existVendor = await FindVendor({
    email: email,
    phone: phone,
    activeCheck: true,
  });
  if (existVendor) {
    return res.status(400).json({
      success: false,
      message: "Vendor already exists with this email or phone.",
    });
  }
  const salt = await GenerateSalt();
  const userPassword = await GeneratePassword(password, salt);
  // crypt password
  const vendorobj = new Vendor({
    name,
    address,
    pincode,
    foodType,
    email,
    password: userPassword,
    salt,
    ownerName,
    phone,
    rating: 0,
    serviceAvailable: false,
    coverImage: [],
    foods: [],
    openingHours: openingHours || "09:00 AM",
    closingHours: closingHours || "11:00 PM",
  });
  const createdVendor = await Vendor.create(vendorobj);
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

  let images: string[] = [];
  if (req.files) {
    const files = req.files as Express.Multer.File[]; // Adjusted for types
    for (const file of files) {
      if (!file.mimetype.startsWith("image/")) {
        return res.status(400).json({
          success: false,
          message: "Invalid file type. Only images are allowed.",
        });
      }
      const filePath = path.join(vendorCoverImgPath, file.filename);
      fs.renameSync(file.path, filePath); // Move the uploaded file to the new folder
      images.push(file.filename);
    }
  }
  createdVendor.coverImage.push(...images);
  await createdVendor.save();
  return res.status(201).json({
    success: true,
    message: "Vendor created successfully.",
    data: createdVendor,
  });
};
// export const CreateVendor = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const {
//     name,
//     address,
//     email,
//     foodType,
//     ownerName,
//     password,
//     pincode,
//     phone,
//     closingHours,
//     openingHours,
//     coverImage,
//   } = <CreateVendorInput>req.body;

//   const existVendor = await FindVendor({
//     email: email,
//     phone: phone,
//     activeCheck: true,
//   });
//   if (existVendor !== null) {
//     return res.json({
//       message: "A Vendor is already exist with this email ID or phone number",
//     });
//   }
//   const salt = await GenerateSalt();
//   const userPassword = await GeneratePassword(password, salt);
//   // crypt password
//   const vendorobj = {
//     name: name,
//     address: address,
//     pincode: pincode,
//     foodType: foodType,
//     email: email,
//     password: userPassword,
//     salt: salt,
//     ownerName: ownerName,
//     phone: phone,
//     rating: 0,
//     serviceAvailable: false,
//     coverImage: [],
//     foods: [],
//     openingHours: openingHours || "09:00 AM",
//     closingHours: closingHours || "11:00 PM",
//   };
//   const createdVendor = await Vendor.create(vendorobj);
//   const vendorCoverImgPath = path.join(
//     __dirname,
//     "..",
//     "images",
//     "Vendor",
//     String(createdVendor._id)
//   );

//   if (!fs.existsSync(vendorCoverImgPath)) {
//     fs.mkdirSync(vendorCoverImgPath, { recursive: true });
//   }

//   const files = req.files as Express.Multer.File[]; // Adjusted for types

//   let images: string[] = [];
//   files.forEach((file: Express.Multer.File) => {
//     const filePath = path.join(vendorCoverImgPath, file.filename);
//     fs.renameSync(file.path, filePath); // Move the uploaded file to the new folder
//     images.push(file.filename);
//   });

//   createdVendor.coverImage.push(...images);
//   const saveResult = await createdVendor.save();
//   return res.json(saveResult);
// };

export const GetVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const vendors = await Vendor.find({ isDeleted: false });
  if (!vendors || vendors.length === 0) {
    return res
      .status(404)
      .json({ success: false, message: "No vendors found." });
  }
  return res.status(200).json({ success: true, data: vendors });
};

export const GetVendorById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const vendorId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid vendor ID format." });
  }
  const vendorById = await FindVendor({ _id: vendorId, activeCheck: true });
  if (!vendorById) {
    return res
      .status(404)
      .json({ success: false, message: "Vendor not found." });
  }
  return res.status(200).json({ success: true, data: vendorById });
};

export const DeleteCustomerAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customerID = req.params.customerID;

  // const customer = req.user;
  if (customerID) {
    const profile = await Customer.findById(customerID);
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

export const RefreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const newAccessToken = await RefreshAcessToken(req);
    console.log("newAccessToken :", newAccessToken);
    res.cookie(`accessTokenOfUser`, newAccessToken, {
      httpOnly: true,
      secure: true, // Use true in production
      sameSite: "strict",
      maxAge: 30 * 60 * 1000, // 30min
    });
    return res.json({ token: newAccessToken });
  } catch (err) {
    return res.status(403).json({ message: err });
  }
};
