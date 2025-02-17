import mongoose, { Schema, Document, Model } from "mongoose";

interface CustomerDoc extends Document {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  addresses: mongoose.Schema.Types.ObjectId[];
  salt: string;
  verified: boolean;
  otp: number;
  otp_expiry: Date;
  isActive: boolean;
  isDeleted: boolean;
  orders: mongoose.Schema.Types.ObjectId[];
}

const CustomerSchema = new Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    addresses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "customer_address",
        required: true,
      },
    ],
    password: { type: String, required: true },
    salt: { type: String, required: true },
    verified: { type: Boolean, required: true, default: false },
    otp: { type: Number, required: true },
    otp_expiry: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000),
    }, // 10 min expiry
    orders: [
      {
        type: Schema.Types.ObjectId,
        ref: "order",
      },
    ],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.salt;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        delete ret.isDeleted;
        delete ret.otp;
        delete ret.verified;
        delete ret.otp_expiry;
      },
    },
    timestamps: true,
  }
);

const Customer = mongoose.model<CustomerDoc>("customer", CustomerSchema);

export { Customer };

// import mongoose, { Schema, Document, Model } from "mongoose";
// import { OrderDoc } from "./Order";

// interface CustomerDoc extends Document {
//   firstName: string;
//   lastName: string;
//   phone: string;
//   email: string;
//   address: string;
//   password: string;
//   salt: string;
//   verified: boolean;
//   otp: number;
//   otp_expiry: Date;
//   lat: number;
//   lng: number;
//   isActive: string;
//   is_deleted: string;
//   orders: [OrderDoc];
//   cart: any[];
// }

// const CustomerSchema = new Schema(
//   {
//     firstName: { type: String },
//     lastName: { type: String },
//     phone: { type: String, required: true },
//     email: { type: String, required: true },
//     address: { type: String },
//     password: { type: String, required: true },
//     salt: { type: String, required: true },
//     verified: { type: Boolean, required: true },
//     otp: { type: Number, required: true },
//     otp_expiry: { type: Date, required: true },
//     lat: { type: Number },
//     lng: { type: Number },
//     orders: [
//       {
//         type: Schema.Types.ObjectId,
//         ref: "order",
//       },
//     ],
//     // cart: [
//     //   {
//     //     food: { type: Schema.Types.ObjectId, ref: "food", required: true },
//     //     unit: { type: Number, required: true },
//     //   },
//     // ],
//     cart: [
//       {
//         food: { type: Schema.Types.ObjectId, ref: "food", require: true },
//         unit: { type: Number, require: true },
//       },
//     ],
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

// const Customer = mongoose.model<CustomerDoc>("customer", CustomerSchema);

// export { Customer };
