import { NextFunction, Response } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import Order from "../models/orderModel";

//create new order
export const newOrder = CatchAsyncError(async (data:any,res:Response)=>{
    const order = await Order.create(data)
    

})