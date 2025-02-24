import { Transform } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

enum OfferType {
  BANK_SPECIFIC = "bank-specific",
  PINCODE_SPECIFIC = "pincode-specific",
  GENERAL = "general",
}

enum PromoType {
  PERCENTAGE = "percentage",
  FLAT = "flat",
}

export class CreateOfferDto {
  @IsEnum(OfferType, {
    message:
      "offerType must be one of 'bank-specific', 'pincode-specific', 'general'",
  })
  @Transform(({ value }) => value.toLowerCase())
  offerType: OfferType;

  @IsString()
  vendors: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  minValue: number;

  @IsNumber()
  @Min(1)
  offerAmount: number;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  startValidity: Date;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  endValidity: Date;

  @IsString()
  @Matches(/^[A-Z0-9]+$/, {
    message: "Promo code can only contain uppercase letters and numbers.",
  })
  @MaxLength(12, { message: "Promo code cannot exceed 12 characters." })
  promocode: string;

  @IsEnum(PromoType, {
    message: "promoType must be one of 'percentage', 'flat'",
  })
  @Transform(({ value }) => value.toLowerCase())
  promoType: PromoType;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((bank) => bank.toString().toLowerCase())
      : []
  )
  banks?: string[];

  @IsArray()
  @IsOptional()
  bins?: number[];

  @IsArray()
  @ArrayNotEmpty({ message: "At least one pincode is required." })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((pincode) => pincode.toString()) : []
  )
  pincodes: string[];

  @IsBoolean()
  @IsOptional()
  isActive: boolean;
}
export class UpdateOfferDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  minValue: number;

  @IsNumber()
  @Min(1)
  offerAmount: number;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  endValidity: Date;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((bank) => bank.toString().toLowerCase())
      : []
  )
  banks?: string[];

  @IsArray()
  @IsOptional()
  bins?: number[];

  @IsArray()
  @ArrayNotEmpty({ message: "At least one pincode is required." })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((pincode) => pincode.toString()) : []
  )
  pincodes: string[];

  @IsBoolean()
  @IsOptional()
  isActive: boolean;
}
