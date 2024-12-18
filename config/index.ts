import dotenv from "dotenv";

dotenv.config({
  path: "config/.env",
});

export const MONGO_URL = `mongodb://localhost:27017/${
  process.env.DB_NAME || "online_food_delivery"
}`;

export const SECRATE_KEY: string = process.env.SECRATE_KEY || "";
export const PORT = process.env.PORT || 8000;
export const TWILIOACCOUNTSID = process.env.TWILIOACCOUNTSID;
export const TWILIOAUTHTOKEN = process.env.TWILIOAUTHTOKEN;
