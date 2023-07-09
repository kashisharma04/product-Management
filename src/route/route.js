const router = require('express').Router();

//User API 
const {createUser, signIn, updateUserData,getUser } = require('../controller/userControl');
const { isAuthenticated, isAuthorized} = require('../middleware/middleware');
const {createProduct, getProductById , updateProduct, deleteProduct} = require('../controller/productControl')
const {createCart,getCart,updateCart,deleteCart} = require('../controller/cartControl')
const { createOrder, updateOrder } = require('../controller/orderControl')

//route for User
router.post("/register", createUser);
router.post("/login", signIn);
router.put('/user/:userId/profile' , isAuthenticated, isAuthorized,updateUserData);
router.get('/user/:userId/profile', isAuthenticated, isAuthorized, getUser)

// router for Product
router.post("/products", createProduct)
router.get("/products/:productId",getProductById)
router.put("/products/:productId", updateProduct)
router.delete("/products/:productId", deleteProduct)


//route for Cart 
router.post( "/users/:userId/cart" , isAuthenticated , isAuthorized , createCart );
router.get( "/users/:userId/cart" , isAuthenticated , isAuthorized , getCart );
router.put( "/users/:userId/cart" , isAuthenticated , isAuthorized , updateCart );
router.delete( "/users/:userId/cart" , isAuthenticated , isAuthorized , deleteCart );

//route for Order
router.post( "/users/:userId/orders", isAuthenticated , isAuthorized , createOrder );
router.put( "/users/:userId/orders" , isAuthenticated , isAuthorized , updateOrder );


//ALL
router.all('/*', (req , res) => {
    res.status(400).send({ status: false, message: " path invalid" });
});

module.exports = router;