import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import path from "path";
import ejs from 'ejs'
import { sendMail } from "../sendMail";
import Notification from "../models/notificationModel";
import Order, { IOrder } from "../models/orderModel";
import User from "../models/user.model";
import Course from "../models/course.model";
import { redis } from "../utils/redis";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

export const createOrder = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {courseId,payment_info} = req.body as IOrder;
        // console.log(courseId);
        // console.log(payment_info);
        
        

        if(payment_info){
            if("id" in payment_info){
                const paymentIntentId=payment_info.id
                const paymentIntent=await stripe.paymentIntents.retrieve(paymentIntentId)
        
                if(paymentIntent.status!=='succeeded'){
                    return next(new ErrorHandler("Payment not authorized",404))
                }
            }
        }
        
        

        const user = await User.findById(req.user._id)
        const courseExistsInUser = user.courses.find((course: any) => {
            return course._id.toString() === courseId;
          });
        if(courseExistsInUser){
            return next(new ErrorHandler('You have already purchased this course',400));
        }

        const course= await Course.findById(courseId)
        // console.log(course);
        
        const data:any={
            courseId:course._id,
            userId:user._id,
            payment_info
        }        
        
        user?.courses?.push({courseId})

        const userId=req.user._id as string

        await redis.set(userId,JSON.stringify(user))

        await user?.save()
        
        course.purchased=course.purchased+1
        
        await course.save()

        const order = await Order.create(data)

        res.status(201).json({
            success:'true',
            order
        })

      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );


  //get all orders (only for admin)
export const getAllOrders=async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const orders = await Order.find().sort({createdAt:-1})
        res.status(201).json({
            success:true,
            orders
        })
    }catch(error){
        return next(new ErrorHandler(error.message,404))
    }
}

// send stripe publishible key
export const sendStripePublishableKey=async(req:Request,res:Response,next:NextFunction)=>{
    try{
        res.status(201).json({
            publishableKey:process.env.STRIPE_PUBLISHABLE_KEY,
        })
        
    }catch(error){
        return next(new ErrorHandler(error.message,404))
    }
}

// new payment
export const newPayment=async(req:Request,res:Response,next:NextFunction)=>{
    try{
        // console.log(req.body.amount);
        
        const myPayment=await stripe.paymentIntents.create({
            amount:req.body.amount*100,
            currency:"INR",
            metadata:{
                company:"Wiser"
            },
            automatic_payment_methods:{
                enabled:true
            }
        })
        
        res.status(201).json({
            success:true,
            client_secret:myPayment.client_secret
        })
    }catch(error){
        return next(new ErrorHandler(error.message,404))
    }
}

