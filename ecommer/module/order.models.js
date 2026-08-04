import { request } from "express";
import mongoose from "mongoose";

const OrderItemSchema = mongoose.Schema({
    prroductId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Product"
    },
    quantity : {
        type : Number,
        required : true,
        default : 1 
    }
})

const ordeSchema = mongoose.Schema({
    OrderPrice : {
        type : Number , 
        required : true,
    },
    Customer :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    orderItem :{
        type : [OrderItemSchema]
    },
    addresss:{
        type : String,
        required : true
    } , 
    status:{
        type : String , 
        enum : ['Pending' , "Cancelled" , 'Completed']
    }
} , {timestamps: true});

export const Order = mongoose.model("Order" , ordeSchema);