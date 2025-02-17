import { plainToClass } from "class-transformer";
import { json, NextFunction, Request, Response } from "express";
import { addAddresses } from "./CustomerAddressFN";
import {
  CartInputs,
  CreateCustomerInput,
  CustomerLoginInputs,
  EditCustomerProfileInputs,
  OrderInputs,
} from "../dto/Customer.dto";
import { validate } from "class-validator";
import {
  GenerateOTP,
  GeneratePassword,
  GenerateSalt,
  GenerateAccessSignature,
  onRequestOtp,
  ValidatePassword,
} from "../utility";
import { Customer, Food, Order } from "../models";
import mongoose from "mongoose";
import { Cart } from "../models/Cart";

//Customer CRUD
export const CustomerSignUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const dto = Object.assign(new CreateCustomerInput(), req.body);
  const errors = await validate(dto);
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.map((e) => e.constraints),
    });
  }
  const { email, password, phone, status } = dto;
  const addAddress = req.body.hasOwnProperty("addAddress")
    ? req.body.addAddress
    : undefined;
  const addressData = req.body.addressData;

  const session = await mongoose.startSession(); // Start the session

  try {
    session.startTransaction(); // Start the transaction

    const salt = await GenerateSalt();
    const userPassword = await GeneratePassword(password, salt);
    const { otp, expiry } = GenerateOTP();

    const customerData = {
      firstName: "",
      lastName: "",
      phone: phone,
      email: email,
      password: userPassword,
      salt: salt,
      verified: false,
      otp: otp,
      otp_expiry: expiry,
      orders: [],
    };
    if (status !== undefined) {
      Object.assign(customerData, { isActive: status });
    }
    const existingCustomer = await Customer.findOne({
      email: email,
      is_deleted: "0",
    });
    if (existingCustomer !== null) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exist!" });
    }
    const [newCustomer] = await Customer.create([customerData], { session });

    if (!newCustomer) {
      return res.status(400).json({
        success: false,
        message: "Something went wrong while signup.",
      });
    }
    if (addAddress !== undefined && addAddress === true && addressData) {
      const addedAddress = await addAddresses(
        newCustomer._id.toString(),
        addressData,
        session
      );
      console.log("Address Added:", addedAddress);
    }
    // Attempt to send the OTP
    const otpResponse = await onRequestOtp(otp, phone);
    if (!otpResponse) {
      return res.status(400).json({
        success: false,
        message: "Failed to send OTP. Please try again.",
      });
    }

    // Step 4: Commit the transaction
    await session.commitTransaction();
    // Generate the signature
    const signature = await GenerateAccessSignature({
      _id: String(newCustomer._id),
      email: newCustomer.email,
      verified: newCustomer.verified,
    });
    return res.status(200).json({
      signature: signature,
      verified: newCustomer.verified,
      email: newCustomer.email,
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
    // End the session regardless of success or failure
    session.endSession();
  }
}; //1st step

export const CustomerVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { otp } = req.body;
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id);
    if (profile) {
      if (profile.otp === parseInt(otp) && profile.otp_expiry >= new Date()) {
        profile.verified = true;

        const updatedCustomerResponse = await profile.save();

        const signature = await GenerateAccessSignature({
          _id: String(updatedCustomerResponse._id),
          email: updatedCustomerResponse.email,
          verified: updatedCustomerResponse.verified,
        });
        return res.status(200).json({
          signature: signature,
          email: updatedCustomerResponse.email,
          verified: updatedCustomerResponse.verified,
        });
      }
    }
  }

  return res.status(400).json({ msg: "Unable to verify Customer" });
}; // 2rd step
export const RequestOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id);

    if (profile) {
      const { otp, expiry } = GenerateOTP();
      profile.otp = otp;
      profile.otp_expiry = expiry;

      await profile.save();
      const sendCode = await onRequestOtp(otp, profile.phone);

      if (!sendCode) {
        return res
          .status(400)
          .json({ message: "Failed to verify your phone number" });
      }

      return res
        .status(200)
        .json({ message: "OTP sent to your registered Mobile Number!" });
    }
  }

  return res.status(400).json({ msg: "Error with Requesting OTP" });
}; // 3nd step

