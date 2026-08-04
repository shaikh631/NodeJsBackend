import mongoose from "mongoose";

const CategorySchema = mongoose.Schema({
    name : {
        type : String, 
        required : true
    }
} ,{timestamps: true});

export const Category = mongoose.model("Category" , CategorySchema);