import { Request, Response, NextFunction } from "express";
import {
  CreateFoodInput,
  CreateOfferInputs,
  EditVendorInputs,
  VendorLoginInputs,
} from "../dto";
import { FindVendor } from "./AdminController";
import {
  GenerateAccessSignature,
  GenerateRefreshSignature,
  ValidatePassword,
} from "../utility";
import { Food, Offer, Order } from "../models";
import path from "path";
import fs from "fs";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";

//Login the vendor by email and password
export const VendorLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = <VendorLoginInputs>req.body;
  console.log(email, password);
  const exsitingVendor = await FindVendor("", email);
  console.log("exsitingVendor:", exsitingVendor);
  if (exsitingVendor !== null) {
    if (exsitingVendor.is_deleted !== "0" || exsitingVendor.isActive !== "1") {
      return res
        .status(404)
        .json({ message: "Vendor is deleted or inactive." });
    }
    const validation = await ValidatePassword(
      password,
      exsitingVendor?.password,
      exsitingVendor?.salt
    );
    if (validation) {
      const accessToken = await GenerateAccessSignature({
        _id: String(exsitingVendor?._id),
        name: exsitingVendor?.name,
        email: exsitingVendor?.email,
        foodType: exsitingVendor?.foodType,
      });
      const refreshToken = await GenerateRefreshSignature({
        _id: String(exsitingVendor?._id),
        name: exsitingVendor?.name,
        email: exsitingVendor?.email,
      });
      res.cookie(`refreshTokenOfUser`, refreshToken, {
        httpOnly: true,
        secure: true, // Use true in production
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.json({
        message: "Logged in sucsefully",
        _id: String(exsitingVendor?._id),
        name: exsitingVendor?.name,
        email: exsitingVendor?.email,
        foodType: exsitingVendor?.foodType,
        token: accessToken,
      });
    } else {
      return res.json({ message: "Password is not valid" });
    }
  }
  return res.json({ message: "Login credentials not valid" });
};

//Get the vendor profile detail
export const GetVendorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (user) {
    const exsitingVendor = await FindVendor(user._id);
    return res.json(exsitingVendor);
  }
  return res.json({ message: "Vendor information Not Found" });
};

//Update the vendor profile details
export const UpdateVendorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { address, phone, foodType, name } = <EditVendorInputs>req.body;
  const user = req.user;
  if (user) {
    const exsitingVendor = await FindVendor(user._id);
    if (exsitingVendor !== null) {
      exsitingVendor.name = name;
      exsitingVendor.address = address;
      exsitingVendor.phone = phone;
      exsitingVendor.foodType = foodType;
      const savedVendor = await exsitingVendor.save();
      return res.json(savedVendor);
    }
    return res.json(exsitingVendor);
  }
  return res.json({ message: "Vendor information Not Found" });
};

export const UpdateVendorCoverImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (user) {
    const vendor = await FindVendor(user._id);

    if (vendor !== null) {
      console.log({ vendor });
      const vendorCoverImgPath = path.join(
        __dirname,
        "..",
        "images",
        "Vendor",
        String(vendor._id)
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

      console.log(images);
      vendor.coverImage.push(...images); // Update the coverImage field

      const saveResult = await vendor.save();

      return res.json(saveResult);
    }
  }
};

//Update the vendor service status
export const UpdateVendorService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (user) {
    const existingVendor = await FindVendor(user._id);
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

  const { name, description, category, foodType, readyTime, price } = <
    CreateFoodInput
  >req.body;

  if (user) {
    const vendor = await FindVendor(user._id);

    if (vendor !== null) {
      const food = await Food.create({
        vendorId: vendor._id,
        name: name,
        description: description,
        category: category,
        price: price,
        rating: 0,
        readyTime: readyTime,
        foodType: foodType,
        images: [], // Initialize an empty array for images
      });

      vendor.foods.push(food);
      const result = await vendor.save();
      const foodImagePath = path.join(
        __dirname,
        "..",
        "images",
        "Food",
        String(food._id)
      );
      if (!fs.existsSync(foodImagePath)) {
        fs.mkdirSync(foodImagePath, { recursive: true });
      }
      const files = req.files as [Express.Multer.File];
      console.log("files :", files);
      let images: [string] = [""];
      if (files.length > 0) {
        files.map((file: Express.Multer.File) => {
          const fileName = `${new Date().toISOString().replace(/:/g, "-")}_${
            file.originalname
          }`;
          // Move the file to the correct folder
          const filePath = path.join(foodImagePath, fileName);
          fs.renameSync(file.path, filePath); // Move the uploaded file to the new folder
          // return fileName; // Return the filename to be stored in the DB

          if (images[0] === "") {
            images[0] = fileName;
          } else {
            images.push(fileName);
          }
        });

        console.log(images);
        food.images = images;
        await food.save();
      }
      return res.json(result);
    }
  }
  return res.json({ message: "Unable to Update vendor profile " });
};

