import mongoose, { Schema, Document } from "mongoose";

export interface CartDoc extends Document {
  customerId: string;
  vendorCarts: [
    {
      vendorId: string;
      items: [
        {
          food: string;
          unit: number;
          _id?: string;
        }
      ];
      totalAmount: number;
    }
  ];
  is_deleted: string;
}

const CartSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "customer",
      required: true,
    },
    vendorCarts: [
      {
        vendorId: {
          type: Schema.Types.ObjectId,
          ref: "vendor",
          required: true,
        },
        items: [
          {
            food: { type: Schema.Types.ObjectId, ref: "food", required: true },
            unit: { type: Number, required: true },
          },
        ],
        totalAmount: { type: Number, required: true, default: 0 },
      },
    ],
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

const Cart = mongoose.model<CartDoc>("cart", CartSchema);

export { Cart };
