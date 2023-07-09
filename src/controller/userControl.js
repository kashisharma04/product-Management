const express = require('express')
const { isValidRequestBody, isValidEmail, isValidMobile, isValidPassword, isValid } = require('../validations/validation')
const userModel = require('../models/userModel')
const {uploadFiles} = require('../aws/aws')
const { isValidObjectId } = require('mongoose');

const JWT = require('jsonwebtoken')

require('dotenv').config();
const { JWT_SECRET, JWT_EXPIRY } = process.env

const bcrypt = require('bcrypt')
const createUser = async function (req, res) {
    try {
        const file = req.files;
        
        let { fname, lname, phone, email, address, password  } = req.body;
       
        let { shipping, billing } = address;


        if (!isValidMobile(phone)) {
            return res.status(400).send({ status: false, message: "Enter a valid format number" });
        }

        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Enter a valid email" });
        }

        const unique = await userModel.findOne({
            $or: [{ phone: phone }, { email: email }]
        });

        if (unique) {
            return res.status(400).send({ status: false, message: "Email Or Phone Number already exits" });
        }

        if (!isValidPassword(password)) {
            return res.status(400).send({ status: false, message: "Password Must be 8-15 length,consist of mixed character and special character" });
        }


        if (!address.shipping && !address.billing) {
            return res.status(400).json({ status: false, message: 'Please enter an address' });
        }
        if (!address.shipping.street && !address.billing.street) {
            return res.status(400).json({ status: false, message: 'Please enter a street address' });
        }
        if (!address.shipping.city && !address.billing.city) {
            return res.status(400).json({ status: false, message: 'Please enter a city' });
        }
        if (!address.shipping.pincode && !address.billing.pincode) {
            return res.status(400).json({ status: false, message: 'Please enter a pincode' });
        }
        if (file && file.length > 0) {
            var imgUrl = await uploadFiles(file[0])
        } else {
            return res.status(400).send({ status: false, message: "please insert image" })
        }

         const salt = 10
        const pass = await bcrypt.hash(password, salt);
        
        const user = await userModel.create({ fname, lname, email, phone, password: pass, profileImage: imgUrl, address: { shipping, billing } })

        return res.status(200).json({ status: true, message: 'Success', data: user });

    }
        catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message });
    }
}
module.exports.createUser=createUser;
//==================================== Login User ============================================//


