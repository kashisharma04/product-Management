const cartModel = require('../models/cartModel');
const userModel = require('../models/userModel');
const productModel = require('../models/productModel');
const { isValidObjectId } = require('mongoose');
const { isValidRequestBody } = require('../validations/validation');


//===========================/GET API/============================================

const createCart = async function (req, res) {
  try {
    let userId = req.params.userId;

    if (!isValidObjectId(userId)) {
      return res.status(400).send({status: false,message: "UserId is invalid , please provide valid userId."});
    }

    let checkUserId = await userModel.findById(userId);

    if (!checkUserId) {
      return res.status(404).send({status: false,message: " This user is not exsit or it might be deleted."});
    }

    let data = req.body;
    let { productId, quantity, cartId } = data;

    if (!isValidRequestBody(data)) {
      return res.status(400).send({status: false,message:"You can not create cart with empty body,please provide required credentals."});
    }

    if (!productId) {
      return res.status(400).send({ status: false, message: " Please provide productId." });
    }

    if (!isValidObjectId(productId)) {
      return res.status(400).send({ status: false, message: "Please provide a Valid product Id." });
    }

    let checkProductExist = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!checkProductExist) {
      return res.status(400).send({status: false,message: "Product does not  Exists of this Id."});
    }

    if (!quantity) {
      return res
        .status(400)
        .send({
          status: false,
          message: "Please enter some quantity of the products.",
        });
    }

    let checkUserExist = await cartModel.findOne({ userId: userId });

    if (!checkUserExist) {
      let addNewCart = {
        userId: userId,
        items: [
          {
            productId: productId,
            quantity: quantity,
          },
        ],
        totalItems: 1,
        totalPrice: checkProductExist.price * quantity,
      };

      let createCart = await cartModel.create(addNewCart);

      return res
        .status(201)
        .send({ status: true, message: "Success", data: createCart });
    } else {
      if (!cartId) {
        return res.status(400).send({ status: false, message: " Please provide CartId." });
      }

      if (!isValidObjectId(cartId)) {
        return res
          .status(400)
          .send({ status: false, message: "Please provide a Valid CartId" });
      }

      let checkCartExist = await cartModel.findById(cartId);

      if (!checkCartExist) {
        return res
          .status(404)
          .send({
            status: false,
            message: "Cart is not found with this CartId",
          });
      }
      if (cartId != checkUserExist._id) {
        return res
          .status(401)
          .send({
            status: false,
            message: " This cart does not belong to that user.",
          });
      }

      for (i = 0; i < checkCartExist.items.length; i++) {
        if (checkCartExist.items[i].productId == productId) {
          checkCartExist.items[i].quantity =
            checkCartExist.items[i].quantity + parseInt(quantity);

          checkCartExist.totalPrice =
            checkCartExist.totalPrice + quantity * checkProductExist.price;

          checkCartExist.save();

          return res
            .status(201)
            .send({ status: true, message: "Success", data: checkCartExist });
        }
      }

      if (checkCartExist.items.productId != productId) {
        let items = { productId: productId, quantity: quantity };

        let totalPrice =
          checkCartExist.totalPrice + quantity * checkProductExist.price;

        let updateCartItems = await cartModel.findOneAndUpdate(
          { _id: cartId },
          {
            $set: { totalPrice: totalPrice },
            $push: { items: items },
            $inc: { totalItems: 1 },
          },
          { new: true }
        );

        return res
          .status(201)
          .send({ status: true, message: "Success", data: updateCartItems });
      }
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};



//================================= Get Cart ================================================//



const getCart = async function (req, res) {
    try {
      let userId = req.params.userId;
  
      if (userId) {
        if (!isValidObjectId(userId))
          return res
            .status(400)
            .send({ status: false, message: "Please provide correct UserId." });
      }
  
      let checkUserId = await userModel.findById(userId);
  
      if (!checkUserId) {
        return res
          .status(404)
          .send({ status: false, message: "No user found with this userId." });
      }
  
      let getCartData = await cartModel.findOne({ userId: userId });
  
      if (!getCartData) {
        return res
          .status(404)
          .send({ status: false, message: "Cart not found with this userId." });
      }
  
      if (getCartData.items.length == 0) {
        return res
          .status(400)
          .send({
            status: false,
            message: "Items details not found or it may be deleted.",
          });
      }
  
      return res
        .status(200)
        .send({ status: true, message: "Success", data: getCartData });
    } catch (error) {
      return res.status(500).send({ status: false, message: error.message });
    }
  };
  
  
  
  
//================================= Update Cart ================================================//

const updateCart = async function (req, res) {
  try {//- Check if the productId exists and is not deleted before updating the cart.
      let user = req.params.userId
      let data = req.body
      let { productId,removeProduct } = data

      if(Object.keys(data).length==0)return res.status(400).send({ status: false, msg: "body can not be empty" });
      //--------------------------objectIt Validation.................//
      const isValidObjectId = mongoose.Types.ObjectId.isValid(productId);
      if (!isValidObjectId) return res.status(400).send({ status: false, message: "Invalid ProductId" })
      //---------------------checking in cart
      let cart = await cartModel.findOne({ userId: user})
      if (!cart) return res.status(404).send({ status: false, message: "cart does not exit" })
      //checking if cart is empty or not
      if (cart.items.length == 0) {return res.status(400).send({ status: false, message: "cart is empty" });}
      //------------------findingProduct.................//
      let product = await productModel.findOne({ _id: productId, isDeleted: false })
      if (!product) return res.status(404).send({ status: false, message: "Product not Found" })

      //----------finding productId from cart
      
      let productid = cart.items.filter(x =>
          x.productId.toString() == productId
      )

      if (productid.length == 0) {
          return res.status(400).send({ status: false, message: "Product is not present in cart" })
      }
      //finding position of productId in cart
      let index = cart.items.indexOf(productid[0]);

      if (removeProduct == 1) {
          cart.items[index].quantity -= 1;//updating quantity
          cart.totalPrice =Number.parseFloat(cart.totalPrice - product.price).toFixed(2)//updating price
          if (cart.items[index].quantity == 0) {
              cart.items.splice(index, 1)
          }
          cart.totalItems = cart.items.length
          cart.save();
      }

      if (removeProduct == 0) {

          cart.totalPrice = Number.parseFloat(cart.totalPrice - product.price * cart.items[index].quantity).toFixed(2)//updating price here
          cart.items.splice(index, 1)//removing product
          cart.totalItems = cart.items.length//updating items
          cart.save()
      }

      return res.status(200).send({ status: true, message: "Data updated successfully", data: cart })

  } catch (err) {
      return res.status(500).send({ message: err.message })
  }
}
  
//================================= Delete Cart ================================================//


const deleteCart = async function (req, res) {
    try {
      let userId = req.params.userId;
  
      if (!isValidObjectId(userId)) {
        return res
          .status(400)
          .send({ status: false, message: "Please provide valid userId. " });
      }
  
      let cartDeleted = await cartModel.findOneAndUpdate(
        { userId: userId },
        { $set: { items: [], totalPrice: 0, totalItem: 0 } },
        { new: true }
      );
  
      if (!cartDeleted) {
        return res
          .status(404)
          .send({
            status: false,
            message: "Cart does not exit in with this userId.",
          });
      }
  
      return res
        .status(200)
        .send({ status: true, message: "Cart succesully deleted." });
    } catch (error) {
      return res.status(500).send({ status: false, message: error.message });
    }
  };
  
  
  
  module.exports = { createCart, getCart, updateCart, deleteCart };
  