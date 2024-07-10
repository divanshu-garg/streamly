import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import commentRouter from "./routes/comment.routes.js";

const app = express()

// try catch
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))


app.use(express.json({limit: "20kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())



// routes declaration
app.use("/api/v1/users", userRouter)
// http://localhost:8000/api/v1/users/register

app.use("/api/v1/hc", healthcheckRouter)
app.use("/api/v1/comments", commentRouter)

export { app }