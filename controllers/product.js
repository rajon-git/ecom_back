const Product=require("../models/product");
const slugify=require("slugify")
const fs=require("fs");
const formidable=require("express-formidable")
const braintree=require("braintree");
const Order=require("../models/order");
const sgMail=require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_KEY);


const gateway=new braintree.BraintreeGateway({
  environment:braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
})

const create = async (req, res) => {
    try {
      const { name, description, price, category, quantity, shipping } =
        req.fields;
      const { photo } = req.files;
  
      // validation
      switch (true) {
        case !name?.trim():
          return res.json({ error: "Name is required" });
        case !description?.trim():
          return res.json({ error: "Description is required" });
        case !price?.trim():
          return res.json({ error: "Price is required" });
        case !category?.trim():
          return res.json({ error: "Category is required" });
        case !quantity?.trim():
          return res.json({ error: "Quantity is required" });
        case !shipping?.trim():
          return res.json({ error: "Shipping is required" });
        case photo && photo.size > 1000000:
          return res.json({ error: "Image should be less than 1mb in size" });
      }
  
      // create product
      const product = new Product({ ...req.fields, slug: slugify(name) });
  
      if (photo) {
        product.photo.data = fs.readFileSync(photo.path);
        product.photo.contentType = photo.type;
      }
  
      await product.save();
      res.json(product);
    } catch (err) {
      console.log(err);
      return res.status(400).json(err.message);
    }
  };
//list
const list=async(req,res)=>{
    try{
        const products=await Product.find({})
        .populate("category")
        .select("-photo")
        .limit(12)
        .sort({createdAt: -1});
        res.json(products);
    }catch(error){
        console.log(error);
    }
}

//read products
const read = async (req, res) => {
    try {
      const product = await Product.findOne({ slug: req.params.slug })
        .select("-photo")
        .populate("category");
  
      res.json(product);
    } catch (err) {
      console.log(err);
    }
  };

  //remove
  const remove=async(req,res)=>{
    try{
       const product=await Product.findByIdAndDelete(req.params.productId)
       .select("-photo");
       res.json(product);
    }catch(error){
        console.log(error)
    }
  }

  //photo 
  const photo=async(req,res)=>{
    try{
    const product=await Product.findById(req.params.productId).select("photo");
    if(product.photo.data){
      res.set("Content-Type",product.photo.contentType);
      res.set("Cross-Origin-Resource-Policy", "cross-origin")
      return res.send(product.photo.data);
    }
  }catch(error){
    console.log(error);
  }
}
//update
const update = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;
  
    // option1
    // validation
    switch (true) {
      case !name?.trim():
      return  res.json({ error: "Name is required" });
      case !description?.trim():
      return  res.json({ error: "Description is required" });
      case !price?.trim():
      return  res.json({ error: "Price is required" });
      case !category?.trim():
      return  res.json({ error: "Category is required" });
      case !quantity?.trim():
      return  res.json({ error: "Quantity is required" });
      case !shipping?.trim():
      return  res.json({ error: "Shipping is required" });
      case photo && photo.size > 1000000:
      return  res.json({ error: "Image should be less than 1mb in size" });
    }
    // update product
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      {
        ...req.fields,
        slug: slugify(name),
      },
      { new: true }
    );

    if (photo) {
      product.photo.data = fs.readFileSync(photo.path);
      product.photo.contentType = photo.type;
    }

    await product.save();
    res.json(product);
  } catch (err) {
    console.log(err);
    return res.status(400).json(err.message);
  }
};

//filteredProducts
const filteredProducts=async(req,res)=>{
  try{
    const {checked,radio}=req.body;
    let args={};
    if (checked.length > 0) args.category = checked
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
    console.log("args => ", args);
    const products=await Product.find(args);
    res.json(products);

  }catch(error){
    console.log(error);
  }
}
//productsCount
const productsCount=async(req,res)=>{
  try{
    const total=await Product.find({}).estimatedDocumentCount();
    res.json(total);
  }catch(error){
    console.log(error);
  }
}//listProducts
const listProducts=async(req,res)=>{
  try{
    const perPage=2;
    const page=req.params.page ? req.params.page :1;
    const products=await Product.find({})
    .select("-photo")
    .limit(perPage)
    .sort("-createdAt")
    .skip((page-1)*perPage)
    res.json(products)
    }catch(error){
    console.log(error)
  }
}
  
//productsKeyword
const productsKeyword=async(req,res)=>{
  try{
    const {keyword}=req.params;
    const results=await Product.find({
      $or:[
        {name:{$regex:keyword, $options:"i"}},
        {description:{$regex:keyword, $options:"i"}}
      ]
    }).select("-photo");
    res.json(results);
  }catch(error){
    console.log(error);
  }
}
//related products
const relatedProducts=async (req,res)=>{
  try{
    const {productId,categoryId}=req.params;
    const related=await Product.find({
      category:categoryId,
      _id: {$ne:productId}
    })
        .select("-photo")
        .populate("category")
        .limit(3);
    res.json(related);
  }catch (error){
    console.log(error)
  }
}
const getToken=async (req,res)=>{
  try{
    gateway.clientToken.generate({},function(error,response){
      if(error){
        res.status(500).send(error);
      }else{
        res.send(response)
      }
    })
  }catch(error){
    console.log(error)
  }
}

const processPayment=async (req,res)=>{
  try{
    const {nonce,cart}=req.body;

    let total=0;
    cart.map((i)=>{
      total+=i.price;
    });

    let newTransaction=gateway.transaction.sale(
      {
        amount:total,
        paymentMethodNonce:nonce,
        options:{
          submitForSettlement:true
        },
      },
      function(error,result){
        if(result){
          const order=new Order({
            products:cart,
            payment:result,
            buyer:req.user._id
          }).save();
            // decrement quantity
            decrementQuantity(cart);
            // const bulkOps = cart.map((item) => {
            //   return {
            //     updateOne: {
            //       filter: { _id: item._id },
            //       update: { $inc: { quantity: -0, sold: +1 } },
            //     },
            //   };
            // });
  
            // Product.bulkWrite(bulkOps, {});
            res.json({ok:true});
        }else{
          res.status(500).send(error)

        }
      }
    );
  }catch(error){
    console.log(error)
  }
};

const decrementQuantity=async(req,res)=>{
  try{
    const bulkOps=cart.map((item)=>{
      return{
        updateOne:{
          filter:{_id:item._id},
          update:{$inc:{quantity:-0,sold:+1}},
        },
      };
    });
    const updated=await Product.bulkWrite(bulkOps,{});
    console.log("bulk updated",updated)
  }catch(error){
    console.log(error);
  }
};

const orderStatus=async(req,res)=>{
  try{
    const {orderId}=req.params;
    const {status}=req.body;
    const order=await Order.findByIdAndUpdate(
      orderId,
      {status},
      {new:true}
    ).populate("buyer","email name");
    //send email 
    //prepare email

    const emailData={
      from:process.env.EMAIL_FROM,
      to:order.buyer.email,
      subject:"Oder Status",
      html:`
      <h1> Hi ${order.buyer.name}, your order status is: <span style="color:red;">${order.status}?</span></h1>
      <p>Visit <a href="${process.env.CLIENT_URL}/dashboard/user/orders">your dashboard<a> for more details</p>`
    };
    try{
      await sgMail.send(emnailData);
    }catch(error){
      console.log(error)
    }
    res.json(order)

  }catch(error){
    console.log(error);
  }
}
module.exports= {create,list,read,remove,photo,update,filteredProducts,productsCount,
  listProducts,productsKeyword,relatedProducts,getToken,processPayment,orderStatus}