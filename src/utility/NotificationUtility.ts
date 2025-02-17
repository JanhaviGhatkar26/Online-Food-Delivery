import { TWILIOACCOUNTSID, TWILIOAUTHTOKEN } from "../config";

//OTP
export const GenerateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  let expiry = new Date();
  expiry.setTime(new Date().getTime() + 30 * 60 * 1000);
  return { otp, expiry };
};

export const onRequestOtp = async (otp: number, toPhoneNUmber: string) => {
  const accountSid = `${TWILIOACCOUNTSID}`;
  const authToken = `${TWILIOAUTHTOKEN}`;

  const client = require("twilio")(accountSid, authToken);

  const response = await client.messages.create({
    body: `Your otp is ${otp}`,
    from: "+12294750028", // From a valid Twilio number
    to: `+917738761273`, // Text your number
    // to: `+91${toPhoneNUmber}`, // Text your number
  });
  return response;
};
