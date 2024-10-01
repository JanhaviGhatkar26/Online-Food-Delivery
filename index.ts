import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { AdminRoute, VandorRoute } from "./routes";
import { MONGO_URL } from "./config";
import path from "path";
import fs from "fs";
dotenv.config({
  path: "./.env",
});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const imagePath = path.join(__dirname, "/images");
const vandorPath = path.join(imagePath, "/Vandor");
const foodDirPath = path.join(imagePath, "/Food");

function checkAndCreateDirectories() {
  const directoriesToCheck = [
    { path: vandorPath, name: "Vandor" },
    { path: foodDirPath, name: "Food" },
  ];

  directoriesToCheck.forEach((dir) => {
    if (!fs.existsSync(dir.path)) {
      fs.mkdirSync(dir.path, { recursive: true });
      console.log(`${dir.name} directory created:`, dir.path);
    }
  });
}
checkAndCreateDirectories();
app.use("/images", express.static(imagePath));

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
