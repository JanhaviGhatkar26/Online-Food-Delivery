import express, { Request, Response, NextFunction } from "express";
import { FoodDoc, Vandor } from "../models";

export const GetFoodAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const pincode = req.params.pincode;
  const result = await Vandor.find({
    pincode: pincode,
    serviceAvailable: true,
    is_deleted: "0",
  })
    .sort([["ratings", "descending"]])
    .populate("foods");
  if (result.length > 0) {
    return res.status(200).json({ result });
  }
  return res.status(400).json({ message: "No Data Found" });
};

export const GetTopRestaurants = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const pincode = req.params.pincode;
  const result = await Vandor.find({
    pincode: pincode,
    serviceAvailable: true,
    is_deleted: "0",
  })
    .sort([["ratings", "descending"]])
    .limit(1);
  if (result.length > 0) {
    return res.status(200).json({ result });
  }
  return res.status(400).json({ message: "No Data Found" });
};

export const GetFoodsIn30Min = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const pincode = req.params.pincode;
  const result = await Vandor.find({
    pincode: pincode,
    is_deleted: "0",
  })
    .sort([["ratings", "descending"]])
    .populate("foods");

  if (result.length > 0) {
    let foodResult: FoodDoc[] = [];
    result.map((vandor) => {
      const foods = vandor.foods as [FoodDoc];
      foodResult.push(
        ...foods.filter(
          (food) =>
            food.readyTime <= 30 &&
            food.isActive === "1" &&
            food.is_deleted === "0"
        )
      );
    });
    return res.status(200).json(foodResult);
  }
  return res.status(400).json({ message: "No Data Found" });
};

export const SearchFoods = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const pincode = req.params.pincode;
  const result = await Vandor.find({
    pincode: pincode,
    is_deleted: "0",
  })
    .sort([["ratings", "descending"]])
    .populate("foods");

  if (result.length > 0) {
    let foodList: any = [];
    result.map((item) => foodList.push(...item.foods));
    return res.status(200).json(foodList);
  }
  return res.status(400).json({ message: "No Data Found" });
};

export const RestaurantById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;
  const result = await Vandor.findOne({
    _id: id,
    is_deleted: "0",
  });

  if (result) {
    return res.status(200).json({ result });
  }
  return res.status(400).json({ message: "No Data Found" });
};

export const GetAvailableOffers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};
