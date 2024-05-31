import * as dotenv from 'dotenv';
import { app } from './app.js';
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";


dotenv.config({ path: './.env' });


// this connectDB fn returns a promise
connectDB()
.then(() => {

    app.on("error", () => {
        console.log("Error faced: ", error);
        throw error;
    })
    app.listen(process.env.PORT || 8000, () => {
        console.log("Server is running at port: ", process.env.PORT);
    })
})
.catch((error) => {
    console.log("MongoDB connection failed: ", error);
})














 












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