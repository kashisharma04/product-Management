import express from 'express'
import mongoose from 'mongoose'

const app = express.Router()
require('dotenv').config();
import {PORT, MONGODB_CONNECT} from 'process.env'

app.use(express.json());

mongoose.set('strictQuery' , true);
mongoose.connect(
    MONGODB_CONNECT, {useNewURLParser : true}
)
.then(()=>{
    console.log("Database Connected")
})
.catch((error)=>{
    console.log("Error in connection", error)
})

app.use('/',route)
app.listen(PORT, ()=>{
    console.log(`Server Connected at ${PORT}`)
})

