import mongoose from "mongoose";
import { configDotenv } from "dotenv";

configDotenv();


// function for connecting to database
const connectToDB = async (uri) => {
    mongoose.connect(uri)
    .then((data) => {
        console.log("✅ database connected successfully");
    })
    .catch((err) => {
        console.log("❌ Error in Database Connection");
        console.log(`❌ Error : ${err}`);
    })
}


export default connectToDB;