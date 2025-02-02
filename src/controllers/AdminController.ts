import { NextFunction, Request, Response } from "express";
import { CreateVendorInput, findVendor } from "../dto";
import { Customer, Vendor } from "../models";
import {
  GenerateAccessSignature,
  GeneratePassword,
  GenerateSalt,
  RefreshAcessToken,
} from "../utility";
import path from "path";
import fs from "fs";

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

  return await Vendor.findOne(filter);
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

  const existVendor = await FindVendor({
    email: email,
    phone: phone,
    activeCheck: true,
  });
  if (existVendor !== null) {
    return res.json({
      message: "A Vendor is already exist with this email ID or phone number",
    });
  }
  const salt = await GenerateSalt();
  const userPassword = await GeneratePassword(password, salt);
  // crypt password
  const vendorobj = {
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
  };
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
  const vendorById = await FindVendor({ _id: vendorId, activeCheck: true });
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
