import mongoose, { Schema, Document, Model } from "mongoose";

interface AdminDoc extends Document {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  salt: string;
  role: "admin";
  isActive: boolean;
  isDeleted: boolean;
}

const AdminSchema = new Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    salt: { type: String, required: true },
    role: { type: String, required: true, enum: ["admin"], default: "admin" },
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
      },
    },
    timestamps: true,
  }
);

const Admin = mongoose.model<AdminDoc>("admin", AdminSchema);

export { Admin };
