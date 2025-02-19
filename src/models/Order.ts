import mongoose, { Schema, Document } from "mongoose";

export interface OrderDoc extends Document {
  orderID: string;
  vendorId: mongoose.Schema.Types.ObjectId;
  items: {
    food: mongoose.Schema.Types.ObjectId;
    unit: number;
    priceAtTime: number;
  }[];
  totalAmount: number;
  addressId: mongoose.Schema.Types.ObjectId;
  orderDate: Date;
  paidThrough: "cod" | "uip" | "netbanking" | "creditcard" | "debitcard"; // Enum added
  paymentResponses: Record<string, any>; // Can store JSON
  orderStatus:
    | "pending"
    | "accepted"
    | "preparing"
    | "ready"
    | "out for delivery"
    | "delivered"
    | "cancelled";
  remarks: string;
  deliveryId: mongoose.Schema.Types.ObjectId | null;
  appliedOffers: boolean;
  offerId: mongoose.Schema.Types.ObjectId | null;
  readyTime: number;
}

const OrderSchema = new Schema(
  {
    orderID: { type: String, required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "vendor", required: true },
    items: [
      {
        food: { type: Schema.Types.ObjectId, ref: "food", required: true },
        unit: { type: Number, required: true },
        priceAtTime: { type: Number, required: true }, // Stores the food price at the time of order
      },
    ],
    totalAmount: { type: Number, required: true },
    addressId: {
      type: Schema.Types.ObjectId,
      ref: "customer_address",
      required: true,
    }, // Added address reference
    orderDate: { type: Date, default: Date.now },
    paidThrough: {
      type: String,
      enum: ["cod", "uip", "netbanking", "creditcard", "debitcard"],
      required: true,
    },
    paymentResponses: { type: Schema.Types.Mixed, default: {} }, // Stores payment details
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "preparing",
        "ready",
        "out for delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    remarks: { type: String },
    deliveryId: { type: Schema.Types.ObjectId, ref: "delivery", default: null },
    appliedOffers: { type: Boolean, default: false },
    offerId: { type: Schema.Types.ObjectId, ref: "offer", default: null },
    readyTime: { type: Number, default: 45 },
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

const Order = mongoose.model<OrderDoc>("order", OrderSchema);

export { Order };
// import mongoose, { Schema, Document } from "mongoose";

// export interface OrderDoc extends Document {
//   orderID: string; // 63893
//   vendorId: string;
//   items: [any]; //[{food: , unit:3}]
//   totalAmount: number; //999
//   orderDate: Date;
//   paidThrough: string; // COD, credit debit, wallet
//   paymentResponses: string; //{status:true, response: some bank message}
//   orderStatus: string;
//   remarks: string;
//   deliveryId: string;
//   appliedOffers: boolean;
//   offerId: string;
//   readyTime: number; // max 60 minutes
// }

// const OrderSchema = new Schema(
//   {
//     orderID: { type: String, required: true },
//     vendorId: { type: String, required: true },
//     items: [
//       {
//         food: { type: Schema.Types.ObjectId, ref: "food", required: true },
//         unit: { type: Number, required: true },
//       },
//     ],
//     totalAmount: { type: Number, required: true },
//     orderDate: { type: Date },
//     paidThrough: { type: String },
//     paymentResponses: { type: String },
//     orderStatus: { type: String },
//     remarks: { type: String },
//     deliveryId: { type: String },
//     appliedOffers: { type: Boolean },
//     offerId: { type: String },
//     readyTime: { type: Number },
//   },
//   {
//     toJSON: {
//       transform(doc, ret) {
//         delete ret.__v;
//         delete ret.createdAt;
//         delete ret.updatedAt;
//       },
//     },
//     timestamps: true,
//   }
// );

// const Order = mongoose.model<OrderDoc>("order", OrderSchema);

// export { Order };
