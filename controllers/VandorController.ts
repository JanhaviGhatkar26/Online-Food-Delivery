import { Request, Response, NextFunction } from "express";
import { CreateFoodInput, EditVandorInputs, VandorLoginInputs } from "../dto";
import { FindVandor } from "./AdminController";
import { GenerateSignature, ValidatePassword } from "../utility";
import { Food } from "../models";
import path from "path";
import fs from "fs";

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

export const UpdateVandorCoverImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (user) {
    const vandor = await FindVandor(user._id);

    if (vandor !== null) {
      console.log({ vandor });
      const vandorCoverImgPath = path.join(
        __dirname,
        "..",
        "images",
        "Vandor",
        String(vandor._id)
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

      console.log(images);
      vandor.coverImage.push(...images); // Update the coverImage field

      const saveResult = await vandor.save();

      return res.json(saveResult);
    }
  }
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

  const { name, description, category, foodType, readyTime, price } = <
    CreateFoodInput
  >req.body;

  if (user) {
    const vandor = await FindVandor(user._id);

    if (vandor !== null) {
      const food = await Food.create({
        vandorId: vandor._id,
        name: name,
        description: description,
        category: category,
        price: price,
        rating: 0,
        readyTime: readyTime,
        foodType: foodType,
        images: [], // Initialize an empty array for images
      });

      vandor.foods.push(food);
      const result = await vandor.save();
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
//     const vandor = await FindVandor(user._id);

//     if (vandor !== null) {
//       const files = req.files as [Express.Multer.File];

//       const images = files.map((file: Express.Multer.File) => file.filename);

//       const food = await Food.create({
//         vandorId: vandor._id,
//         name: name,
//         description: description,
//         category: category,
//         price: price,
//         rating: 0,
//         readyTime: readyTime,
//         foodType: foodType,
//         images: images,
//       });

//       vandor.foods.push(food);
//       const result = await vandor.save();
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
    const foods = await Food.find({ vandorId: user._id });
    if (foods !== null) {
      return res.json(foods);
    }
  }
  return res.json({ message: "Foods not found!" });
};
