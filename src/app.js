import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// set maximum size json data we can accept to 20kb
app.use(express.json({limit: "20kb"}))

// we receive data in url encoded format which express cant understand. express.urlencoded middleware helps eliminate that
app.use(express.urlencoded())
// the below middleware allows express to serve files directly from the public dir. we temprarily stored the user data in this location before passing it to cloudinary
app.use(express.static("public"))
// cookie parser is used to access and set the cookies of the user and so that we can perform crud operations on those cookies
app.use(cookieParser)

export { app }