import { plainToClass } from "class-transformer";
import { NextFunction, Request, Response } from "express";
import {
  CreateCustomerInput,
  CustomerLoginInputs,
  EditCustomerProfileInputs,
  OrderInputs,
} from "../dto/Customer.dto";
import { validate } from "class-validator";
import {
  GenerateOTP,
  GeneratePassword,
  GenerateSalt,
  GenerateSignature,
  onRequestOtp,
  ValidatePassword,
} from "../utility";
import { Customer, Food } from "../models";

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
  const { otp, expiry } = GenerateOTP();
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
  const existingCustomer = await Customer.findOne({
    email: email,
    is_deleted: "0",
  });
  if (existingCustomer !== null) {
    return res.status(400).json({ message: "Email already exist!" });
  }
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
  return res.status(400).json("error to signup");
};

export const CustomerLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const loginInputs = plainToClass(CustomerLoginInputs, req.body);
  const loginErrors = await validate(loginInputs, {
    validationError: { target: false },
  });
  if (loginErrors.length > 0) {
    return res.status(400).json(loginErrors);
  }
  const { email, password } = loginInputs;
  const customer = await Customer.findOne({
    email: email,
    is_deleted: "0",
    isActive: "1",
  });
  if (customer) {
    console.log("customer :", customer);
    const validation = await ValidatePassword(
      password,
      customer?.password,
      customer?.salt
    );
    console.log("validation :", validation);
    if (validation) {
      // Generate the signature
      const signature = await GenerateSignature({
        _id: String(customer._id),
        email: customer.email,
        verified: customer.verified,
      });
      return res.status(200).json({
        msg: "Logged in succesfully",
        signature: signature,
        verified: customer?.verified,
        email: customer?.email,
      });
    } else {
      return res.status(400).json("Ones check you email or password");
    }
  }
  return res.status(404).json("Error With Login");
};

export const CustomerVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { otp } = req.body;
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id);
    if (profile) {
      if (profile.otp === parseInt(otp) && profile.otp_expiry >= new Date()) {
        profile.verified = true;

        const updatedCustomerResponse = await profile.save();

        const signature = await GenerateSignature({
          _id: String(updatedCustomerResponse._id),
          email: updatedCustomerResponse.email,
          verified: updatedCustomerResponse.verified,
        });
        return res.status(200).json({
          signature: signature,
          email: updatedCustomerResponse.email,
          verified: updatedCustomerResponse.verified,
        });
      }
    }
  }

  return res.status(400).json({ msg: "Unable to verify Customer" });
};

export const RequestOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id);

    if (profile) {
      const { otp, expiry } = GenerateOTP();
      profile.otp = otp;
      profile.otp_expiry = expiry;

      await profile.save();
      const sendCode = await onRequestOtp(otp, profile.phone);

      if (!sendCode) {
        return res
          .status(400)
          .json({ message: "Failed to verify your phone number" });
      }

      return res
        .status(200)
        .json({ message: "OTP sent to your registered Mobile Number!" });
    }
  }

  return res.status(400).json({ msg: "Error with Requesting OTP" });
};

export const GetCustomerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id);

    if (profile) {
      return res.status(201).json(profile);
    }
  }
  return res.status(400).json({ msg: "Error while Fetching Profile" });
};

export const EditCustomerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const loggedInCustomer = req.user;
  if (loggedInCustomer) {
    const profile = await Customer.findById(loggedInCustomer._id);
    const profileInputs = plainToClass(EditCustomerProfileInputs, req.body);
    const profileErrors = await validate(profileInputs, {
      validationError: { target: false },
    });
    const { address, firstName, lastName, password, phone } = profileInputs;
    if (profileErrors.length > 0) {
      return res.status(400).json(profileErrors);
    }
    if (profile) {
      const editedFields: Partial<EditCustomerProfileInputs> = {};

      // Add fields dynamically from profileInputs
      Object.keys(profileInputs).forEach((key) => {
        if (profileInputs[key] !== undefined) {
          editedFields[key] = profileInputs[key];
        }
      });

      // Special handling for password (if needed)
      if (password) {
        console.log("password :", password);
        const salt = await GenerateSalt();

        const hashedPassword = await GeneratePassword(password, salt);
        editedFields.password = hashedPassword;
        profile.salt = salt;
      }
      if (phone) {
        editedFields.phone = phone;
        profile.verified = false;
      }

      // Merge editedFields into the profile object
      Object.assign(profile, editedFields);

      // Save the updated profile
      const updatedProfile = await profile.save();

      return res
        .status(200)
        .json({ message: "Profile updated successfully", updatedProfile });
    }
  }
  return res.status(400).json({ msg: "Error while Updating Profile" });
};

//orders
export const CreateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // grab the lgin in customer;
  const customer = req.user;
  if (customer) {
    // create an order ID;
    const orderID = `${Math.floor(Math.random() * 899999) + 1000}`;
    const profile = await Customer.findById(customer._id);

    // Grab order items fromrequest ({id:xx , unit:xx});
    const cart = <[OrderInputs]>req.body;
    let cartItems = Array();
    let netAmount = 0.0;
    // Calculate order amount
    const foods = await Food.find()
      .where("_id")
      .in(cart.map((item) => item._id))
      .exec();
    console.log({ foods: foods });
    console.dir({ "foods dir": foods });

    foods.map((food) => {
      cart.map(({ _id, unit }) => {
        if (food._id == _id) {
          netAmount += food.price * unit;
          cartItems.push({ food, unit });
        }
      });
    });
    // Create order with item description and note of customer\
    if (cartItems) {
    }
    // Finally update ordersto user account
  }
};
export const GetOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};
export const GetOrderByID = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};
