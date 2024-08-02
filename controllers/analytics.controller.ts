import { Request,Response,NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import { generateLast12MonthsData } from "../utils/analytics.generator";
import User from "../models/user.model";
import Course from "../models/course.model";
import Order from "../models/orderModel";

//get user analytics -- only by admin
export const getUserAnalytics=async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const users = await generateLast12MonthsData(User)
        res.status(201).json({
            success:true,
            users
        })
    }catch(error){
        return next(new ErrorHandler(error.message,404))
    }
}

export const getCourseAnalytics=async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const courses = await generateLast12MonthsData(Course)
        res.status(201).json({
            success:true,
            courses
        })
    }catch(error){
        return next(new ErrorHandler(error.message,404))
    }
}

export const getOrderAnalytics=async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const orders = await generateLast12MonthsData(Order)
        res.status(201).json({
            success:true,
            orders
        })
    }catch(error){
        return next(new ErrorHandler(error.message,404))
    }
}