// import multer from "multer";
// const imageStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "images"); // Destination folder
//   },
//   filename: function (req, file, cb) {
//     const safeFilename =
//       Date.now() + "_" + file.originalname.replace(/[:\s]+|[^\w.-]+/g, "_");
//     cb(null, safeFilename);
//   },
// });
// console.dir(imageStorage);
// export const images = multer({ storage: imageStorage }).array("images", 10); // Expecting an array of files under "images"

// export * from "./AdminRoutes";
// export * from "./VendorRoutes";
// export * from "./ShoppingRoutes";
// export * from "./CustomerRoutes";

import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure the images directory exists
const imagePath = path.join(__dirname, "../images");
if (!fs.existsSync(imagePath)) {
  fs.mkdirSync(imagePath, { recursive: true });
  // console.log("Main images directory created:", imagePath);
}

const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagePath); // Use the same path as ExpressApp.ts
  },
  filename: function (req, file, cb) {
    const safeFilename =
      Date.now() + "_" + file.originalname.replace(/[:\s]+|[^\w.-]+/g, "_");
    cb(null, safeFilename);
  },
});
// Configure multer to handle multiple file uploads under "images"
export const images = multer({ storage: imageStorage }).array("images", 10);

export * from "./AdminRoutes";
export * from "./VendorRoutes";
export * from "./ShoppingRoutes";
export * from "./CustomerRoutes";
