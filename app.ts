require('dotenv').config()
import express, { NextFunction ,Request,Response} from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
export const app =express()
import {ErrorMiddleware} from './middlewares/error'
import userRouter from './Routes/user.route'
import courseRouter from './Routes/course.route'
import orderRouter from './Routes/order.route'
import notificationRouter from './Routes/notification.route'
import analyticsRouter from './Routes/analytics.route'
import layoutRouter from './Routes/layout.route'



app.use(express.json({limit:'50mb'})) //this is body parser
app.use(cookieParser())
app.use(cors({
    origin: 'http://localhost:3000', // Your frontend URL
    credentials: true // Allow credentials (cookies, authorization headers, etc.)
}));





app.use('/api/v1',userRouter) 
app.use('/api/v1',courseRouter) 
app.use('/api/v1',orderRouter) 
app.use('/api/v1',notificationRouter) 
app.use('/api/v1',analyticsRouter) 
app.use('/api/v1',layoutRouter) 


app.get('/test',(req:Request,res:Response,next:NextFunction)=>{
    res.status(200).json({
        success:true,
        message:"API is working"
    })
})

app.get('*',(req:Request,res:Response,next:NextFunction)=>{
    const err= new Error(`Route ${req.originalUrl} not found`) as any
    err.statusCode=404
    next(err)
})


app.use(ErrorMiddleware)





