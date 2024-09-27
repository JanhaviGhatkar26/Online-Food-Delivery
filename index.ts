import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { AdminRoute, VandorRoute } from "./routes";
import { MONGO_URL } from "./config";

dotenv.config({
  path: "./.env",
});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/admin", AdminRoute);
app.use("/Vandor", VandorRoute);

mongoose
  .connect(MONGO_URL)
  .then((result) => {
    console.log("Database connection is complete");
  })
  .catch((err) => {
    console.log("Error from monggose connection", err);
  });
app.listen(8000, () => {
  console.clear();
  console.log(`App is listning to the port 8000`);
});
