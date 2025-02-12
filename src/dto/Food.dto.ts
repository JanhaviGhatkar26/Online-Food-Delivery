import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export interface CreateFoodInput {
  name: string;
  description: string;
  category: string[];
  foodType: string;
  readyTime: number;
  price: number;
  image: string[];
}
export class CreateFoodDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  category: string[];

  @IsEnum(["Veg", "Non-Veg", "Vegan"], { message: "Invalid food type" })
  foodType: string;

  @IsOptional()
  @IsNumber()
  readyTime: number;

  @IsNumber()
  @Min(1)
  price: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images: string[];
}
