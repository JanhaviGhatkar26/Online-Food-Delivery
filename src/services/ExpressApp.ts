import express, { Application } from "express";
import {
  AdminRoute,
  ShoppingRoutes,
  VendorRoute,
  CustomerRoutes,
  CustomerAddressesRoutes,
} from "../routes";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";

export default async (app: Application) => {
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Define the main images folder and subdirectories
  const imagePath = path.join(__dirname, "../images");
  const vendorPath = path.join(imagePath, "/Vendor");
  const foodDirPath = path.join(imagePath, "/Food");

  // Ensure the main images directory exists globally
  if (!fs.existsSync(imagePath)) {
    fs.mkdirSync(imagePath, { recursive: true });
    // console.log("Main images directory created:", imagePath);
  }

  // Function to create additional subdirectories
  function checkAndCreateDirectories() {
    const directoriesToCheck = [
      { path: vendorPath, name: "Vendor" },
      { path: foodDirPath, name: "Food" },
    ];

    directoriesToCheck.forEach((dir) => {
      if (!fs.existsSync(dir.path)) {
        fs.mkdirSync(dir.path, { recursive: true });
        console.log(`${dir.name} directory created:`, dir.path);
      } else {
        console.log(`${dir.name} directory is already created:`, dir.path);
      }
    });
  }

  // Create subdirectories for Vendor and Food
  checkAndCreateDirectories();

  // Serve static files from the images directory
  app.use("/images", express.static(imagePath));

  // Register routes
  app.use("/admin", AdminRoute);
  app.use("/Vendor", VendorRoute);
  app.use("/customer", CustomerRoutes);
  app.use("/customer/addresses", CustomerAddressesRoutes);
  app.use(ShoppingRoutes);
  app.use("/", (req, res) => {
    res.send("Hi Admin");
  });
  return app;
};
