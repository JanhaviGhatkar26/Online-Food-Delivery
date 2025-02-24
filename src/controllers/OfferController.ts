import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { NextFunction, Request, Response } from "express";
import { CreateOfferDto } from "../dto";
import { FindVendor } from "./AdminController";
import { Offer } from "../models";

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
  const offerInputs = plainToClass(CreateOfferDto, req.body);
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
      banks,
      bins,
      endValidity,
      isActive,
      minValue,
      offerAmount,
      offerType,
      pincodes,
      promoType,
      promocode,
      startValidity,
    } = <CreateOfferDto>req.body;
    const vendor = await FindVendor({ _id: user._id, activeCheck: true });
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
        banks,
        bins,
        endValidity,
        isActive,
        minValue,
        offerAmount,
        offerType,
        pincodes,
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
