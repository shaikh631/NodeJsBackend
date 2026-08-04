import mongoose from "mongoose";
import { DB_Name } from "../constants.js";


const ConnectDB = async (params) => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`);
        console.log(`\n MongoDB Connected || Host : ${connectionInstance.connection.host}`)
        
    } catch (error) {
        console.log("MonogoDB connection Error ::" , error);
        process.exit(1)
        
    }
}

export default ConnectDB;