const signIn = async (req, res) => {
    try {
      let data = req.body
      //console.log(data)
      
    //   if (!isValidRequestBody(data)) {
    //     return res.status(400).send({ status: false, message: "Please input user Details" });
    //   }
  
      let { email, password } = data;
  
      if (!isValid(email) || !isValid(password)) {
        return res.status(400).send({ status: false, message: "EmailId is mandatory" });
      }
  
      if (!isValidEmail(email)) {
        return res.status(400).send({ status: false, message: "EmailId should be Valid" });
      }
  
      const userData = await userModel.findOne({ email: email});
        if (!userData) {
            return res.status(401).send({ status: false, message: "No such user exist. Please Enter a valid Email and Password." });
            }
  
      let hash = userData.password;
  
      let isCorrect = bcrypt.compare(password, hash);
      if (!isCorrect)
        return res.status(400).send({ status: false, message: "Password is incorrect" });
        const token = JWT.sign({userId: userData._id.toString()}, JWT_SECRET,{
          expiresIn : JWT_EXPIRY
      })
  
      res.setHeader("x-api-key", token);
      return res.status(200).send({status: true,message: "User login successfull", data: {token}});
    } catch (error) {
      return res.status(500).send({ status: false, message: error.message });
    }
  };
  
  
  //======================================== Get User ==========================================//
  
  
  const getUser = async (req, res) =>{
    try {
      let userId = req.params.userId;
  
      if (!isValidObjectId(userId))
        return res.status(400).send({ status: false, message: "User is invalid" });
  
      let getData = await userModel.findOne({ _id: userId });
  
      if (!getData)
        return res.status(404).send({ status: false, message: "user not found" });
        
      return res.status(200).send({ status: true, message: "User profile details", data: getData });
    } catch (error) {
      return res.status(500).send({ status: false, message: error.message });
    }
  };
  module.exports.getUser=getUser;
  
  //======================================== Update User ==========================================//
  
  const updateUserData = async (req, res) => {
    try {
      let userId = req.params.userId;
  
      if (!isValidObjectId(userId))
        return res.status(400).send({ status: false, message: "User Id is invalid." });
  
      let checkUser = await userModel.findOne({ _id: userId });
      if (!checkUser)
        return res.status(404).send({ status: false, message: "User Id not found." });
  
      let data = req.body;
      let files = req.files;
  
      if (!isValidRequestBody(data))
        return res.status(400).send({ status: false, message: "At least one field is mendatory." });
  
      let { fname, lname, email, phone, password, address } = data;
  
      let updatedData = {};
  
      if (fname) {
        if (!isValid(fname)) {
          return res.status(400).send({ status: false, message: "First name must be string." });
        }
        updatedData.fname = fname;
      }
  
      if (lname) {
        if (!isValid(lname)) {
          return res.status(400).send({ status: false, message: "Last name must be string." });
        }
        updatedData.lname = lname;
      }
  
      if (email) {
        if (!isValidEmail(email) || isValid(email)) {
          return res.status(400).send({ status: false, message: "Email id must be proper syntax." });
        }
  
        let checkEmailId = await userModel.findOne({ email: email });
  
        if (checkEmailId) {
          return res.status(400).send({status: false,message:"This Email id is already used ,Please provide another Email Id."});
        }
        updatedData.email = email;
      }
      if (phone) {
        if (!isValidMobile(phone)) {
          return res.status(400).send({status: false,message: "Mobile number must be Indian format."});
        }
        let checkphone = await userModel.findOne({ phone: phone });
        if (checkphone) {
          return res.status(400).send({status: false,message:"This phone number is already used ,Please provide another phone number."});
        }
        phone = phone.trim();
        updatedData.phone = phone;
      }
      if (password) {
        if (!isValidPassword(password) || !isValid(password)) {
          return res.status(400).send({ status: false, messsage: "Please provide valid password." });
        }
        let hashing = bcrypt.hashSync("password", 8);
        updatedData.password = hashing;
      }
      if (address) {
        address = JSON.parse(data.address);
  
        if (typeof address != "object") {
          return res.status(400).send({ status: false, message: "Address must be Object." });
        }
  
        let { shipping, billing } = address;
        if (shipping) {
          if (typeof shipping != "object") {
            return res.status(400).send({ status: false, message: "Shipping  must be Object." });
          }
  
          let { street, city, pincode } = shipping;
          if (street) {
            if (!isValid(street)) {
              return res.status(400).send({ status: false, message: "Street  can not be empty." });
            }
          }
          if (city) {
            if (!isValid(city)) {
              return res.status(400).send({ status: false, message: "Please enter valid city." });
            }
          }
          if (pincode) {
            if (!isValidPincode(pincode)) {
              return res.status(400).send({status: false,message: "Pincode must be in numbers only."});
            }
          }
        }
        if (billing) {
          if (typeof billing != "object") {
            return res.status(400).send({ status: false, message: "Billing  must be Otring." });
          }
  
          let { street, city, pincode } = billing;
          if (street) {
            if (!isValid(street)) {
              return res.status(400).send({ status: false, message: "Street  can not be empty." });
            }
          }
          if (city) {
            if (!isValidPlace(city)) {
              return res.status(400).send({ status: false, message: "Please enter valid city." });
            }
          }
          if (pincode) {
            if (!isValidPincode(pincode)) {
              return res.status(400).send({status: false,message: "Pincode must be in numbers only."});
            }
          }
        }
        updatedData.address = address;
      }
  
      if (files && files.length > 0) {
        let uploadFileURL = await uploadFiles(files[0]);
  
        updatedData.profileImage = uploadFileURL;
      }
  
      let updateUser = await userModel.findOneAndUpdate(
        { _id: userId },
        updatedData,
        { new: true }
      );
  
      return res.status(200).send({status: true,message: "User profile updated",data: updateUser});
    } catch (error) {
      return res.status(500).send({ status: false, message: error.message });
    }
  };
  
  
module.exports.signIn=signIn
module.exports.updateUserData=updateUserData