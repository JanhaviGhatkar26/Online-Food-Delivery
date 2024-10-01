import { NextFunction, Request, Response } from "express";
import { CreateVandorInput } from "../dto";
import { Vandor } from "../models";
import { GeneratePassword, GenerateSalt } from "../utility";

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

  //generate a salt

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
    coverImages: [],
    foods: [],
  });
  return res.json(createdVandor);
};
export const GetVandor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const vandors = await Vandor.find();
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
