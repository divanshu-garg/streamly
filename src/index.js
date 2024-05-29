// require(`dotenv`).config({path: './env'})
import 'dotenv/config'

import { DB_NAME } from "./constants.js";

import connectDB from "./db/index.js";

connectDB();














 












/*
import express from "express"
const app = express()

;(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", () => {
            console.log("ERRRR: ", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    }
    catch(error){
            console.log("Error, couldnt connect database: ", error);
            throw error;
    }
}) ()

*/