import express from 'express'
import cors from 'cors'
import "dotenv/config";
import mongoose from 'mongoose';
import dns from 'dns'
import userRouter from './Routes/userRoutes.js';
import imageRouter from './Routes/imageRoutes.js';

dns.setServers(["1.1.1.1","8.8.8.8"])

const PORT =process.env.PORT
const MONGO_URL=process.env.MONGO_URL

mongoose.connect(MONGO_URL)

.then(()=>{
    console.log("DB connected")
})
.catch((err)=>{
    console.log(err)
})

const app=express()

app.use(express.json())
app.use(cors())
app.use('/api/user',userRouter)
app.use('/api/image',imageRouter)

app.get('/',(req,res)=>{
    res.send("api is working")
})

app.listen(PORT,()=>{
    console.log(`server is running at http://localhost:${PORT}`)
})

