import mongoose, { Schema, Document, Model } from "mongoose";

interface VandorDoc extends Document {
  name: string;
  ownerName: string;
  foodType: [string];
  pincode: string;
  address: string;
  email: string;
  phone: string;
  password: string;
  isActive: string;
  is_deleted: string;
  salt: string;
  serviceAvailable: [string];
  coverImage: [string];
  rating: number;
  // foods: any;
}

const VandorSchema = new Schema(
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
    serviceAvailable: { type: Boolean },
    coverImage: { type: [String] },
    rating: { type: Number },
    isActive: {
      type: String,
      enum: ["1", "0"], // Restrict values to '1' active or '0' deactive
      default: "1", // Set the default value to '1'
    },
    is_deleted: {
      type: String,
      enum: ["1", "0"], // Restrict values to '1' deleted or '0' No deleted
      default: "0", // Set the default value to '1'
    },
    // foods: [
    //   {
    //     tyeps: mongoose.SchemaTypes.ObjectId,
    //     ref: "food",
    //   },
    // ],
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

const Vandor = mongoose.model<VandorDoc>("vandor", VandorSchema);

export { Vandor };
