import mongoose from "mongoose";
import { MONGO_URL } from "../config";
export default async () => {
  await mongoose
    .connect(MONGO_URL)
    .then((result) => {
      console.log("Database connection is complete");
    })
    .catch((err) => {
      console.log(`Error from monggose connection with url ${MONGO_URL}`, err);
    });
};
