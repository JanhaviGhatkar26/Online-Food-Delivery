import { IsEmail, IsEnum, IsOptional, Length, Matches } from "class-validator";
export class CreateCustomerInput {
  @IsEmail()
  email: string;

  @Length(10, 10) // Ensure it's exactly 10 characters long
  @Matches(/^[0-9]{10}$/, {
    message: "Phone number must be exactly 10 digits.",
  })
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

  @IsEnum(["1", "0"])
  status: "1" | "0";
}

export class CustomerLoginInputs {
  @IsEmail()
  email: string;
  @Length(6, 12)
  password: string;
}

export class EditCustomerProfileInputs {
  @IsOptional()
  @Length(3, 16)
  firstName?: string;

  @IsOptional()
  @Length(3, 16)
  lastName?: string;

  @IsOptional()
  @Length(6, 16)
  address?: string;

  @IsOptional()
  @Length(10, 10) // Ensure it's exactly 10 characters long
  @Matches(/^[0-9]{10}$/, {
    message: "Phone number must be exactly 10 digits.",
  })
  phone?: string;

  @IsOptional()
  @Length(6, 12, { message: "Password must be between 6 and 12 characters" })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,12}$/,
    {
      message:
        "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character",
    }
  )
  password?: string;

  [key: string]: any;
}
export interface CustomerPayload {
  _id: string;
  email: string;
  verified: boolean;
}

export class OrderInputs {
  _id: string;
  unit: number;
}