export const CustomerLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const loginInputs = plainToClass(CustomerLoginInputs, req.body);
  const loginErrors = await validate(loginInputs, {
    validationError: { target: false },
  });
  if (loginErrors.length > 0) {
    return res.status(400).json(loginErrors);
  }
  const { email, password } = loginInputs;
  const customer = await Customer.findOne({
    email: email,
    is_deleted: "0",
    isActive: "1",
  });
  if (customer) {
    const validation = await ValidatePassword(
      password,
      customer?.password,
      customer?.salt
    );
    if (validation) {
      // Generate the signature
      const signature = await GenerateAccessSignature({
        _id: String(customer._id),
        email: customer.email,
        verified: customer.verified,
      });
      return res.status(200).json({
        msg: "Logged in succesfully",
        signature: signature,
        verified: customer?.verified,
        email: customer?.email,
      });
    } else {
      return res.status(400).json("Ones check you email or password");
    }
  }
  return res.status(404).json("Error With Login");
}; //finally you can login

export const GetCustomerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id);

    if (profile) {
      return res.status(201).json(profile);
    }
  }
  return res.status(400).json({ msg: "Error while Fetching Profile" });
};

export const EditCustomerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const loggedInCustomer = req.user;
  if (loggedInCustomer) {
    const profile = await Customer.findById(loggedInCustomer._id);
    const profileInputs = plainToClass(EditCustomerProfileInputs, req.body);
    const profileErrors = await validate(profileInputs, {
      validationError: { target: false },
    });
    const { address, firstName, lastName, password, phone } = profileInputs;
    if (profileErrors.length > 0) {
      return res.status(400).json(profileErrors);
    }
    if (profile) {
      const editedFields: Partial<EditCustomerProfileInputs> = {};

      // Add fields dynamically from profileInputs
      Object.keys(profileInputs).forEach((key) => {
        if (profileInputs[key] !== undefined) {
          editedFields[key] = profileInputs[key];
        }
      });

      // Special handling for password (if needed)
      if (password) {
        const salt = await GenerateSalt();

        const hashedPassword = await GeneratePassword(password, salt);
        editedFields.password = hashedPassword;
        profile.salt = salt;
      }
      if (phone) {
        editedFields.phone = phone;
        profile.verified = false;
      }

      // Merge editedFields into the profile object
      Object.assign(profile, editedFields);

      // Save the updated profile
      const updatedProfile = await profile.save();

      return res
        .status(200)
        .json({ message: "Profile updated successfully", updatedProfile });
    }
  }
  return res.status(400).json({ msg: "Error while Updating Profile" });
};

export const DeactiveMyAcc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id);
    if (!profile) {
      return res.status(404).json({ message: "Customer profile not found." });
    }
    await Customer.findByIdAndUpdate(profile._id, { isActive: "0" });
    return res.json({ message: "Account deactivated successfully." });
  }
  return res
    .status(404)
    .json({ message: "Something went wrong while deactiving account." });
};

