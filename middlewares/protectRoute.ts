import { Response,Request,NextFunction } from "express";
import { CatchAsyncError } from "./catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from 'jsonwebtoken'
import { redis } from "../utils/redis";

export const isAuthenticated = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    const access_token = req.cookies.access_token
    if(!access_token){
        return next(new ErrorHandler('Please login to access this resource',401))
    }
    const decoded = jwt.verify(access_token,process.env.ACCESS_TOKEN_SECRET as string) as JwtPayload
    
    const user = await redis.get(decoded.id)
    
    if(!user){
        return next(new ErrorHandler('Please login to access this resource',401))
    }
    req.user =JSON.parse(user)
    next()
})

export const authorizedRoles=(...roles:string[])=>{
    return (req:Request,res:Response,next:NextFunction)=>{
        if(!roles.includes(req.user?.role || '')){
            return next(new ErrorHandler(`Role ${req.user.role} is not allowed to access this resource`,401))
        }
        next()
    }
}