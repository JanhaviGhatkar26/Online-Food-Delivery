import { IsEmail, IsEnum, Length, Matches } from "class-validator";
export class CreateCustomerInput {
  @IsEmail()
  email: string;

  @Length(10, 10) // Ensure it's exactly 10 characters long
  @Matches(/^[0-9]{10}$/, {
    message: "Phone number must be exactly 10 digits.",
  })
  phone: string;

  @Length(6, 12)
  password: string;

  @IsEnum(["1", "0"])
  status: "1" | "0";
}
export interface CustomerPayload {
  _id: string;
  email: string;
  verified: boolean;
}
