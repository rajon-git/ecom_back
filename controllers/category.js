const slugify=require("slugify");
const Category=require("../models/category");
const Product = require("../models/product");

const create = async (req, res) => {
    try {
      const { name } = req.body;
      if (!name.trim()) {
        return res.json({ error: "Name is required" });
      }
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.json({ error: "Already exists" });
      }
  
      const category = await new Category({ name, slug: slugify(name) }).save();
      res.json(category);
    } catch (err) {
      console.log(err);
      return res.status(400).json(err);
    }
  };
  const update = async (req, res) => {
    try {
      const { name } = req.body;
      console.log(req.params)
      const { categoryId } = req.params;
      const category = await Category.findByIdAndUpdate(
        categoryId,
        {
          name,
          slug: slugify(name),
        },
        { new: true }
      );
      res.json(category);
    } catch (err) {
      console.log(err);
      return res.status(400).json(err.message);
    }
  };
  //removeCategory
  const removeCategory=async(req,res)=>{
    try{
        const remove=await Category.findByIdAndRemove(req.params.categoryId);
        res.json(remove);
    }catch(error){
      console.log(error)
    }
  }
  //categoryList
  const categoryList=async(req,res)=>{
    try{
       const all=await Category.find({});
       res.json(all);
    }catch(error){
      console.log(error)
    }
  }
  //singleCategory
  const singleCategory=async(req,res)=>{
    try{
       const category=await Category.findOne({name:req.params.slug});
       res.json(category);
    }catch(error){
      return res.json(error)
    }
  }
  //productByCategory
  const productByCategory=async(req,res)=>{
    try{
      const category=await Category.findOne({slug:req.params.slug});
      const products=await Product.find({category}).populate("category");
      res.json({category,products});
    }catch(error){
      console.log(error)
    }
  }
module.exports={create,update,removeCategory,categoryList,singleCategory,productByCategory};