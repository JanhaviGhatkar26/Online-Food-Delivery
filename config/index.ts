import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

export const MONGO_URL = `mongodb://localhost:27017/${
  process.env.DB_NAME || "online_food_delivery"
}`;

export const SECRATE_KEY: string = process.env.SECRATE_KEY || "";