// /*----------------------------------- orders -----------------------------------*/
// export const CreateOrder = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   // grab the lgin in customer;
//   const customer = req.user;
//   if (customer) {
//     const orderID = `${Math.floor(Math.random() * 899999) + 1000}`;
//     const profile = await Customer.findById(customer._id);
//     const cart = <[OrderInputs]>req.body;
//     let cartItems = Array();
//     let netAmount = 0.0;
//     let vendorId;
//     const foods = await Food.find()
//       .where("_id")
//       .in(cart.map((item) => item._id))
//       .exec();
//     foods.map((food) => {
//       cart.map(({ _id, unit }) => {
//         if (food._id == _id) {
//           vendorId = food.vendorId;
//           (netAmount += food.price * unit),
//             cartItems.push({ food: food._id, unit });
//         }
//       });
//     });
//     if (!cartItems.length) {
//       return res.status(400).json({ msg: "No valid items in the cart" });
//     }
//     // Create order with item description and note of customer\
//     if (cartItems) {
//       let orderObj = {
//         orderID: orderID,
//         vendorId: vendorId,
//         items: cartItems,
//         totalAmount: netAmount,
//         orderDate: Date(),
//         paidThrough: "COD",
//         paymentResponse: "",
//         orderStatus: "Waiting",
//         remarks: "",
//         deliveryId: "",
//         applierdOffer: false,
//         offerId: null,
//         readyTime: 45,
//       };

//       // return res.status(200).json(orderObj);
//       const currentOrder = await Order.create(orderObj);
//       if (currentOrder) {
//         profile.cart = [] as any;
//         profile?.orders.push(currentOrder);
//         const UpdatedProfile = await profile.save();
//         return res.status(200).json(UpdatedProfile);
//       }
//     }
//     // Finally update ordersto user account
//   }
//   return res.status(400).json({ msg: "Error while Placing Order" });
// };

// export const GetOrders = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const customer = req.user;
//   if (customer) {
//     const profile = await Customer.findById(customer._id).populate("orders");
//     if (profile) {
//       return res.status(200).json(profile?.orders);
//     }
//   }

//   return res.status(400).json({ msg: "Error while collecting Order" });
// };
// export const GetOrderByID = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const orderId = req.params.id;
//   if (orderId) {
//     const order = await Order.findById(orderId).populate("items");
//     if (order) {
//       return res.status(200).json(order);
//     }
//   }
//   return res.status(400).json({ msg: "Error while collecting Order" });
// };

// /*----------------------------------- carts -----------------------------------*/
// // export const CreateCart = async (
// //   req: Request,
// //   res: Response,
// //   next: NextFunction
// // ) => {
// //   const customer = req.user;

// //   if (customer) {
// //     const profile = await Customer.findById(customer._id).populate("cart.food");
// //     let cartItems = Array();

// //     const { _id, unit } = <OrderInputs>req.body;

// //     const food = await Food.findById(_id);

// //     if (food) {
// //       if (profile != null) {
// //         cartItems = profile.cart;

// //         let message = "Product added successfully.";

// //         if (cartItems.length > 0) {
// //           // Check if the item exists in the cart
// //           let existFoodItems = cartItems.filter(
// //             (item) => item.food._id.toString() === _id
// //           );
// //           if (existFoodItems.length > 0) {
// //             const index = cartItems.indexOf(existFoodItems[0]);

// //             // Ensure unit is valid (minimum 1)
// //             let validUnit = unit > 0 ? unit : 1;
// //             if (unit === 0) {
// //               message =
// //                 "Minimum quantity should be 1. Product added successfully with 1 quantity.";
// //             }

// //             // Update item in the cart
// //             cartItems[index] = { food, unit: validUnit };
// //           } else {
// //             // Add new item with valid unit (default 1 if unit === 0)
// //             let addedUnit = unit > 0 ? unit : 1;
// //             if (unit === 0) {
// //               message =
// //                 "Minimum quantity should be 1. Product added successfully with 1 quantity.";
// //             }
// //             cartItems.push({ food, unit: addedUnit });
// //           }
// //         } else {
// //           // Add new item with valid unit (default 1 if unit === 0)
// //           let addedUnit = unit > 0 ? unit : 1;
// //           if (unit === 0) {
// //             message =
// //               "Minimum quantity should be 1. Product added successfully with 1 quantity.";
// //           }
// //           cartItems.push({ food, unit: addedUnit });
// //         }

// //         if (cartItems) {
// //           profile.cart = cartItems as any;
// //           const cartResult = await profile.save();
// //           return res.status(200).json({
// //             msg: message,
// //             cart: cartResult.cart,
// //           });
// //         }
// //       }
// //     }
// //   }

