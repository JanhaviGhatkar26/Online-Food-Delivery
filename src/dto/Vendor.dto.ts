import { Type } from "class-transformer";
import { IsArray, IsDate, IsNumber, IsString, Min } from "class-validator";

export interface CreateVendorInput {
  name: string;
  ownerName: string;
  foodType: [string];
  pincode: string;
  address: string;
  phone: string;
  email: string;
  password: string;
  coverImage: [string];
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
