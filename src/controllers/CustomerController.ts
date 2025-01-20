import { plainToClass } from "class-transformer";
import { NextFunction, Request, Response } from "express";
import {
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
  GenerateSignature,
  onRequestOtp,
  ValidatePassword,
} from "../utility";
import { Customer, Food, Order } from "../models";
import mongoose from "mongoose";

//Customer CRUD
export const CustomerSignUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customerInputs = plainToClass(CreateCustomerInput, req.body);
  const inputError = await validate(customerInputs, {
    validationError: { target: true },
  });
  console.log("inputError :", inputError);
  if (inputError.length > 0) {
    return res.status(400).json(inputError);
  }
  const { email, password, phone, status } = customerInputs;
  const salt = await GenerateSalt();
  const userPassword = await GeneratePassword(password, salt);
  const { otp, expiry } = GenerateOTP();
  console.log("otp, expiry:", otp, expiry);
  const customerData = {
    firstName: "",
    lastName: "",
    phone: phone,
    email: email,
    address: "",
    password: userPassword,
    salt: salt,
    verified: false,
    otp: otp,
    otp_expiry: expiry,
    lat: 0,
    lng: 0,
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
    return res.status(400).json({ message: "Email already exist!" });
  }
  const newCustomer = await Customer.create(customerData);

  if (newCustomer) {
    // Attempt to send the OTP
    const otpResponse = await onRequestOtp(otp, phone);
    if (!otpResponse) {
      return res
        .status(400)
        .json({ message: "Failed to send OTP. Please try again." });
    }

    // Generate the signature
    const signature = await GenerateSignature({
      _id: String(newCustomer._id),
      email: newCustomer.email,
      verified: newCustomer.verified,
    });

    return res.status(200).json({
      signature: signature,
      verified: newCustomer.verified,
      email: newCustomer.email,
    });
  }
  return res.status(400).json("error to signup");
}; //1st step

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
}; // 2nd step

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

        const signature = await GenerateSignature({
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
}; // 3rd step

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
    console.log("customer :", customer);
    const validation = await ValidatePassword(
      password,
      customer?.password,
      customer?.salt
    );
    console.log("validation :", validation);
    if (validation) {
      // Generate the signature
      const signature = await GenerateSignature({
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
        console.log("password :", password);
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

/*----------------------------------- orders -----------------------------------*/
export const CreateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // grab the lgin in customer;
  const customer = req.user;
  if (customer) {
    // create an order ID;
    const orderID = `${Math.floor(Math.random() * 899999) + 1000}`;
    const profile = await Customer.findById(customer._id);
    // Grab order items fromrequest ({id:xx , unit:xx});
    const cart = <[OrderInputs]>req.body;
    let cartItems = Array();
    let netAmount = 0.0;
    // Calculate order amount
    const foods = await Food.find()
      .where("_id")
      .in(cart.map((item) => item._id))
      .exec();
    foods.map((food) => {
      cart.map(({ _id, unit }) => {
        if (food._id == _id) {
          (netAmount += food.price * unit),
            cartItems.push({ food: food._id, unit });
        }
      });
    });
    if (!cartItems.length) {
      return res.status(400).json({ msg: "No valid items in the cart" });
    }
    // Create order with item description and note of customer\
    if (cartItems) {
      let orderObj = {
        orderID: orderID,
        items: cartItems,
        totalAmount: netAmount,
        orderDate: Date(),
        paidThrough: "COD",
        paymentResponse: "",
        orderStatus: "Waiting",
      };
      // console.log("orderObj :", orderObj);
      // return res.status(200).json(orderObj);
      const currentOrder = await Order.create(orderObj);
      if (currentOrder) {
        console.log("currentOrder :", currentOrder);
        profile?.orders.push(currentOrder);
        await profile.save();
        return res.status(200).json(currentOrder);
      }
    }
    // Finally update ordersto user account
  }
  return res.status(400).json({ msg: "Error while Placing Order" });
};
export const GetOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id).populate("orders");
    if (profile) {
      return res.status(200).json(profile?.orders);
    }
  }

  return res.status(400).json({ msg: "Error while collecting Order" });
};
export const GetOrderByID = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const orderId = req.params.id;
  if (orderId) {
    const order = await Order.findById(orderId).populate("items");
    if (order) {
      return res.status(200).json(order);
    }
  }
  return res.status(400).json({ msg: "Error while collecting Order" });
};