// //   return res.status(404).json({ msg: "Unable to add to cart!" });
// // };

// export const CreateCart = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const customer = req.user;
//   if (!customer) {
//     return res.status(401).json({ msg: "Session is expired" });
//   }

//   const { _id, unit } = <CartInputs>req.body;
//   if (!unit || unit < 1) {
//     return res.status(400).json({ msg: "Unit must be at least 1" });
//   }
//   const food = await Food.findById(_id);
//   if (!food) {
//     return res.status(404).json({ msg: "Food item not found!" });
//   }
//   const vendorId = food.vendorId; // Extract vendor ID from food item
//   let message = "Product added successfully";

//   // Fetch the cart (even if deleted)
//   let cart = await Cart.findOne({
//     customerId: customer?._id,
//     vendorId: vendorId,
//   });
//   // If no cart exists, create a new one
//   if (!cart) {
//     cart = new Cart({
//       customerId: customer?._id,
//       vendorId: vendorId,
//       items: [{ food: _id, unit: unit > 0 ? unit : 1 }],
//     });
//   } else {
//     let existingFood = cart.items.find((item) => item.food.toString() === _id);
//     if (existingFood) {
//       // Increase quantity instead of duplicating the item
//       existingFood.unit += unit > 0 ? unit : 1;
//       message = "Product quantity updated successfully";
//     } else {
//       // Add new item to this vendor's cart
//       cart.items.push({ food: _id, unit: unit > 0 ? unit : 1 });
//     }
//   }
//   await cart.save();

//   return res.status(200).json({
//     msg: message,
//     cart,
//   });
// };

// export const GetCart = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const customer = req.user;

//   if (customer) {
//     const carts = await Cart.find({ customerId: customer._id }).select(
//       "-createdAt -updatedAt -__v"
//     );
//     if (carts.length > 0) {
//       const foodId = carts.flatMap((cart) =>
//         cart.items.map((item) => item.food)
//       );
//       const foodItems = await Food.find({ _id: { $in: foodId } });

//       const updatedCarts = carts.map((cart) => {
//         const totalAmount = cart.items.reduce((sum, item) => {
//           const foodItem = foodItems.find(
//             (f) => f._id.toString() === item.food.toString()
//           );

//           // Ensure foodItem exists and has a valid price before using it
//           const price =
//             foodItem && typeof foodItem.price === "number" ? foodItem.price : 0;

//           return sum + price * item.unit; // ✅ Now correctly returns a number
//         }, 0); // Initial sum value is 0 (ensures reduce starts correctly)
//         return {
//           ...cart.toObject(),
//           totalAmount,
//         };
//       });
//       return res.status(200).json(updatedCarts);
//     }
//     return res.status(404).json({ msg: "Cart is empty!" });
//   }
//   return res.status(404).json({ msg: "Cart is empty!" });
// };
// export const DeleteCart = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const customer = req.user;

//   if (customer) {
//     await Cart.deleteMany({ customerId: customer._id });
//     return res.status(200).json({
//       message: "Your cart has been emptied successfully!",
//     });
//   }

//   return res.status(400).json({
//     message:
//       "Your cart is already empty! Hungry? Explore delicious meals and add your favorites to the cart.",
//   });
// };

