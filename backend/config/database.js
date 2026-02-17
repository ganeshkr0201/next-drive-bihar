import mongoose from "mongoose";
import dotenv from 'dotenv';

const env = process.env.NODE_ENV || "development";

if(env === "production") {
    dotenv.config();
}
else {
    dotenv.config({
        path: `.env.${env}`
    })
}

// function for connecting to database
const connectToDB = async (uri) => {
    mongoose.connect(uri)
    .then(() => {
        console.log("✅ database connected successfully");
    })
    .catch((err) => {
        console.log("❌ Error in Database Connection");
        console.log(`❌ Error : ${err}`);
    })
}


export default connectToDB;