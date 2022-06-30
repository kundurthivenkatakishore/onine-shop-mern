const express=require("express");
const app=express();
const mongoose=require("mongoose");
const dotenv=require("dotenv");
const userRoute=require("./routes/user");
const authRoute=require("./routes/auth");
const productRoute=require("./routes/product");
const cartRoute=require("./routes/cart");
const orderRoute=require("./routes/order");
const cors=require("cors");
const {JWT_SEC,PASS_SEC,MONGO_URL,STRIPE_KEY}=require("./config/keys")
const {
    verifyToken,
    verifyTokenAndAuthorization,
    verifyTokenAndAdmin,
  } =require("./verifyToken")

const KEY = JWT_SEC
const stripe = require("stripe")(KEY);
dotenv.config();

mongoose.connect(MONGO_URL)
.then(()=>console.log("DBConnection is Successful"))
.catch((err)=>{
    console.log(err);
})

app.use(cors());
app.use(express.json());
app.post("/register", async (req, res) => {
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: CryptoJS.AES.encrypt(
        req.body.password,
        PASS_SEC
      ).toString(),
    });
  
    try {
      const savedUser = await newUser.save();
      res.status(201).json(savedUser);
    } catch (err) {
      res.status(500).json(err);
    }
  });

  app.post("/login",async(req,res)=>{
    try{
        const user=await User.findOne({username:req.body.username});
        !user && res.status(401).json("Wrong Credentials!");

        const hashedPassword=CryptoJS.AES.decrypt(user.password,PASS_SEC);

        const OriginalPassword=hashedPassword.toString(CryptoJS.enc.Utf8);
        
        OriginalPassword!==req.body.password && res.status(401).json("Wrong Credentials!");

        const accessToken=jwt.sign(
            {
                id:user._id,
                isAdmin:user.isAdmin,
            },
            JWT_SEC,
            {expiresIn:"3d"}
        )

        const {password, ...others}=user._doc;

        res.status(200).json({...others,accessToken});

    }catch(err){
        res.status(500).json(err);
    }
})
app.post("/", verifyToken, async (req, res) => {
    const newOrder = new Order(req.body);
  
    try {
      const savedOrder = await newOrder.save();
      res.status(200).json(savedOrder);
    } catch (err) {
      res.status(500).json(err);
    }
  });
  
  //UPDATE
  app.put("/:id", verifyTokenAndAdmin, async (req, res) => {
    try {
      const updatedOrder = await Order.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        { new: true }
      );
      res.status(200).json(updatedOrder);
    } catch (err) {
      res.status(500).json(err);
    }
  });
  
  //DELETE
  app.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
    try {
      await Order.findByIdAndDelete(req.params.id);
      res.status(200).json("Order has been deleted...");
    } catch (err) {
      res.status(500).json(err);
    }
  });
  
  //GET USER ORDERS
  app.get("/find/:userId", verifyTokenAndAuthorization, async (req, res) => {
    try {
      const orders = await Order.find({ userId: req.params.userId });
      res.status(200).json(orders);
    } catch (err) {
      res.status(500).json(err);
    }
  });
  
  // //GET ALL
  
  app.get("/", verifyTokenAndAdmin, async (req, res) => {
    try {
      const orders = await Order.find();
      res.status(200).json(orders);
    } catch (err) {
      res.status(500).json(err);
    }
  });
  
  // GET MONTHLY INCOME
  
  app.get("/income", verifyTokenAndAdmin, async (req, res) => {
    const productId=req.query.pid;
    const date = new Date();
    const lastMonth = new Date(date.setMonth(date.getMonth() - 1));
    const previousMonth = new Date(new Date().setMonth(lastMonth.getMonth() - 1));
  
    try {
      const income = await Order.aggregate([
        { $match: { createdAt: { $gte: previousMonth },
          ...(productId && {products:{$elemMatch:{productId}}
          }) 
        } 
      },
        {
          $project: {
            month: { $month: "$createdAt" },
            sales: "$amount",
          },
        },
        {
          $group: {
            _id: "$month",
            total: { $sum: "$sales" },
          },
        },
      ]);
      res.status(200).json(income);
    } catch (err) {
      res.status(500).json(err);
    }
  });

  app.post("/",verifyTokenAndAdmin, async(req,res)=>{
    const newProduct=new Product(req.body);
    try{
        const savedProduct=await newProduct.save();
        res.status(200).json(savedProduct);
    }catch(err){
        res.status(500).json(err);
    }
})

