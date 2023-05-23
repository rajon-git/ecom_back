const mongoose=require("mongoose");
const {Schema}=mongoose;
const userSchema=new Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    password:{
        type:String,
        required:true,
        trim:true,
        minLength:8,
        maxLength:64
    },
    address:{
        type:String,
        trim:true
    },
    role:{
        type:Number,
        default:0
    }
},{timestamps:true,versionKey:false});
const User=mongoose.model("User",userSchema);
module.exports=User;