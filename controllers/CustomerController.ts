import { plainToClass } from "class-transformer";
import { NextFunction, Request, Response } from "express";
import { CreateCustomerInput } from "../dto/Customer.dto";
import { validate } from "class-validator";
import {
  GenerateOTP,
  GeneratePassword,
  GenerateSalt,
  GenerateSignature,
  onRequestOtp,
} from "../utility";
import { Customer } from "../models";

export const CustomerSignUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customerInputs = plainToClass(CreateCustomerInput, req.body);
  const inputError = await validate(customerInputs, {
    validationError: { target: true },
  });
  console.log("inputError :", inputError);
  if (inputError.length > 0) {
    return res.status(400).json(inputError);
  }
  const { email, password, phone, status } = customerInputs;
  const salt = await GenerateSalt();
  const userPassword = await GeneratePassword(password, salt);
  const { otp, expiry } = await GenerateOTP();
  console.log("otp, expiry:", otp, expiry);
  const customerData = {
    firstName: "",
    lastName: "",
    phone: phone,
    email: email,
    address: "",
    password: userPassword,
    salt: salt,
    verified: false,
    otp: otp,
    otp_expiry: expiry,
    lat: 0,
    lng: 0,
  };
  if (status !== undefined) {
    Object.assign(customerData, { isActive: status });
  }

  // Create the customer
  try {
    const newCustomer = await Customer.create(customerData);

    if (newCustomer) {
      // Attempt to send the OTP
      const otpResponse = await onRequestOtp(otp, phone);
      if (!otpResponse) {
        return res
          .status(400)
          .json({ message: "Failed to send OTP. Please try again." });
      }

      // Generate the signature
      const signature = await GenerateSignature({
        _id: String(newCustomer._id),
        email: newCustomer.email,
        verified: newCustomer.verified,
      });

      return res.status(200).json({
        signature: signature,
        verified: newCustomer.verified,
        email: newCustomer.email,
      });
    }
  } catch (error) {
    console.error("Error during customer signup:", error);
    return res.status(500).json({
      message:
        "An error occurred while creating the customer. Please try again later.",
    });
  }
  return res.status(400).json("error to signup");
};

export const CustomerLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};

export const Authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};

export const CustomerVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};

export const RequestOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};

export const GetCustomerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};

export const EditCustomerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};
