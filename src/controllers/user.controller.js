import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import {ApiError} from "../utils/ApiError.js";

const registerUser = asyncHandler(async (req, res)=>{
    res.status(200).json({message:"ok"})
})
export {registerUser}