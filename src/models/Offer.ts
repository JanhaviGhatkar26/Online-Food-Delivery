import mongoose, { Schema, Document } from "mongoose";

export interface OfferDoc extends Document {
  offerType: string;
  vendors: mongoose.Schema.Types.ObjectId[];
  title: string;
  description: string;
  minValue: number;
  offerAmount: number;
  startValidity: Date;
  endValidity: Date;
  promocode: string;
  promoType: string;
  banks: string[];
  bins: number[];
  pincodes: string[];
  isActive: boolean;
  isDeleted: boolean;
}

const OfferSchema = new Schema(
  {
    offerType: { type: String, required: true },
    vendors: [{ type: Schema.Types.ObjectId, ref: "vendor" }],
    title: { type: String, required: true },
    description: { type: String },
    minValue: { type: Number, required: true },
    offerAmount: { type: Number, required: true },
    startValidity: { type: Date, required: true },
    endValidity: { type: Date, required: true },
    promocode: { type: String, required: true, unique: true }, // Promo codes should be unique
    promoType: { type: String, required: true, enum: ["Percentage", "Flat"] }, // Enum for validation
    banks: { type: [String], default: [] }, // Store applicable banks
    bins: { type: [Number], default: [] }, // Store applicable BINs (Bank Identification Numbers)
    pincodes: { type: [String], required: true, default: [] }, // Store multiple pincodes
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

const Offer = mongoose.model<OfferDoc>("offer", OfferSchema);

export { Offer };

// import mongoose, { Schema, Document } from "mongoose";

// export interface OfferDoc extends Document {
//   offerType: string;
//   vendors: [any];
//   tittle: string;
//   description: string;
//   minValue: number;
//   offerAmount: number;
//   startValidity: Date;
//   endValidity: Date;
//   promocode: string;
//   promoType: string;
//   bank: [any];
//   bins: [any];
//   pincode: string;
//   isActive: string;
//   is_deleted: string;
// }

// const OfferSchema = new Schema(
//   {
//     offerType: { type: String, required: true },
//     vendors: [{ type: Schema.Types.ObjectId, ref: "vendor" }],
//     title: { type: String, required: true },
//     description: { type: String },
//     minValue: { type: Number, required: true },
//     offerAmount: { type: Number, required: true },
//     startValidity: { type: Date },
//     endValidity: { type: Date },
//     promocode: { type: String, required: true },
//     promoType: { type: String, required: true },
//     bank: [{ type: String }],
//     bins: [{ type: Number }],
//     pincode: { type: String, required: true },
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
//         delete ret.__v;
//         delete ret.createdAt;
//         delete ret.updatedAt;
//       },
//     },
//     timestamps: true,
//   }
// );

// const Offer = mongoose.model<OfferDoc>("offer", OfferSchema);

// export { Offer };
