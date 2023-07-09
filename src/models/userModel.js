const mongoose = require('mongoose')
const userSchema = mongoose.Schema({ 
        fname: {
            type : String, 
            require : true
        },
        lname:{
            type : String, 
            require : true
        },
        email: {
            type : String, 
            unique : true,
            require : true
        },
        profileImage: {
            type : String,    // s3 link
            require : true
        }, 
        phone: {
            type : String,   
            unique : true,
            require : true
        },   
        password: {
            type : String,   
            unique : true,
            require : true,
            // minlength : 8,
            // maxlength : 15      // encrypted password
        },  
        address: {
          shipping: {
            street: {
                type : String,
                require : true
                },
            city: {
                type : String,
                require : true
                },
            pincode: {
                type : Number, 
                require : true
            }
          },
          billing: {
            street: {
                type : String,
                require : true},
            city: {
                type : String, 
                require : true },
            pincode: {type: Number, require : true }
          }
        },
    }, {timestamps : true
})

module.exports = mongoose.model('User' , userSchema);