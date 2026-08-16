import mongoose ,{Schema} from "mongoose";

const userSchema = new Schema({
    username : {
        type: String ,
        required : true,
        unqiue : true,
        lowercase: true,
        trim : true,
        index : true
    },
    password:{
        type: String ,
        required : [true,'Password is required ']
    },
     email: {
        type: String ,
        required : true,
        unqiue : true,
        lowercase: true,
        trim : true,
    },
    fullname : {
        type: String ,
        required : true,
        trim : true,
        index : true
    },
    avator:{
        type: String ,
         required : true,
    },
    coverImage:{
         type: String ,
    },
    watchHistory:[{
        type : Schema.Types.ObjectId,
        ref : "Video" 
    }],
    refreshToken:{
        type : String
    }
},{timestamps: true})

export const User = mongoose.model("User" , userSchema);