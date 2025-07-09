//require("dotenv").config({ path: "./env" });
import express from "express";
import { connectDB } from "./db/index.js";
import dotenv from "dotenv";
dotenv.config({ path: "./env" });
const app = express();

connectDB()
.then(()=>{
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
})
.catch(err=>console.error(err));
/*
;(async () => {
    try{
        await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
        app.on("error",()=>{
            console.error("Error",err)
            throw err
        })
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    }catch(err){
        console.error("Error",err)
        throw err
    }
})
*/