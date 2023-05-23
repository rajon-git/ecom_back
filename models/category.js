const mongoose=require("mongoose");
const {Schema}=mongoose;
const categorySchema=new Schema({
    name:{
        type:String,
        trim:true,
        unique:true,
        maxLength:30,
        required:true
    },
    slug:{
        type:String,
        trim:true,
        unique:true,
        lowercase:true
    }
},{timestamps:true,versionKey:false});
const Category=mongoose.model("Category",categorySchema);
module.exports=Category;