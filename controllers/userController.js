import User from "../models/userModel.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Razorpay from 'razorpay'
import TransModel from '../models/transactionModel.js'



/////////register/////
const registerUser = async(req,res) =>{
    try {
        const{name,email,password}=req.body;

        if(!name || !email || !password){
           return res.json({success:false,message: 'Missing Details'})
        }

        const hashedpassword= await bcrypt.hash(password,10);

        const userData ={
            name,
            email,
            password:hashedpassword
        }
        const newUser= new User(userData)

        const user=await newUser.save()
      
        const token = jwt.sign({id: user._id},process.env.JWT_SECRET)

        res.json({success:true,token,user:{name:user.name}})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


///////Login/////////
const loginUser= async(req,res)=>{
    try {
        const{email,password}=req.body;

        const user= await User.findOne({email})

        if(!user){
          return res.json({success:false,message: 'user nor found'})
        }

        const isMatch= await bcrypt.compare(password,user.password)

        if(isMatch){

            const token = jwt.sign({id: user._id},process.env.JWT_SECRET)

            res.json({success:true,token,user:{name:user.name}})

        }else{
            return res.json({success:false,message: 'Invalid Details'})
        }

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


////////credit balance/////////
const userCredits = async (req,res) =>{
  try {
     const userId=req.userId;
     const user = await User.findById(userId)

     res.json({success:true,credits:user.creditbalance,user:{name:user.name}})
  } catch (error) {
    console.log(error)
        res.json({success:false,message:error.message})
  }
}



//////Razorpay/////


const razorpayInstance = new Razorpay ({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_KEY_SECRET
    
});


const razorpaycash = async (req,res)=>{
       
    try {

        const userId = req.userId;
        const { planId } = req.body;

        const userData=await User.findById(userId)

        if(!userData || !planId){
            return res.json({success:false,message:"Missing details"})
        }
        
        let credits, plan, amount, date

        switch(planId){
            case 'Basic':
                plan='Basic'
                credits=100
                amount=100
              break;

              case 'Pro':
                plan='Pro'
                credits=500
                amount=200
              break;

              case 'Premium':
                plan='Premium'
                credits=1500
                amount=300
              break;


            default:
                return res.json({success:false,message:"plan not found"})
                break;

        }
        date=Date.now();
        const transactionData ={
            userId,plan,amount,date,credits
        }

        

        const newTransacton = await TransModel.create(transactionData)

        const options={
            amount:amount,
            currency:process.env.CURRENCY,
            receipt:newTransacton._id

        }

        await razorpayInstance.orders.create(options,(error,order)=>{
            
         if(error){
            console.log(error);
            return res.json({succes:false,message:error})
         }
         res.json({success:true,order})
        })

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


const verifyRazorpay= async (req,res)=>{
    try {
        const{razorpay_order_id}=req.body;
        const orderInfo= await razorpayInstance.orders.fetch(razorpay_order_id)
        if(orderInfo.status==='paid'){
         const transactionData = await TransModel.findById(orderInfo.receipt)

         if(transactionData.payment){
            return res.json({success:false,message:'payment failed'})
         }
         const userData = await User.findById(transactionData.userId)

         const creditbalance=userData.creditbalance+transactionData.credits
         await User.findByIdAndUpdate(userData._id,{creditbalance})

         await TransModel.findByIdAndUpdate(transactionData._id,{payment:true}) 
         res.json({success:true,message:"credits added"})
        }
        else{
            res.json({succes:false,message:"paymet failed"})
        }
    } 
     catch (error) {
    console.log(error);
    res.json({success: false,message: error.message});
}
    
}



export {registerUser,loginUser,userCredits,razorpaycash,verifyRazorpay}