//UPDATE
app.put("/:id",verifyTokenAndAdmin,async(req,res)=>{
    try{
        const updatedProduct=await Product.findByIdAndUpdate(
            req.params.id,
            {
                $set:req.body,
            },
            {new :true}
        );
        res.status(200).json(updatedProduct);
    }catch(err){
        res.status(500).json(err)
    }
})

//DELETE
app.delete("/:id",verifyTokenAndAdmin,async(req,res)=>{
    try{
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json("Product has been deleted...")
    }catch(err){
        res.status(500).json(err);
    }
})

//GET PRODUCT
app.get("/find/:id",async (req,res)=>{
    try{
        const product=await Product.findById(req.params.id);
        res.status(200).json(product);
    }catch(err){
        res.status(500).json(err);
    }
})

//GET ALL PRODUCTS
app.get("/",async(req,res)=>{
    const qNew=req.query.new;
    const qCategory=req.query.category;
    try{
        let products;
        if(qNew){
            products=await Product.find().sort({createdAt:-1}).limit(5);
        }else if(qCategory){
            products=await Product.find({
                categories:{
                    $in:[qCategory],
                },
            });
        }else{
            products=await Product.find();
        }
        res.status(200).json(products)
    }catch(err){

    }
})
app.post("/", verifyToken, async (req, res) => {
    const newCart = new Cart(req.body);
  
    try {
      const savedCart = await newCart.save();
      res.status(200).json(savedCart);
    } catch (err) {
      res.status(500).json(err);
    }
  });
  
  //UPDATE
  app.put("/:id", verifyTokenAndAuthorization, async (req, res) => {
    try {
      const updatedCart = await Cart.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        { new: true }
      );
      res.status(200).json(updatedCart);
    } catch (err) {
      res.status(500).json(err);
    }
  });
  
  //DELETE
  app.delete("/:id", verifyTokenAndAuthorization, async (req, res) => {
    try {
      await Cart.findByIdAndDelete(req.params.id);
      res.status(200).json("Cart has been deleted...");
    } catch (err) {
      res.status(500).json(err);
    }
  });
  
  //GET USER CART
  app.get("/find/:userId", verifyTokenAndAuthorization, async (req, res) => {
    try {
      const cart = await Cart.findOne({ userId: req.params.userId });
      res.status(200).json(cart);
    } catch (err) {
      res.status(500).json(err);
    }
  });
  
  // //GET ALL
  
  app.get("/", verifyTokenAndAdmin, async (req, res) => {
    try {
      const carts = await Cart.find();
      res.status(200).json(carts);
    } catch (err) {
      res.status(500).json(err);
    }
  });
  
if(process.env.NODE_ENV=='production'){
    const path=require('path')

    app.get('/',(req,res)=>{
        app.use(express.static(path.resolve(__dirname,'client','build')))
        res.sendFile(path.resolve(__resolve(__dirname,'client','build','index.html')))
    })
}


app.post("/payment",(req,res)=>{
    stripe.charges.create(
        {
            source:req.body.tokenId,
            amount:req.body.amount,
            currency:"usd"
        },
        (stripeErr,stripeRes)=>{
            if(stripeErr){
                res.status(500).json(stripeErr);
            }else{
                res.status(200).json(stripeRes);
            }
        }
    )
})


app.listen(process.env.PORT || 5000,()=>{
    console.log("Backend Server is Running");
})