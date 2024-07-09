import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";


const healthcheck = asyncHandler(async(_, res) => {
    
    try {
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "health check successful, system is running"))
    } catch (error) {
        return new ApiError(500, "health check unsuccessful", error?.message)
    }
})

export {
    healthcheck
}