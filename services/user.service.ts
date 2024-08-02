import { NextFunction, Response } from "express"
import User from "../models/user.model"
import { redis } from "../utils/redis"
import ErrorHandler from "../utils/ErrorHandler"

//get user By id
export const getUserById=async(id:string,res:Response)=>{
    const userJson = await redis.get(id)
    if(userJson){
        const user =JSON.parse(userJson)
        res.status(201).json({
            success:'true',
            user
        })
    }
}


