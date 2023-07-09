const userModel = require('../models/userModel');

const JWT = require('jsonwebtoken');
const {isValidObjectId} = require('mongoose');
const {isValid} = require('../validations/validation')

require('dotenv').config();
const { JWT_SECRET } = process.env



// ======================================= AUTHENTICATION =============================================//



const isAuthenticated = async function ( req , res , next ) {
    try {
        let token = req.headers['x-api-key']; 

        if (!token) {
            return res.status(401).send({ status: false, message: "Token must be Present." });
        }

        JWT.verify( token,JWT_SECRET, function ( err , decodedToken ) {
            if (err) {

                if (err.name === 'JsonWebTokenError') {
                    return res.status(404).send({ status: false, message: "invalid token" });
                }

                if (err.name === 'TokenExpiredError') {
                    return res.status(404).send({ status: false, message: "you are logged out, login again" });
                } else {
                    return res.send({ msg: err.message });
                }
            } else {
                req.token = decodedToken
                next()
            }
        });

    } catch (error) {
        res.status(500).send({ status: 'error', error: error.message })
    }
}



// =========================================== AUTHORISATION ===========================================//



const isAuthorized = async function ( req , res , next ) {
    try{
        let loggedUserId = req.token.userId

        if( req.originalUrl === "/user" ) {
            let userId = req.body.userId

            if( userId && typeof userId != "string" ) {
                return res.status(400).send({ status : false , message : "UserId must be in string."})
            }
            if( !userId || !userId.trim() ) {
                return res.status(400).send({ status : false , message : "User Id must be present for Authorization."})
            }
            userId = userId.trim()

            if( !isValidObjectId(userId) ) {
                return res.status(400).send({ status : false , message : "Invalid UserId."})
            }

            const userData = await userModel.findById(userId)
            if( !userData ) {
                return res.status(404).send({ status : false , message : "The user Id does not exist."})
            }

            if( loggedUserId != userId ) {
                return res.status(403).send({ status : false , message : "You are not authorized,please provide valid user id."})
            }
             req.body.userId = userId
        }else {
            
            let userId = req.params.userId;

            if ( !userId ) {
                return res.status(400).send({ status: false, message: "User id is mandatory" });
            }
            if ( !isValidObjectId(userId )) {
                return res.status(400).send({ status: false, message: "Invalid user ID" });
            }

            let checkuserId = await userModel.findById(userId);
            if ( !checkuserId ) {
                return res.status(404).send({ status: false, message: "Data Not found with this user id, Please enter a valid user id" });
            }

            let authenticatedUserId = checkuserId._id;
            
            if ( authenticatedUserId != loggedUserId ) {
                return res.status(403).send({ status: false, message: "Not authorized,please provide your own user id" });
            }
        }
        next();

    }catch( error ){
        return res.status(500).send({ status : false , message : error.message})
    }
}
module.exports = { isAuthenticated, isAuthorized };