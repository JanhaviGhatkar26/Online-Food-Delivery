import bcrypt from "bcrypt";
import moment from "moment-timezone";
import { Request } from "express";
import jwt from "jsonwebtoken";
import { AuthPayload } from "../dto/Auth.dto";
import {
  ACCESS_TOKEN_EXPIRY,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_TOKEN_SECRET,
} from "../config";

export const GenerateSalt = async () => {
  return await bcrypt.genSalt(10);
};

export const GeneratePassword = async (password: string, salt: string) => {
  return await bcrypt.hash(password, salt);
};

export const ValidatePassword = async (
  enteredPassword: string,
  savedPassword: string,
  salt: string
) => {
  return (await GeneratePassword(enteredPassword, salt)) === savedPassword;
};

export const GenerateAccessSignature = async (payload: Object) => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY || "5m",
  });
};

export const GenerateRefreshSignature = async (payload: AuthPayload) => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY || "7d",
  });
};
export const ValidateSignature = async (req: Request) => {
  const signature = req.get("Authorization");

  if (signature) {
    try {
      const payload = (await jwt.verify(
        signature.split(" ")[1],
        ACCESS_TOKEN_SECRET
      )) as AuthPayload;
      req.user = payload;
      return true;
    } catch (err) {
      return false;
    }
  }
  return false;
};

export const RefreshAcessToken = async (req: Request) => {
  const refreshToken = req.cookies.refreshToken;
  const decoded = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET!
  ) as AuthPayload & {
    iat?: number;
    exp?: number;
  };
  const { iat, exp, ...filteredDecoded } = decoded;
  const newAccessToken = await GenerateAccessSignature(filteredDecoded);
  return newAccessToken;
};

export const isRestaurantOpen = (
  openingHours: string,
  closingHours: string
): boolean => {
  const currentTime = moment().tz("Asia/Kolkata"); // Set your preferred timezone
  const openingTime = moment(openingHours, "hh:mm A");
  const closingTime = moment(closingHours, "hh:mm A");

  return currentTime.isBetween(openingTime, closingTime);
};
