import mongoose, { Schema, Document } from "mongoose";

export interface FoodDoc extends Document {
  vendorId: string;
  name: string;
  description: string;
  category: string;
  foodType: string;
  readyTime: number;
  price: number;
  rating: number;
  images: [string];
  isActive: string;
  is_deleted: string;
}

const FoodSchema = new Schema(
  {
    vendorId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String },
    foodType: { type: String, required: true },
    readyTime: { type: Number },
    price: { type: Number },
    rating: { type: Number },
    images: { type: [String] },
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
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
      },
    },
    timestamps: true,
  }
);

const Food = mongoose.model<FoodDoc>("food", FoodSchema);

export { Food };
