const express=require("express");
const router=express.Router();

const {register,login,update}=require("../controllers/auth");
const {isAdmin,requireSignin}=require("../middlewares/auth");

router.post("/register",register);
router.post("/login",login);
router.get("/auth-check",requireSignin,(req,res)=>{
    res.json({ok:true});
});
router.get("/admin-check",requireSignin,isAdmin,(req,res)=>{
    res.json({ok:true});
});
router.patch("/update",requireSignin,update);
module.exports=router;