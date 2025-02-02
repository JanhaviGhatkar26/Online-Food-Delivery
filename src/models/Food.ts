import mongoose, { Schema, Document } from "mongoose";

export interface FoodDoc extends Document {
  vendorId: mongoose.Schema.Types.ObjectId;
  name: string;
  description: string;
  category: string[];
  foodType: string;
  readyTime: number;
  price: number;
  rating: number;
  images: string[];
  isActive: boolean;
  isDeleted: boolean;
}

const FoodSchema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "vendor", required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: [String], default: [] }, // Supports multiple categories
    foodType: { type: String, required: true },
    readyTime: { type: Number },
    price: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    images: { type: [String] },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
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
