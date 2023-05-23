const mongoose=require("mongoose");
const {Schema}=mongoose;
const Category=require("../models/category")
const productSchema=new Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        maxLength:160
    },
    slug:{
        type:String,
        lowercase:true
    },
    description:{
        type:{},
        trim:true,
        required:true,
        maxLength:2000
    },
    price:{
        type:Number,
        trim:true,
        required:true,

    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Category"
    },
    quantity:{
        type:Number
    },
    sold:{
        type:Number,
        default:0
    },
    photo:{
        data:Buffer,
        contentType:String
    },
    shipping:{
        required:false,
        type:Boolean
    }
},{timestamps:true,versionKey:false});
const Product=mongoose.model("Product",productSchema);
module.exports=Product;
