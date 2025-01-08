import dotenv from "dotenv";

dotenv.config({
  path: "src/config/.env",
});

// export const MONGO_URL = `mongodb://localhost:27017/${
//   process.env.DB_NAME || "online_food_delivery"
// }`;
export const MONGO_URL = `${process.env.MONGODB_URL}${process.env.DB_NAME}`;
export const SECRATE_KEY: string = process.env.SECRATE_KEY || "";
export const PORT = parseInt(process.env.PORT) || 8001;
export const TWILIOACCOUNTSID = process.env.TWILIOACCOUNTSID;
export const TWILIOAUTHTOKEN = process.env.TWILIOAUTHTOKEN;
