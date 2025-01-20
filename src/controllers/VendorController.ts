import { Request, Response, NextFunction } from "express";
import { CreateFoodInput, EditVendorInputs, VendorLoginInputs } from "../dto";
import { FindVendor } from "./AdminController";
import { GenerateSignature, ValidatePassword } from "../utility";
import { Food } from "../models";
import path from "path";
import fs from "fs";

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
      const signature = await GenerateSignature({
        _id: String(exsitingVendor?._id),
        name: exsitingVendor?.name,
        email: exsitingVendor?.email,
        foodType: exsitingVendor?.foodType,
      });
      return res.json({
        message: "Logged in sucsefully",
        _id: String(exsitingVendor?._id),
        name: exsitingVendor?.name,
        email: exsitingVendor?.email,
        foodType: exsitingVendor?.foodType,
        token: signature,
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

      let images: [string] = [""];
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
