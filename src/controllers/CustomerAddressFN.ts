import mongoose from "mongoose";
import { Customer, CustomerAddress } from "../models";
import { validate } from "class-validator";
import { NextFunction, Request, Response } from "express";
import { AddAddressDTO } from "../dto";

export const addAddresses = async (
  customerId: string,
  addressData: any,
  session: mongoose.ClientSession
) => {
  console.log("customerId :", customerId, "addressData :", addressData);
  // Step 1: Validate customerId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    throw new Error("Invalid customer ID format");
  }

  // Step 2: Check if the customer exists
  const customer = await Customer.findOne({
    _id: customerId,
    isDeleted: false,
    isActive: true,
  }).session(session);
  console.log("customer :", customer);
  if (!customer) throw new Error("Customer not found");

  // Step 3: Validate input data using DTO
  const dto = Object.assign(new AddAddressDTO(), addressData);
  const errors = await validate(dto);
  if (errors.length > 0) {
    throw new Error(
      errors.map((err) => Object.values(err.constraints)).join(", ")
    );
  }

  // Step 4: Create the new address
  const newAddress = await CustomerAddress.create(
    [
      {
        customer: customerId,
        ...addressData, // Validated data
      },
    ],
    { session }
  );

  // Step 5: Push the new address ID to the Customer's address array
  await Customer.findByIdAndUpdate(
    customerId,
    {
      $push: { addresses: newAddress[0]._id },
    },
    { session }
  );

  return newAddress[0];
};
// export const addAddresses = async (customerId: string, addressData: any) => {
//   // try {
//   console.log("customerId :", customerId, "addressData :", addressData);
//   // Step 1: Validate customerId is a valid MongoDB ObjectId
//   if (!mongoose.Types.ObjectId.isValid(customerId)) {
//     throw new Error("Invalid customer ID format");
//   }

//   // Step 2: Check if the customer exists
//   const customer = await Customer.findById(customerId, {
//     isDeleted: false,
//     isActive: true,
//   });
//   console.log("customer :", customer);
//   if (!customer) throw new Error("Customer not found");

//   // Step 3: Validate input data using DTO
//   const dto = Object.assign(new AddAddressDTO(), addressData);
//   const errors = await validate(dto);
//   if (errors.length > 0) {
//     throw new Error(
//       errors.map((err) => Object.values(err.constraints)).join(", ")
//     );
//   }

//   // Step 4: Create the new address
//   const newAddress = await CustomerAddress.create({
//     customer: customerId,
//     ...addressData, // Validated data
//   });

//   // Step 5: Push the new address ID to the Customer's address array
//   await Customer.findByIdAndUpdate(customerId, {
//     $push: { addresses: newAddress._id },
//   });

//   return newAddress;
//   // } catch (error) {
//   //   throw new Error("Failed to add address: " + error.message);
//   // }
// };
export const addAddressToCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { customerId } = req.params; // Get customerId and addressData from the request body
  const { addressData } = req.body; // Get customerId and addressData from the request body
  if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing customer ID.",
    });
  }
  // Start a new MongoDB session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await addAddresses(customerId, addressData, session);
    // Commit the transaction after both the address and customer are updated
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Address added successfully.",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error during customer signup:", error.message);

    return res.status(400).json({
      success: false,
      message: "An error occurred during signup. Please try again.",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};