// export const DeleteCartItem = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const customer = req.user;
//     const { vendorId, cartItemId } = req.params;
//     console.log(
//       `🛒 Deleting from Cart - Vendor: ${vendorId}, Item: ${cartItemId} || All`
//     );
//     const cart = await Cart.findOne({
//       customerId: customer?._id,
//       vendorId: vendorId,
//     });
//     if (!cart) {
//       return res.status(404).json({ msg: "Cart not found for this vendor!" });
//     }
//     const initialItemCount = cart.items.length;
//     cart.items = cart.items.filter((item) => {
//       return item._id.toString() !== cartItemId;
//     });
//     if (initialItemCount === cart.items.length) {
//       return res
//         .status(400)
//         .json({ msg: "Item not found under the specified vendor!" });
//     }
//     if (cart.items.length === 0) {
//       await Cart.deleteOne({ customerId: customer._id, vendorId });
//       return res
//         .status(200)
//         .json({ msg: "Cart deleted as it had no more items!" });
//     }
//     await cart.save();
//     return res
//       .status(200)
//       .json({ msg: "Cart item deleted successfully!", cart });
//   } catch (error) {
//     console.error("❌ DeleteCartItem Error:", error);
//     return res
//       .status(500)
//       .json({ message: "Something went wrong! Please try again later." });
//   }
// };
// // export const DeleteCartItem = async (
// //   req: Request,
// //   res: Response,
// //   next: NextFunction
// // ) => {
// //   try {
// //     const customer = req.user;
// //     const { vendorId, cartItemId } = req.params;
// //     const CustomerCart = await Cart.findOne({
// //       customerId: customer?._id,
// //       is_deleted: "0",
// //     });

// //     if (vendorId && cartItemId) {
// //       const cart = await Cart.findOne({
// //         customerId: customer?._id,
// //         "vendorCarts.vendorId": vendorId, // Ensure vendor exists
// //       });

