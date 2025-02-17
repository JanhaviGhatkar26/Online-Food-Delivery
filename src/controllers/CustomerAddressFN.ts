import mongoose from "mongoose";
import { Customer, CustomerAddress } from "../models";
import { validate } from "class-validator";
import { NextFunction, Request, Response } from "express";
import { AddAddressDTO, UpdateAddressDTO } from "../dto";

export const addAddresses = async (
  customerId: string,
  addressData: AddAddressDTO,
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

export const addAddressToCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { _id } = req.user;
  const { addressData } = req.body; // Get _id and addressData from the request body
  if (req.user) {
    if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing customer ID.",
      });
    }
    // Start a new MongoDB session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await addAddresses(_id, addressData, session);
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
  }
};

export const UpdateAddressToCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { _id } = req.user;
  const { addressId } = req.params;
  const { addressData } = req.body;
  console.log(
    `Updating addressId ${addressId} for customer ${_id} with details ${addressData}`
  );

  if (req.user) {
    if (
      !mongoose.Types.ObjectId.isValid(_id) ||
      !mongoose.Types.ObjectId.isValid(addressId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID or address ID format",
      });
    }

    // Validate addressData using DTO
    const dto = Object.assign(new UpdateAddressDTO(), addressData);
    const errors = await validate(dto);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.map((err) => Object.values(err.constraints)).join(", "),
      });
    }
    // Filter out only fields that are present in the request body
    const updateFields: Partial<UpdateAddressDTO> = {};
    for (const key of Object.keys(addressData)) {
      console.log("addressData :", addressData);
      if (addressData[key] !== undefined) {
        updateFields[key] = addressData[key];
      }
    }
    // Start MongoDB transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const updatedAddress = await CustomerAddress.findOneAndUpdate(
        { _id: addressId, customer: _id },
        { $set: updateFields },
        { new: true, session }
      );

      if (!updatedAddress) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: "Address not found or does not belong to the customer",
        });
      }

      // Step 2: Ensure the address still exists in the Customer's address list
      const customer = await Customer.findOne(
        { _id: _id, addresses: addressId },
        null,
        { session }
      );

      if (!customer) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: "Customer not found or address not linked to customer",
        });
      }

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: "Address updated successfully",
        updatedAddress,
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error during updating customer details:", error.message);

      return res.status(400).json({
        success: false,
        message:
          "An error occurred during updating the customer details. Please try again.",
        error: error.message,
      });
    } finally {
      session.endSession();
    }
  }
};

export const DeleteAddressById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { _id } = req.user;

  const { addressId } = req.params;
  if (req.user) {
    if (
      !mongoose.Types.ObjectId.isValid(_id) ||
      !mongoose.Types.ObjectId.isValid(addressId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID or address ID format",
      });
    }
    console.log(`Deleting addressId ${addressId} for customer ${_id}`);
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const deletedAddress = await CustomerAddress.findOneAndDelete(
        {
          _id: addressId,
          customer: _id,
        },
        { session }
      );
      if (!deletedAddress) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: "Address not found or does not belong to the customer",
        });
      }

      // Step 2: Remove address reference from Customer collection
      const updatedCustomer = await Customer.findByIdAndUpdate(
        _id,
        { $pull: { addresses: addressId } }, // Remove address from array
        { session, new: true }
      );
      if (!updatedCustomer) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
          success: false,
          message: "Failed to update customer record",
        });
      }

      // Commit the transaction if both operations succeed
      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: "Address deleted successfully",
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error during updating customer details:", error.message);

      return res.status(400).json({
        success: false,
        message:
          "An error occurred during updating the customer details. Please try again.",
        error: error.message,
      });
    } finally {
      session.endSession();
    }
  }
};

export const GeteAddressByID = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;

  const { addressId } = req.params;
  if (req.user) {
    if (
      !mongoose.Types.ObjectId.isValid(customer._id) ||
      (addressId && !mongoose.Types.ObjectId.isValid(addressId))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID or address ID format",
      });
    }
    const customerDetails = await Customer.findOne({
      _id: customer._id,
      isDeleted: false,
      isActive: true,
    })
      .populate({
        path: "addresses",
        select: "-__v -createdAt -updatedAt", // Excluding fields
      })
      .select("_id firstName lastName phone email addresses isActive")
      .lean();

    if (!customerDetails) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Filter addresses to include only the requested address ID
    if (addressId) {
      customerDetails.addresses = customerDetails.addresses.filter(
        (addr: any) => addr._id.toString() === addressId
      );
    }
    if (customerDetails.addresses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Address not found for this customer",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Customer details fetched successfully",
      customerDetails,
    });
  }
};
