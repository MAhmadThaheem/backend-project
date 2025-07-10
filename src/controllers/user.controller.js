import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiErorr} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
const registerUser = asyncHandler(async (req, res)=>{
    // get user details from frontend
    // validation
    // check user already exist
    // check for images, check for avatar
    //  upload to cloudinary, CHECK avatar
    // create usr object - create entry in db
    // remove password from response and refresh token
    // check for user creation
    // send response

    const {username, email, fullname, password} = req.body
    console.log(username, email, fullname, password);
    
    if([username, email, fullname, password].some((field)=>field.trim()==="")){
        throw new ApiErorr("All fields are required", 400)
    }
    const existedUser = await User.findOne({
        $or: [{email}, {username}]
    })
    if(existedUser){
        throw new ApiErorr("User already exist", 409)
    }
    const avatarLocalPath = req.files?.avatar[0]?.path
    //const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if(req.filex && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if(!avatarLocalPath){
        throw new ApiErorr("Avatar is required", 400)
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new ApiErorr("Avatar upload failed", 400)
    }
    const user = await User.create({
        username:username.toLowerCase(),
        email,
        fullname,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser){
        throw new ApiErorr("User not created", 500)
    }
    res.status(201).json(new ApiResponse(
        200,
        createdUser,
    "User created successfully"
    ))
})
export {registerUser}