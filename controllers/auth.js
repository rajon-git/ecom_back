const User=require("../models/user");
const jwt=require("jsonwebtoken");
const {hashPassword,comparePassword}=require("../helpers/auth");

//register
const register=async (req,res)=>{
    try{
        const {name,email,password,address}=req.body;
        if(!name.trim()){
            return res.json({error:"Name is required"});
        }
        if(!email){
            return res.json({error:"Email is required"});
        }
        if(!password ||password.length<8){
            return res.json({error:"Password must be more than 8 character"});
        }
        //Check if email is taken
        const existingUser=await User.findOne({email});
        if(existingUser){
            return res.json({error:"Email is taken"})
        }

        //hash password
        const hashedPassword=await hashPassword(password);
        //save user
        const user=await new User({
            name,
            email,
            password:hashedPassword,
            address
        }).save();

        //create signed token
        const token=jwt.sign({_id:user._id},process.env.JWT_SECRET,{expiresIn:"7d"});
        //send response
        res.json({
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                address:user.address
            },
            token
        });
    }catch (error){
        console.log(error);
    }
}
const login=async (req,res)=>{
    try {
        //destructured data from user
        const {email, password} = req.body;
        //varified aall fill
        if(!email){
            return res.json({error:"Email is required"});
        }
        if(!password){
            return res.json({error:"Password is required"});
        }
        //check email is taken
        const user=await User.findOne({email});
        if(!user){
            return res.json({error:"User not found"});
        }
        //match password
        const match= await comparePassword(password,user.password);
        if(!match){
            return res.json({error:"Invalid email or password"});
        }

        //create signed token for user
        const token=jwt.sign({_id:user._id},process.env.JWT_SECRET,{expiresIn:"7d"});
        res.json({
            user:{
                name:user.name,
                email:user.email,
                role:user.role,
                address: user.address
            },
            token
        });
    }catch(error){
        console.log(error);
    }
}

//update profile
const update=async(req,res)=>{
    try{
    const {name,password,address}=req.body;
    const user=await User.findById(req.user._id);
    if(password && password.length<8){
        return res.json({error:"Password must be more than 8 character"});
    }
    //hash password with ternary operator
    const hashedPassword=password ? await  hashPassword(password) :undefined;
    const updated=await User.findByIdAndUpdate(
        req.user._id,
        {
            name:name ||user.name,
            password:hashedPassword ||user.password,
            address:address ||user.address
        },
        {
            new:true
        }
    );
    updated.password=undefined;
    res.json(updated);
    }catch(error){
        console.log(error);
    }
}
module.exports= {register,login,update}