// //       if (!cart) {
// //         return res.status(200).json({
// //           msg: "✅ No vendor found",
// //         });
// //       }
// //       const vendorCart = cart.vendorCarts.find((vendor) => {
// //         return vendor.vendorId.toString() === vendorId;
// //       });
// //       if (!vendorCart) {
// //         return res.status(404).json("Not found");
// //       }
// //       const itemExists = vendorCart.items.filter((item) => {
// //         return item._id.toString() === cartItemId;
// //       });
// //       if (itemExists.length <= 0) {
// //         return res
// //           .status(400)
// //           .json({ msg: "Item not found under the specified vendor!" });
// //       }
// //       if (vendorCart && itemExists.length >= 0) {
// //         const pipelineForItemManipulate = [
// //           {
// //             $match: {
// //               customerId: new mongoose.Types.ObjectId(customer?._id),
// //               "vendorCarts.vendorId": new mongoose.Types.ObjectId(vendorId),
// //               "vendorCarts.items._id": new mongoose.Types.ObjectId(cartItemId),
// //             },
// //           },
// //           {
// //             $set: {
// //               foodIdToDelete: {
// //                 $getField: {
// //                   input: {
// //                     $arrayElemAt: [
// //                       {
// //                         $reduce: {
// //                           input: "$vendorCarts",
// //                           initialValue: [],
// //                           in: {
// //                             $concatArrays: [
// //                               "$$value",
// //                               {
// //                                 $filter: {
// //                                   input: "$$this.items",
// //                                   as: "item",
// //                                   cond: {
// //                                     $eq: [
// //                                       "$$item._id",
// //                                       new mongoose.Types.ObjectId(cartItemId),
// //                                     ],
// //                                   },
// //                                 },
// //                               },
// //                             ],
// //                           },
// //                         },
// //                       },
// //                       0,
// //                     ],
// //                   },
// //                   field: "food",
// //                 },
// //               },
// //             },
// //           },
// //           {
// //             $lookup: {
// //               from: "foods",
// //               localField: "foodIdToDelete",
// //               foreignField: "_id",
// //               pipeline: [
// //                 {
// //                   $match: {
// //                     is_deleted: "0",
// //                   },
// //                 },
// //               ],
// //               as: "foodData",
// //             },
// //           },
// //           {
// //             $set: {
// //               foodPriceToDeduct: {
// //                 $getField: {
// //                   input: {
// //                     $arrayElemAt: ["$foodData", 0],
// //                   },
// //                   field: "price",
// //                 },
// //               },
// //             },
// //           },
// //           {
// //             $set: {
// //               vendorCarts: {
// //                 $map: {
// //                   input: "$vendorCarts",
// //                   as: "vendor",
// //                   in: {
// //                     $mergeObjects: [
// //                       "$$vendor",
// //                       {
// //                         items: {
// //                           $filter: {
// //                             input: "$$vendor.items",
// //                             as: "item",
// //                             cond: {
// //                               $ne: [
// //                                 "$$item._id",
// //                                 new mongoose.Types.ObjectId(cartItemId),
// //                               ],
// //                             },
// //                           },
// //                         },
// //                       },
// //                       {
// //                         totalAmount: {
// //                           $cond: {
// //                             if: {
// //                               $gt: [
// //                                 {
// //                                   $size: {
// //                                     $filter: {
// //                                       input: "$$vendor.items",
// //                                       as: "item",
// //                                       cond: {
// //                                         $eq: [
// //                                           "$$item._id",
// //                                           new mongoose.Types.ObjectId(
// //                                             cartItemId
// //                                           ),
// //                                         ],
// //                                       },
// //                                     },
// //                                   },
// //                                 },
// //                                 0,
// //                               ],
// //                             },
// //                             then: {
// //                               $subtract: [
// //                                 "$$vendor.totalAmount",
// //                                 {
// //                                   $multiply: [
// //                                     "$foodPriceToDeduct",
// //                                     {
// //                                       $getField: {
// //                                         input: {
// //                                           $arrayElemAt: [
// //                                             {
// //                                               $filter: {
// //                                                 input: "$$vendor.items",
// //                                                 as: "item",
// //                                                 cond: {
// //                                                   $eq: [
// //                                                     "$$item._id",
// //                                                     new mongoose.Types.ObjectId(
// //                                                       cartItemId
// //                                                     ),
// //                                                   ],
// //                                                 },
// //                                               },
// //                                             },
// //                                             0,
// //                                           ],
// //                                         },
// //                                         field: "unit",
// //                                       },
// //                                     },
// //                                   ],
// //                                 },
// //                               ],
// //                             },
// //                             else: "$$vendor.totalAmount",
// //                           },
// //                         },
// //                       },
// //                     ],
// //                   },
// //                 },
// //               },
// //             },
// //           },
// //           {
// //             $set: {
// //               vendorCarts: {
// //                 $filter: {
// //                   input: "$vendorCarts",
// //                   as: "vendor",
// //                   cond: {
// //                     $gt: [
// //                       {
// //                         $size: "$$vendor.items",
// //                       },
// //                       0,
// //                     ],
// //                   },
// //                 },
// //               },
// //             },
// //           },
// //           {
// //             $set: {
// //               is_deleted: {
// //                 $cond: {
// //                   if: {
// //                     $eq: [
// //                       {
// //                         $size: "$vendorCarts",
// //                       },
// //                       0,
// //                     ],
// //                   },
// //                   then: "1",
// //                   else: "0",
// //                 },
// //               },
// //             },
// //           },
// //           {
// //             $unset: ["foodIdToDelete", "foodData", "foodPriceToDeduct"],
// //           },
// //         ];
// //         const cartData = await Cart.aggregate(pipelineForItemManipulate);
// //         if (cartData.length > 0) {
// //           const updatedCart = await Cart.findOneAndUpdate(
// //             { customerId: customer?._id },
// //             {
// //               $set: {
// //                 vendorCarts: cartData[0].vendorCarts,
// //                 is_deleted: cartData[0].is_deleted,
// //               },
// //             },
// //             { new: true }
// //           );
// //           return res.status(200).json({
// //             msg: "✅ Cart item deleted and total amount updated!",
// //             updatedCart,
// //           });
// //         }
// //         return res
// //           .status(400)
// //           .json({ msg: "Something went wrong while deleting the item" });
// //       }
// //     }
// //   } catch (error) {
// //     console.error("❌ DeleteCartItem Error:", error);
// //     return res
// //       .status(500)
// //       .json({ message: "Something went wrong! Please try again later." });
// //   }
// // };
