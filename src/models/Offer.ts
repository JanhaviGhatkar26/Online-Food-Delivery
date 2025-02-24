import mongoose, { Schema, Document, Query } from "mongoose";

export interface OfferDoc extends Document {
  offerType: [
    "Vendor-Specific",
    "Bank-Specific",
    "Pincode-Specific",
    "General"
  ];
  vendors: mongoose.Schema.Types.ObjectId;
  title: string;
  description: string;
  minValue: number;
  offerAmount: number;
  startValidity: Date;
  endValidity: Date;
  promocode: string;
  promoType: "Percentage" | "Flat";
  banks: string[];
  bins: number[];
  pincodes: string[];
  isActive: boolean;
  isDeleted: boolean;
}

const OfferSchema = new Schema(
  {
    offerType: {
      type: String,
      required: true,
      enum: ["Vendor-Specific", "Bank-Specific", "Pincode-Specific", "General"],
    },
    vendors: { type: Schema.Types.ObjectId, ref: "vendor", index: true },
    title: { type: String, required: true },
    description: { type: String },
    minValue: { type: Number, required: true, min: 0 },
    offerAmount: { type: Number, required: true, min: 1 },
    startValidity: { type: Date, required: true },
    endValidity: { type: Date, required: true },
    promocode: { type: String, required: true, unique: true, index: true }, // Promo codes should be unique
    promoType: { type: String, required: true, enum: ["Percentage", "Flat"] }, // Enum for validation
    banks: { type: [String], default: [] }, // Store applicable banks
    bins: { type: [Number], default: [] }, // Store applicable BINs (Bank Identification Numbers)
    pincodes: { type: [String], required: true, default: [] }, // Store multiple pincodes
    isActive: { type: Boolean, default: true, index: true },
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
OfferSchema.index({ promocode: 1 }, { unique: true });
OfferSchema.index({ vendors: 1 });
OfferSchema.index({ isActive: 1 });

OfferSchema.pre("save", function (next) {
  if (this.startValidity >= this.endValidity) {
    return next(new Error("startValidity must be earlier than endValidity"));
  }
  next();
});

// Prevent fetching soft-deleted offers by default
OfferSchema.pre(/^find/, function (this: Query<any, any>, next) {
  this.find({ isDeleted: false });
  next();
});

const Offer = mongoose.model<OfferDoc>("offer", OfferSchema);

export { Offer };
