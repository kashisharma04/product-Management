const productModel = require('../models/productModel');
const { isValidObjectId } = require('mongoose');
const { uploadFile } = require('../aws/aws');
const { isValidRequestBody, isValidEmail, isValid, isValidSize, isValidImage, isValidNumber, isValidPassword, isValidMobile, isValidPlace, isValidPincode } = require('../validations/validation');


//================================= Create Product ================================================//

let createProduct = async function (req, res) {
  try {
    let data = req.body;
    let {
      title,
      description,
      price,
      currencyId,
      currencyFormat,
      isFreeShipping,
      style,
      availableSizes,
      installments,
    } = data;

    if (!isValidRequestBody(data)) {
      return res.status(400).send({ status: "false", message: "Please enter the data in request body" });
    }
    if (!title || !description || !price || !currencyId || !currencyFormat || !availableSizes) {
      return res.status(400).send({ error: 'Missing required fields' });
    }
    if (!isValid(title) || !isValid(description) || !isValid(currencyId)) {
      return res.status(400).send({ status: false, message: "Please Provide Valid title and description or CurrenyId" });
    }

    const checkTitle = await productModel.findOne({ title });

    if (checkTitle) {
      return res.status(400).send({ status: false, message: "This title already exist, provide a new title" });
    }
    if (!isValidNumber(price)) {
      return res.status(400).send({ message: 'Price must be a positive number' });
    }

    if (currencyId !== 'INR' || currencyFormat !== '₹') {
      return res.status(400).send({ error: 'Invalid currency' });
    }

    if(!isValid(style)){
      return res.status(400).send({ status: "false", message: "Style must be string" });
    }

    if (isFreeShipping !== "true" && isFreeShipping !== "false"){
      return res.status(400).send({ status: "false", message: "isFreeShipping must be true or false" });
    }
    if(!isValidNumber(installments)){
      return res.status(400).send({ status: "false", message: "installments must be valid" });
    }

    let validSize = availableSizes.trim();
    let size = validSize.toUpperCase().split(",");
    data.availableSizes = size;

    for (let i = 0; i < size.length; i++) {
      if (!isValidSize(size[i])) {
        return res.status(400).send({
          status: false,
          message: `${size[i]} size is not available`,
        });
      }
    }

    let files = req.files
    if (files && files.length > 0) {
      let uploadFileURL = await uploadFile(files[0])
      data.productImage = uploadFileURL

    } else {
      return res.status(400).send({ status: false, message: "No file found" })
    }

    let savedProduct = await productModel.create(data);
    return res.status(201).send({ status: true, message: "Success", data: savedProduct });

  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  };
}



//================================= Get Products ================================================//

const getProducts = async function (req, res) {
  try {
    let keys = req.query;
    let filter = { isDeleted: false };
    let { size, name, priceLessThan, priceGreaterThan, priceSort } = keys;

    if (size) {
      size = size.toUpperCase().trim();
      if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size)) {
        return res.status(400).send({ status: false, message: "Size is not valid" });
      }
      filter["availableSizes"] = { $in: size };
    }

    if (name) {
      filter["title"] = { $regex: name, $options: 'i' };
    }

    if (priceLessThan) {
      if ((typeof priceLessThan !== 'string' || isNaN(Number(priceLessThan)))) {
        return res.status(400).send({ status: false, message: "Price is not valid" });
      }
      filter["price"] = { $lt: priceLessThan };
    }

    if (priceGreaterThan) {
      if ((typeof priceGreaterThan !== 'string' || isNaN(Number(priceGreaterThan)))) {
        return res
          .status(400)
          .send({ status: false, message: "Not a valid Price" });
      }
      filter["price"] = { $gt: priceGreaterThan };
    }

    if (priceSort) {
      if (!(priceSort == 1 || priceSort == -1)) {
        return res.status(400).send({ status: false, message: "Price can be sorted with the value 1 or -1 only" });
      }
    }

    let productDetails = await productModel
      .find(filter)
      .sort({ price: priceSort });

    if (productDetails.length === 0) {
      return res.status(404).send({ status: false, message: "no data found" });
    }

    return res
      .status(200)
      .send({ status: true, message: "Success", data: productDetails });
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};


