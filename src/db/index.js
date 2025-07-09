import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import express from "express";
const app = express();


export const connectDB = async()=>{
    try{
        const connection = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`Database connected`)
        // app.on("error",()=>{
        //     console.error("Error",err)
        //     throw err
        // })
        // app.listen(process.env.PORT, () => {
        //     console.log(`Server is running on port ${process.env.PORT}`);
        // });
    }catch(err){
        console.error("Error",err)
        process.exit(1)
    }
}

