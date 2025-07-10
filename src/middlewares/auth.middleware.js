import { ApiErorr } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") || req.header("Authorization")?.replace("Bearer ","");
        if(!token){
            throw new ApiErorr("Unauthorized request", 401)
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(decoded?._id).select("-password -refreshToken")
        if(!user){
            throw new ApiErorr("Unauthorized request", 401)
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiErorr("Unauthorized request", 401)
        
    }
})