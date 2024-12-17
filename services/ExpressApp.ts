import express, { Application } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import {
  AdminRoute,
  ShoppingRoutes,
  VandorRoute,
  CustomerRoutes,
} from "../routes";
import path from "path";
import fs from "fs";

export default async (app: Application) => {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  const imagePath = path.join(__dirname, "../images");
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
  app.use("/customer", CustomerRoutes);
  app.use(ShoppingRoutes);
  return app;
};