// export const AddFood = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const user = req.user;

//   const { name, description, category, foodType, readyTime, price } = <
//     CreateFoodInput
//   >req.body;

//   if (user) {
//     const vendor = await FindVendor(user._id);

//     if (vendor !== null) {
//       const files = req.files as [Express.Multer.File];

//       const images = files.map((file: Express.Multer.File) => file.filename);

//       const food = await Food.create({
//         vendorId: vendor._id,
//         name: name,
//         description: description,
//         category: category,
//         price: price,
//         rating: 0,
//         readyTime: readyTime,
//         foodType: foodType,
//         images: images,
//       });

//       vendor.foods.push(food);
//       const result = await vendor.save();
//       return res.json(result);
//     }
//   }
//   return res.json({ message: "Unable to Update vendor profile " });
// };

// Get all food item
export const GetFoods = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (user) {
    const foods = await Food.find({ vendorId: user._id });
    if (foods !== null) {
      return res.json(foods);
    }
  }
  return res.json({ message: "Foods not found!" });
};

//Orders

export const GetCurrentOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (user) {
    const orders = await Order.find({ vendorId: user._id }).populate(
      "items.food"
    );
    if (orders != null) {
      return res.status(200).json(orders);
    }
  }
  return res.json({ message: "Orders not found!" });
};

export const GetOrderDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const orderId = req.params.id;

  if (orderId) {
    const order = await Order.findById(orderId).populate("items.food");

    if (order != null) {
      return res.status(200).json(order);
    }
  }

  return res.json({ message: "Order Not found" });
};

export const ProcessOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const orderId = req.params.id;

  const { status, remarks, time } = req.body;

  if (orderId) {
    console.log("order :");
    const order = await Order.findById(orderId).populate("items.food");
    console.log("order :", order);
    order.orderStatus = status;
    order.remarks = remarks;
    if (time) {
      order.readyTime = time;
    }

    const orderResult = await order.save();

    if (orderResult != null) {
      return res.status(200).json(orderResult);
    }
  }

  return res.json({ message: "Unable to process order" });
};

//Offers
export const GetOffers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};
export const CreateOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  const offerInputs = plainToClass(CreateOfferInputs, req.body);
  const inputError = await validate(offerInputs, {
    validationError: { target: true },
  });
  console.log("inputError :", inputError);
  if (inputError.length > 0) {
    return res.status(400).json(inputError);
  }
  if (user) {
    const {
      title,
      description,
      bank,
      bins,
      endValidity,
      isActive,
      minValue,
      offerAmount,
      offerType,
      pincode,
      promoType,
      promocode,
      startValidity,
    } = <CreateOfferInputs>req.body;
    const vendor = await FindVendor(user?._id);
    if (vendor) {
      const curDate = new Date();

      // Single condition for all date validation checks
      if (
        startValidity < curDate ||
        endValidity < curDate ||
        endValidity < startValidity
      ) {
        return res.status(400).json({
          error:
            "Invalid date selection. Start and end dates must be today or later, and end date must not be before start date.",
        });
      }
      let OfferObj = {
        title,
        description,
        bank,
        bins,
        endValidity,
        isActive,
        minValue,
        offerAmount,
        offerType,
        pincode,
        promoType,
        promocode,
        startValidity,
        vendors: [vendor],
      };
      const offer = await Offer.create(OfferObj);
      console.log("offer :", offer);
      if (offer) {
        return res.status(200).json({ msg: "Offer has be genrated.", offer });
      }
      return res
        .status(400)
        .json({ msg: "Something went wrong while creating offer." });
    }
  }
};
export const EditOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};
export const DeleteOffers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};
