import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiErorr} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";


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

const generateAccessAndRefreshTokens = async(userId)=>{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken, refreshToken}
    }catch{
        throw new ApiErorr("Token generation failed", 500)
    }
}

const loginUser = asyncHandler(async (req, res)=>{
    //req body -> data
    // username or email
    // find user
    // password check
    // access and refresh token
    // send cookie


    const {email,username,password} = req.body
    if(!email && !username){
        throw new ApiErorr("Email or username is required", 400)
    }
    const user = await User.findOne({
        $or: [{email}, {username}] // or is operator used in mongodb
    })
    if(!user){
        throw new ApiErorr("User not found", 404)
    }
    const isPasswordMatched = await user.isPasswordMatched(password)
    if(!isPasswordMatched){
        throw new ApiErorr("Password is incorrect", 400)
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
        200,
        {
            user: loggedInUser,
            accessToken,
            refreshToken
        },
        "User logged in successfully"
     ))    
})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id, 
        {
            $set:{
                refreshToken:undefined
            }
        }, 
        {
            new: true
        })
        const options = {
        httpOnly: true,
        secure: true,
    }
        return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(
            "User logged out successfully",
            200,
            {},
        ))
})

const refreshAccessToken = asyncHandler(async (req, res)=>{
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiErorr("Unauthorized request", 401)
    }
    try {
        const decoded = jwt.verify(
            incomingRefreshToken, 
            process.env.JWT_SECRET
        )
        const user = await User.findById(decoded?._id).select("-password -refreshToken")
        if(!user){
            throw new ApiErorr("Unauthorized request", 401)
        }
        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiErorr("Unauthorized request", 401)
        }
        const options = {
            httpOnly: true,
            secure: true,
        }
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(new ApiResponse(
            200,
            {
                accessToken,
                refreshToken
            },
            "User refreshed in successfully"
         ))
    } catch (error) {
        throw new ApiErorr("Unauthorized request", 401)
    }
})

const changeUserPasword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user._id)
    const isPasswordMatched = await user.isPasswordMatched(oldPassword)
    if(!isPasswordMatched){
        throw new ApiErorr("Old password is incorrect", 400)
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Password changed successfully"
    ))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullname, email} = req.body
    if(!fullname || !email){
        throw new ApiErorr("All fields are required", 400)
    }
    const user = await User.findById(
        req?.user._id,
        {
            $set: {
                fullname,
                email:email
            }
        },
        {
            new: true //also give updated object
        }
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Account details updated successfully"
    ))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.avatar[0]?.path
    if(!avatarLocalPath){
        throw new ApiErorr("Avatar is required", 400)
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiErorr("Avatar update failed", 500)
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar updated successfully"
        )
    )
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.coverImage[0]?.path
    if(!coverImageLocalPath){
        throw new ApiErorr("Cover image is required", 400)
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiErorr("Cover image update failed", 500)
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Cover image updated successfully"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeUserPasword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}