import express from 'express'
import{registerUser,loginUser, userCredits, razorpaycash,verifyRazorpay} from '../controllers/userController.js';
import userAuth from '../middlewares/auth.js'

const userRouter= express.Router()

userRouter.post('/register',registerUser)
userRouter.post('/login',loginUser)
userRouter.get('/credits',userAuth,userCredits)
userRouter.post('/razorpay',userAuth,razorpaycash)
userRouter.post('/verifypay',userAuth,verifyRazorpay)

export default userRouter;