//================================= Get Products By Id ================================================//



const getProductById = async function (req, res) {
  try {
    let productId = req.params.productId;

    if (!isValidObjectId(productId))
      return res.status(404).send({
        status: false,
        message: `Please Enter Valid ProductId: ${productId}.`,
      });

    let getProduct = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!getProduct)
      return res.status(404).send({
        status: false,
        message: "Product data not found , it might be deleted.",
      });

    return res
      .status(200)
      .send({ status: true, message: "Success", data: getProduct });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};



//================================= Update Product ================================================//



const updateProduct = async function (req, res) {
  try {
    let productId = req.params.productId;

    if (!isValidObjectId(productId))
      return res
        .status(404)
        .send({ status: false, message: "Product Id is invalid." });

    let getproductId = await productModel.findOne({ _id: productId });
    if (!getproductId)
      return res
        .status(404)
        .send({ status: false, message: "Product Id not found." });

    let data = req.body;

    let files = req.files;

    let {
      title,
      description,
      price,
      isFreeShipping,
      style,
      availableSizes,
      installments,
    } = data;

    if (!isValidRequestBody(data) && (!files || files.length == 0))
      return res.status(400).send({ status: false, message: "At least one field is mendatory." });

    let updatedData = {};

    if (title) {
      if (!isValid(title)) {
        return res
          .status(400)
          .send({ status: false, message: "Product title must be valid" });
      }

      let checkTitle = await productModel.findOne({ title: title });

      if (checkTitle) {
        return res.status(400).send({
          status: false,
          message:
            "This product title is already used ,please provide another product title.",
        });
      }
      updatedData.title = title;
    }
    if (description) {
      if (!isValid(description)) {
        return res.status(400).send({
          status: false,
          message: "Product description must be string.",
        });
      }
      updatedData.description = description;
    }
    if (price) {
      if (typeof price !== 'number' || price <= 0) {
        return res
          .status(400)
          .send({ status: false, message: "Product price must be positive number." });
      }
      updatedData.price = price
    }

    if (isFreeShipping) {
      if (
        !(isFreeShipping.trim() == "true" || isFreeShipping.trim() == "false")
      ) {
        return res.status(400).send({
          status: false,
          message: "isFreeShipping should either be True, or False.",
        });
      }
    }
    updatedData.isFreeShipping = isFreeShipping;
    
    if (style) {
      if (!isValid(style)) {
        return res
          .status(400)
          .send({ status: false, message: "Product style must be valid" });
      }
      updatedData.style = style;
    }
    if (availableSizes) {
      if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSizes)) {
        return res.status(400).send({
          status: false,
          message: `Product sizes must be from these["S", "XS", "M", "X", "L", "XXL", "XL"].`,
        });
      }
      availableSizes = availableSizes.trim();
      updatedData.availableSizes = availableSizes;
    }

    if (installments) {
      if (!isValidNumber(installments)) {
        return res.status(400).send({
          status: false,
          message: "Product installments must be number.",
        });
      }
      installments = installments.trim();
      updatedData.installments = installments;
    }
    updatedData.updatedAt = Date.now();

    let updatedProductData = await productModel.findOneAndUpdate(
      { _id: productId, isDeleted: false },
      updatedData,
      { new: true }
    );

    if (!updatedProductData) {
      return res.status(404).send({
        status: false,
        message: "Product is not exist either it is deleted.",
      });
    }

    return res
      .status(200)
      .send({ status: true, message: "Success", data: updatedProductData });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};



//================================= Delete Product ================================================//



const deleteProduct = async function (req, res) {
  try {
    let productId = req.params.productId;

    if (!isValidObjectId(productId)) {
      return res
        .status(404)
        .send({ status: false, message: "please provide valid productid" });
    }

    let checkProductId = await productModel.findOneAndUpdate(
      { _id: productId, isDeleted: false },
      { isDeleted: true, deletedAt: Date.now() }
    );

    if (!checkProductId) {
      return res
        .status(404)
        .send({ status: false, message: " Product already deleted." });
    }

    return res
      .status(200)
      .send({ status: true, message: "Product successsfully deleted." });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = {
  createProduct,
  getProductById,
  getProducts,
  updateProduct,
  deleteProduct,
};