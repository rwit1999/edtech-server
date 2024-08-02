import { NextFunction, Response } from "express";
import Course from "../models/course.model";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";

//create course
export const createCourse = CatchAsyncError(async (data:any,res:Response)=>{
    // console.log(data);
    
    

})