/*----------------------------------- carts -----------------------------------*/
// export const CreateCart = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   // grab the lgin in customer;
//   const customer = req.user;
//   if (customer) {
//     const profile = await Customer.findById(customer._id).populate("cart.food");
//     let cartItems = Array();
//     const { _id, unit } = <OrderInputs>req.body;
//     const food = await Food.findById(_id);
//     if (food) {
//       if (profile != null) {
//         //check for cart item
//         cartItems = profile.cart;
//         if (cartItems.length > 0) {
//           //check and update
//           let existFoodItem = cartItems.filter((item) => {
//             item?.food?._id.toString() === _id;
//           });
//           if (existFoodItem.length > 0) {
//             const index = cartItems.indexOf(existFoodItem[0]);
//             if (unit > 0) {
//               cartItems[index] = { food, unit };
//             } else {
//               cartItems.splice(index, 1);
//             }
//           } else {
//             cartItems.push({ food, unit });
//           }
//         } else {
//           //add new item to the cart
//           cartItems.push({ food, unit });
//         }
//         if (cartItems) {
//           profile.cart = cartItems as any;
//           const cartresult = await profile.save();
//           console.log("cartresult", cartresult);
//           return res.status(200).json(cartresult?.cart);
//         }
//       }
//     }
//   }
//   return res.status(400).json({ msg: "Error while Placing in cart" });
// };
export const CreateCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id).populate("cart.food");
    let cartItems = Array();

    const { _id, unit } = <OrderInputs>req.body;

    const food = await Food.findById(_id);

    if (food) {
      if (profile != null) {
        cartItems = profile.cart;

        let message = "Product added successfully.";

        if (cartItems.length > 0) {
          // Check if the item exists in the cart
          let existFoodItems = cartItems.filter(
            (item) => item.food._id.toString() === _id
          );
          if (existFoodItems.length > 0) {
            const index = cartItems.indexOf(existFoodItems[0]);

            // Ensure unit is valid (minimum 1)
            let validUnit = unit > 0 ? unit : 1;
            if (unit === 0) {
              message =
                "Minimum quantity should be 1. Product added successfully with 1 quantity.";
            }

            // Update item in the cart
            cartItems[index] = { food, unit: validUnit };
          } else {
            // Add new item with valid unit (default 1 if unit === 0)
            let addedUnit = unit > 0 ? unit : 1;
            if (unit === 0) {
              message =
                "Minimum quantity should be 1. Product added successfully with 1 quantity.";
            }
            cartItems.push({ food, unit: addedUnit });
          }
        } else {
          // Add new item with valid unit (default 1 if unit === 0)
          let addedUnit = unit > 0 ? unit : 1;
          if (unit === 0) {
            message =
              "Minimum quantity should be 1. Product added successfully with 1 quantity.";
          }
          cartItems.push({ food, unit: addedUnit });
        }

        if (cartItems) {
          profile.cart = cartItems as any;
          const cartResult = await profile.save();
          return res.status(200).json({
            msg: message,
            cart: cartResult.cart,
          });
        }
      }
    }
  }

  return res.status(404).json({ msg: "Unable to add to cart!" });
};

export const GetCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id).populate("cart.food");
    if (profile) {
      return res.status(200).json(profile?.cart);
    }
  }
  return res.status(404).json({ msg: "Cart is empty!" });
};
export const DeleteCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id)
      .populate("cart.food")
      .exec();

    if (profile != null) {
      profile.cart = [] as any;
      const cartResult = await profile.save();

      return res.status(200).json(cartResult);
    }
  }

  return res.status(400).json({ message: "cart is Already Empty!" });
};

export const DeleteCartItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user; // Assuming user info is added to the request during authentication
  const { cartItemId } = req.params; // The cart item's _id passed as a route parameter
  if (customer) {
    const profile = await Customer.findById(customer._id);
    if (profile && profile.cart) {
      const updatedCart = profile.cart.filter((item) => {
        return !item._id.equals(cartItemId);
      });
      profile.cart = updatedCart;
      await profile.save();
      // const updatedProfile = await profile.save();
      const updatedProfile = await Customer.findById(customer._id);
      return res.status(200).json({
        message: "Cart item deleted successfully.",
        cart: updatedProfile.cart,
      });
    }
  }
  // Find the customer by their ID

  return res.status(404).json({ message: "Cart item not found." });
};
