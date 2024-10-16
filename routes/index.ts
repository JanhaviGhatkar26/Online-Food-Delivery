import multer from "multer";
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images"); // Destination folder
  },
  filename: function (req, file, cb) {
    const safeFilename =
      Date.now() + "_" + file.originalname.replace(/[:\s]+|[^\w.-]+/g, "_");
    cb(null, safeFilename);
  },
});

export const images = multer({ storage: imageStorage }).array("images", 10); // Expecting an array of files under "images"
export * from "./AdminRoutes";
export * from "./VandorRoutes";
