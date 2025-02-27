import dotenv from "dotenv";

dotenv.config({
  path: "src/config/.env",
});

// export const MONGO_URL = `mongodb://localhost:27017/${
//   process.env.DB_NAME || "online_food_delivery"
// }`;
export const MONGO_URL = `${process.env.MONGODB_URL}${process.env.DB_NAME}?${process.env.REPLICASET}`;
export const ACCESS_TOKEN_SECRET: string =
  process.env.ACCESS_TOKEN_SECRET || "";
export const ACCESS_TOKEN_EXPIRY: string =
  process.env.ACCESS_TOKEN_EXPIRY || "30m";
export const REFRESH_TOKEN_SECRET: string =
  process.env.REFRESH_TOKEN_SECRET || "";
export const REFRESH_TOKEN_EXPIRY: string =
  process.env.REFRESH_TOKEN_EXPIRY || "7d";
export const PORT = parseInt(process.env.PORT) || 8001;
export const TWILIOACCOUNTSID = process.env.TWILIOACCOUNTSID;
export const TWILIOAUTHTOKEN = process.env.TWILIOAUTHTOKEN;
