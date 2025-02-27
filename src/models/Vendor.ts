import mongoose, { Schema, Document, Model } from "mongoose";

interface VendorDoc extends Document {
  name: string;
  ownerName: string;
  foodType: string[];
  pincode: string;
  address: string;
  email: string;
  phone: string;
  password: string;
  isActive: boolean;
  isDeleted: boolean;
  salt: string;
  serviceAvailable: boolean;
  coverImage: string[];
  rating: number;
  foods: mongoose.Schema.Types.ObjectId[];
  openingHours: string; // e.g., "09:00 AM"
  closingHours: string; // e.g., "11:00 PM"
}

const VendorSchema = new Schema(
  {
    name: { type: String, required: true },
    ownerName: { type: String, required: true },
    foodType: { type: [String] },
    pincode: { type: String, required: true },
    address: { type: String },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    salt: { type: String, required: true },
    serviceAvailable: { type: Boolean, default: false },
    coverImage: { type: [String] },
    rating: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    foods: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "food",
      },
    ],
    openingHours: { type: String },
    closingHours: { type: String },
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.salt;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
      },
    },
    timestamps: true,
  }
);
VendorSchema.index({ email: 1, phone: 1 }, { unique: true });
VendorSchema.index({ pincode: 1 }); // ✅ Add an index on pincode for fast searches

const Vendor = mongoose.model<VendorDoc>("vendor", VendorSchema);

export { Vendor };
// import mongoose, { Schema, Document, Model } from "mongoose";

// interface VendorDoc extends Document {
//   name: string;
//   ownerName: string;
//   foodType: [string];
//   pincode: string;
//   address: string;
//   email: string;
//   phone: string;
//   password: string;
//   isActive: string;
//   is_deleted: string;
//   salt: string;
//   serviceAvailable: boolean;
//   coverImage: [string];
//   rating: number;
//   foods: any;
// }

// const VendorSchema = new Schema(
//   {
//     name: { type: String, required: true },
//     ownerName: { type: String, required: true },
//     foodType: { type: [String] },
//     pincode: { type: String, required: true },
//     address: { type: String },
//     phone: { type: String, required: true },
//     email: { type: String, required: true },
//     password: { type: String, required: true },
//     salt: { type: String, required: true },
//     serviceAvailable: { type: Boolean },
//     coverImage: { type: [String] },
//     rating: { type: Number },
//     isActive: {
//       type: String,
//       enum: ["1", "0"], // Restrict values to '1' active or '0' deactive
//       default: "1", // Set the default value to '1'
//     },
//     is_deleted: {
//       type: String,
//       enum: ["1", "0"], // Restrict values to '1' deleted or '0' No deleted
//       default: "0", // Set the default value to '1'
//     },
//     foods: [
//       {
//         type: mongoose.SchemaTypes.ObjectId,
//         ref: "food",
//       },
//     ],
//   },
//   {
//     toJSON: {
//       transform(doc, ret) {
//         delete ret.password;
//         delete ret.salt;
//         delete ret.__v;
//         delete ret.createdAt;
//         delete ret.updatedAt;
//       },
//     },
//     timestamps: true,
//   }
// );

// const Vendor = mongoose.model<VendorDoc>("vendor", VendorSchema);

// export { Vendor };
