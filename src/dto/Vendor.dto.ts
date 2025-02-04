import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Matches,
  Min,
} from "class-validator";
import mongoose from "mongoose";

export class CreateVendorDTO {
  @IsString()
  name: string;

  @IsString()
  ownerName: string;

  @IsArray()
  @IsString({ each: true }) // Ensure all elements are strings
  foodType: string[];

  @IsString()
  pincode: string;

  @IsString()
  address: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber("IN") // Adjust based on country
  phone: string;

  @Length(6, 12, { message: "Password must be between 6 and 12 characters" })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,12}$/,
    {
      message:
        "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character",
    }
  )
  password: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true }) // Ensure all elements are strings
  coverImage?: string[];

  @IsOptional()
  @IsNumber()
  rating?: number; // Default value is handled in the model

  @IsOptional()
  @IsBoolean()
  serviceAvailable?: boolean; // Optional but default false in model

  @IsOptional()
  @IsBoolean()
  isActive?: boolean; // Optional but default true in model

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean; // Optional but default false in model

  @IsOptional()
  @IsArray()
  foods?: mongoose.Schema.Types.ObjectId[];

  @IsOptional()
  @Matches(/^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/, {
    message: "Invalid time format. Use hh:mm AM/PM",
  })
  openingHours?: string;

  @IsOptional()
  @Matches(/^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/, {
    message: "Invalid time format. Use hh:mm AM/PM",
  })
  closingHours?: string;
}

export interface findVendor {
  _id: string;
  phone: string;
  email: string;
  acticveCheck: boolean;
}
export interface CreateVendorInput {
  name: string;
  address: string;
  email: string;
  foodType: string[];
  ownerName: string;
  pincode: string;
  phone: string;
  password: string;
  openingHours?: string; // Optional with default
  closingHours?: string; // Optional with default
  coverImage?: string[];
}

export interface VendorLoginInputs {
  email: string;
  password: string;
}

export interface VendorPayload {
  _id: string;
  email: string;
  name: string;
  foodType?: [string];
}

export interface EditVendorInputs {
  name: string;
  phone: string;
  address: string;
  foodType: [string];
}

export class CreateOfferInputs {
  @IsString()
  offerType: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  minValue: number;

  @IsNumber()
  @Min(0)
  offerAmount: number;

  @IsDate()
  startValidity: Date;

  @IsDate()
  endValidity: Date;

  @IsString()
  promocode: string;

  @IsString()
  promoType: string;

  @IsArray()
  bank: [any];

  @IsArray()
  bins: [any];

  @IsString()
  pincode: string;

  isActive: boolean;
  vendors: [any];
}
