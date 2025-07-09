import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, // cloudinary link
        required:true,
    },
    coverImage:{
        type:String, // cloudinary link
        required:true,
    },
    watchHistory:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    }],
    likedVideos:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    }],
    dislikedVideos:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    }],
    password:{
        type:String,
        required:[true,"password is required"]
    },
    refreshToken:{
        type:String
    }
},{timestamps:true})  
userSchema.pre('save',async function(next){
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.passwword,10);
    next();
})
// pawword match
userSchema.methods.isPasswordMatched = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password)
}
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS-TOKEN-EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH-TOKEN-EXPIRY
        }
    )
}
export const User =  mongoose.model("User", userSchema) 