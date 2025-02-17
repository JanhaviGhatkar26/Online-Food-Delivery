import { Transform } from "class-transformer";
import {
  IsEnum,
  IsNumberString,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class AddAddressDTO {
  @IsEnum(["home", "work", "hotel", "other"], {
    message: "Tag must be one of home, work, hotel, other",
  })
  @Transform(({ value }) => value.toLowerCase()) // Transform the value to lowercase
  tag: "home" | "work" | "hotel" | "other";

  @IsString()
  @MinLength(3, { message: "Line 1 must be at least 3 characters long" })
  @MaxLength(50, { message: "Line 1 cannot exceed 50 characters" })
  line1: string;

  @IsString()
  @MinLength(3, { message: "Line 2 must be at least 3 characters long" })
  @MaxLength(50, { message: "Line 2 cannot exceed 50 characters" })
  line2: string;

  @IsString()
  @MinLength(3, { message: "City name must be at least 3 characters long" })
  city: string;

  @IsNumberString(
    { no_symbols: true },
    { message: "Pincode must be a numeric value" }
  ) // Ensures only numbers
  @Matches(/^\d{6}$/, { message: "Pincode must be exactly 6 digits" }) // Ensures exactly 6 digits
  pincode: string;
}
