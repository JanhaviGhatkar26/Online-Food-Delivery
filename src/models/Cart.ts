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
        }
      ];
      totalAmount: number;
    }
  ];
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
