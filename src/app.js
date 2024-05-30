import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "20kb"}))
app.use(express.urlencoded())
app.use(express.static("public"))
app.use(cookieParser)
// cookie parser is used to access and set the cookies of the user and so that we can perform crud operations on those cookies

export { app }