import express, { Request, Response, NextFunction } from "express";
import { Food, FoodDoc, Vendor } from "../models";
import { isRestaurantOpen } from "../utility";
import mongoose from "mongoose";
const getPaginationMeta = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  return {
    currentPage: page,
    totalPages,
    totalResults: total,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
export const GetFoodAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { pincode } = req.params;
  const page = parseInt(req.params.page as string) || 1;
  const limit = parseInt(req.params.limit as string) || 10;
  const skip = (page - 1) * limit;

  const totalVendors = await Vendor.countDocuments({
    pincode: pincode,
    serviceAvailable: true,
    isDeleted: false,
  });
  const vendors = await Vendor.find({
    pincode: pincode,
    serviceAvailable: true,
    isDeleted: false,
  })
    .sort({ rating: -1 }) // ✅ Fixed sorting field
    .limit(limit)
    .skip(skip)
    .populate("foods");

  if (!vendors.length) {
    return res
      .status(404)
      .json({ success: false, message: "No available vendors found." });
  }
  return res.status(200).json({
    success: true,
    pagination: getPaginationMeta(page, limit, totalVendors),
    data: vendors.map((vendor) => ({
      ...vendor.toObject(),
      isOpen: isRestaurantOpen(vendor.openingHours, vendor.closingHours),
    })),
  });
};

export const GetTopRestaurants = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const pincode = req.params.pincode;
  const vendors = await Vendor.find({
    pincode: pincode,
    serviceAvailable: true,
    isDeleted: false,
  })
    .sort({ rating: -1 }) // ✅ Fixed sorting field
    .limit(15);
  if (!vendors.length) {
    return res
      .status(404)
      .json({ success: false, message: "No top restaurants found." });
  }
  return res.status(200).json({
    success: true,
    data: vendors.map((vendor) => ({
      ...vendor.toObject(),
      isOpen: isRestaurantOpen(vendor.openingHours, vendor.closingHours),
    })),
  });
};

export const GetFoodsIn30Min = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const pincode = req.params.pincode;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const totalFoods = await Food.countDocuments({
    readyTime: { $lte: 30 },
    isActive: true,
    isDeleted: false,
  });

  const Foodresult = await Vendor.find({
    pincode: pincode,
    isDeleted: false,
  })
    .sort({ rating: -1 })
    .limit(limit)
    .skip(skip)
    .populate({
      path: "foods", // ✅ Ensuring it fetches the full `FoodDoc` objects
      match: { readyTime: { $lte: 30 }, isActive: true, isDeleted: false },
    });

  if (!Foodresult.length) {
    // let foodResult: FoodDoc[] = [];
    // result.map((vendor) => {
    //   const foods = vendor.foods as FoodDoc[];
    //   foodResult.push(
    //     ...foods.filter(
    //       (food) => food.readyTime <= 30 && food.isActive && !food.isDeleted
    //     )
    //   );
    // });
    return res.status(404).json({ success: false, message: "No Food found" });
  }
  return res.status(200).json({
    success: true,
    pagination: getPaginationMeta(page, limit, totalFoods),
    data: Foodresult.map((vendor) => ({
      ...vendor.toObject(),
      isOpen: isRestaurantOpen(vendor.openingHours, vendor.closingHours),
    })),
  });
};

export const SearchFoods = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const pincode = req.params.pincode;
  const vendorId = req.query.vendorId as string | undefined; // Optional
  const searchTerm = req.query.q as string; // Required
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Case-insensitive search
  const regex = new RegExp(searchTerm, "i");

  const vendorQuery: any = {
    pincode,
    isDelete: false,
  };
  if (vendorId) {
    vendorQuery._id = vendorId;
  }
  const totalFilterdFood = await Vendor.countDocuments(vendorQuery);
  const vendorsFilterdFood = await Vendor.find(vendorQuery)
    .sort({ rating: -1 }) // ✅ Fixed sorting field
    .limit(limit)
    .skip(skip)
    .populate({
      path: "foods",
      match: {
        name: { $regex: regex }, // Search food name
        isActive: true,
        isDeleted: false,
      },
      select: "-__v -createdAt -updatedAt", // Exclude unnecessary fields
    });

  if (!vendorsFilterdFood.length) {
    return res
      .status(404)
      .json({ success: false, message: "No available Food found." });
  }
  return res.status(200).json({
    success: true,
    pagination: getPaginationMeta(page, limit, totalFilterdFood),
    data: vendorsFilterdFood.map((vendor) => ({
      ...vendor.toObject(),
      isOpen: isRestaurantOpen(vendor.openingHours, vendor.closingHours),
    })),
  });
};
// export const SearchFoods = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const pincode = req.params.pincode;

//   const result = await Vendor.find({
//     pincode: pincode,
//     is_deleted: "0",
//   })
//     .sort([["ratings", "descending"]])
//     .populate("foods");

//   if (result.length > 0) {
//     let foodList: any = [];
//     result.map((item) => foodList.push(...item.foods));
//     return res.status(200).json(foodList);
//   }
//   return res.status(400).json({ message: "No Data Found" });
// };

export const RestaurantById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;
  const result = await Vendor.findOne({
    _id: id,
    is_deleted: "0",
  });

  if (!result) {
    return res.status(400).json({ message: "No Data Found" });
  }
  return res.status(200).json({
    success: true,
    data: isRestaurantOpen(result.openingHours, result.closingHours),
  });
};

export const GetAvailableOffers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};
