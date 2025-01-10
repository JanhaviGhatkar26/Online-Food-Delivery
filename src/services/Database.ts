import mongoose from "mongoose";
import { MONGO_URL } from "../config";
export default async () => {
  try {
    await mongoose
      .connect(MONGO_URL)
      .then((result) => {
        console.log("Database connection is complete te url is :", MONGO_URL);
      })
      .catch((err) => {
        console.log("Error from monggose connection", err);
      });
  } catch (error) {
    console.error("error from Database.ts file:", error);
  }
};
