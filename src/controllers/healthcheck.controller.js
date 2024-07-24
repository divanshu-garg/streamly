import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const healthcheck = asyncHandler(async(_, res) => {
    
    try {
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "health check successful, system is running"))
    } catch (error) {
        throw new ApiError(500, "health check unsuccessful", error?.message)
    }
})

export {
    healthcheck
}