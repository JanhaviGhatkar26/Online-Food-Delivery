import mongoose, { Schema, Document, Model } from "mongoose";

interface addressDoc extends Document {
  customer: mongoose.Schema.Types.ObjectId; // Reference to the Customer
  tag: "home" | "work" | "hotel" | "other"; // Enum for predefined tags
  line1: string;
  line2: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
}

const AddressSchema = new Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customer",
      required: true,
    }, // Reference to the Customer
    tag: {
      type: String,
      enum: ["home", "work", "hotel", "other"],
      default: "Home",
    },
    line1: { type: String, required: true },
    line2: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
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

const CustomerAddress = mongoose.model<addressDoc>(
  "customer_address",
  AddressSchema
);

export { CustomerAddress };
