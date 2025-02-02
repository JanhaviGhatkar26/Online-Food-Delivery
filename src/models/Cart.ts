import mongoose, { Schema, Document } from "mongoose";

export interface CartDoc extends Document {
  customerId: mongoose.Schema.Types.ObjectId;
  vendorId: mongoose.Schema.Types.ObjectId;
  items: {
    food: mongoose.Schema.Types.ObjectId;
    unit: number;
    _id?: string;
  }[];
}

const CartSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "customer",
      required: true,
    },
    vendorId: { type: Schema.Types.ObjectId, ref: "vendor", required: true },
    items: [
      {
        food: { type: Schema.Types.ObjectId, ref: "food", required: true },
        unit: { type: Number, required: true, min: 1 }, // Ensure unit is always > 0
      },
    ],
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

const Cart = mongoose.model<CartDoc>("cart", CartSchema);

export { Cart };
