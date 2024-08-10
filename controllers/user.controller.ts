require('dotenv').config()
import cloudinary from 'cloudinary'
import { Request,Response,NextFunction } from "express";
import User, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import jwt, { JwtPayload } from "jsonwebtoken";
import ejs from 'ejs'
import path from "path";
import { sendMail } from "../sendMail";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";
import { getUserById } from "../services/user.service";

//registerUser
interface IRegistrationBody{
    name:string,
    email:string,
    password:string,
    avatar?:string
}
export const registerUser = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const {name,email,password} = req.body 
        const isEmailExists = await User.findOne({email:email})
        if(isEmailExists){
            return next(new ErrorHandler("Email already exists",400))
        }
        const user:IRegistrationBody={
            name,
            email,
            password,
        }
        const activationToken = createActivationToken(user)
        const activationCode = activationToken.activationCode

        const data={user:{name:user.name},activationCode}

        const html = await ejs.renderFile(path.join(__dirname,"../mails/activation-mail.ejs"),data)
        
        try{
            await sendMail({
                email:user.email,
                subject:"Activate you account",
                template:"activation-mail.ejs",
                data
            })
            res.status(201).json({
                success:true,
                message:`Please check your email ${user.email} to activate your account`,
                activationToken:activationToken.token
            })
        }catch(error){
            return next(new ErrorHandler(error.message,400))
        }

    }catch(error:any){
        return next(new ErrorHandler(error.message,400))
    }

})


export const addAdmin = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const {name,email,password} = req.body 
        const role="admin"
        const admin = await User.create({
            name,
            email,
            password,
            role
        })

        res.status(201).json({
            success:true,
            admin
        })
    }catch(error:any){
        return next(new ErrorHandler(error.message,400))
    }

})


//creating activation token 

interface IActivationToken{
    token:string,
    activationCode:string
}

export const createActivationToken=(user:any):IActivationToken=>{

    const activationCode=Math.floor(1000+Math.random()*9000).toString() // generates a 4 digit number

    const token = jwt.sign({user,activationCode},process.env.JWT_SECRET,{expiresIn:"5m"})

    return {token,activationCode}
}

//activating user
interface IActivationRequest{
    activation_token:string,
    activation_code:string
}

export const activateUser = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const {activation_token,activation_code}=req.body 

        //jwt.verfiy returns decoded payload 
        const newUser:{user:IUser,activationCode:string} = jwt.verify(
            activation_token,
            process.env.JWT_SECRET
        ) as {user:IUser,activationCode:string} 

        if(newUser.activationCode!==activation_code){
            return next(new ErrorHandler("Invalid activation code",400))
        }
        const {name,email,password} = newUser.user

        const user = await User.create({
            name,
            email,
            password
        })
        res.status(201).json({message:"User activated successfully"})

    }catch(error){
        return next(new ErrorHandler(error.message,400))
    }
})


//login user
interface ILoginRequest{
    email:string,
    password:string
}

export const loginUser = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const {email,password} = req.body as ILoginRequest
        if(!email || !password)return next(new ErrorHandler("Please enter both the fields",400))

        const user = await User.findOne({email}).select('+password')
        if(!user){
            return next(new ErrorHandler("Please enter valid email or password",400))
        }
        const isPasswordMatch = await user.comparePassword(password)
        if(!isPasswordMatch){
            return next(new ErrorHandler("Invalid password",400))
        }

        sendToken(user,200,res)
        
    }catch(error:any){
        return next(new ErrorHandler(error.message,400))
    }
})

export const logoutUser = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try{
        res.cookie("access_token","",{maxAge:1})
        res.cookie("refresh_token","",{maxAge:1})
        
        const userId:any=req.user?._id  || ""
        redis.del(userId)

        res.status(200).json({
            success:true,
            message:"Logged out successfully"
        })
    }catch(error:any){
        return next(new ErrorHandler(error.message,400))
    }
})

//update access token
export const updateAccessToken = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const refresh_token=req.cookies.refresh_token as string
        const decoded = jwt.verify(refresh_token,process.env.REFRESH_TOKEN_SECRET) as JwtPayload
        
        const message = 'Could not refresh token'
        if(!decoded){
            return next(new ErrorHandler(message,400))
        }
        const session = await redis.get(decoded.id)
        if(!session){
            return next(new ErrorHandler('Please login to access this resource',400))
        }
        const user = JSON.parse(session) //json.parse converts string to object
        const accessToken = jwt.sign({id:user._id},process.env.ACCESS_TOKEN_SECRET as string,{
            expiresIn:"15m"
        })

        const refreshToken = jwt.sign({id:user._id},process.env.REFRESH_TOKEN_SECRET as string,{expiresIn:"7d"})


        req.user=user
        res.cookie("access_token",accessToken,accessTokenOptions)
        res.cookie("refresh_token",refreshToken,refreshTokenOptions) 

        await redis.set(user._id,JSON.stringify(user),"EX",604800) // 7 days
        next()

    }catch(error:any){
        return next(new ErrorHandler(error.message,400))
    }
})

//user info
export const getUserInfo = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const userId= req.user?._id
        getUserById(userId as string,res)

    }catch(error:any){
        return next(new ErrorHandler(error.message,400))
    }
})

interface ISocialAuthBody{
    email:string,
    avatar:string,
    name:string
}

//social auth(when we are registering with social media)   
export const socialAuth = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const {name,email,avatar}=req.body as ISocialAuthBody
        const user = await User.findOne({email})
        if(!user){
            const newUser = await User.create({email,name,avatar})
            sendToken(newUser,200,res)
        }
        else{
            sendToken(user,200,res) 
        }

    }catch(error:any){
        return next(new ErrorHandler(error.message,400))
    }
})

//update user Info
interface  IUpdateUserInfo{
    name?:string,
    email?:string
}
export const updateUserInfo = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const {name}=req.body as IUpdateUserInfo
        const userId= req.user?._id
        const user = await User.findById(userId)
        
        if(name && user){
            user.name=name
        }
        await user?.save()
        await redis.set(userId as any,JSON.stringify(user))

        res.status(201).json({
            success:'true',
            user
        })

    }catch(error:any){
        return next(new ErrorHandler(error.message,400))
    }
})


//update user password
interface IUpdatePassword{
    oldPassword:string,
    newPassword:string
}

export const updatePassword = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const {oldPassword,newPassword}=req.body as IUpdatePassword
        if(!oldPassword || !newPassword){
            return next(new ErrorHandler('Please enter old and new password',400))
        }

        const user = await User.findById(req.user?._id).select('+password')
        //select is false in user model's password's field. So we need to select it here

        if(user?.password===undefined){ // when we logged in by social,password won't be there
            return next(new ErrorHandler('Invalid user',400))
        }            
        const isPasswordMatch = await user.comparePassword(oldPassword)
        if(!isPasswordMatch){
            return next(new ErrorHandler('Incorrect old password',400))
        }
        user.password=newPassword
        await user.save()

        await redis.set(user?._id as string,JSON.stringify(user))

        res.status(201).json({
            success:'true',
            user
        })

    }catch(error:any){
        return next(new ErrorHandler(error.message,400))
    }
})

//update profile picture

interface IUpdateProfilePicture{
    avatar:string
}

export const updateProfilePicture = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const {avatar} = req.body
        const userId = req.user?._id
        const user = await User.findById(userId)

        if(avatar){
            if(user?.avatar?.public_id){
                await cloudinary.v2.uploader.destroy(user?.avatar?.public_id)
            }
            const myCloud = await cloudinary.v2.uploader.upload(avatar,{
                folder:"avatars",
                width:150
            })
            user.avatar={
                public_id:myCloud.public_id,
                url:myCloud.secure_url // this is displayed in Image on frontend
            }
        }

        await user.save()
        await redis.set(user?._id as string,JSON.stringify(user))

        res.status(201).json({
            success:'true',
            user
        })

    }catch(error:any){
        return next(new ErrorHandler(error.message,400))
    }
})

//get all users (only admin can access)
export const getAllUsers=async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const users = await User.find().sort({createdAt:-1})
        res.status(201).json({
            success:true,
            users
        })
    }catch(error){
        return next(new ErrorHandler(error.message,404))
    }
}

// update user role - only by admins
export const updateUserRole=async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const {id,role} = req.body
        const user = await User.findByIdAndUpdate(id,{role},{new:true})
        res.status(201).json({
            success:true,
            user
        })
    }catch(error){
        return next(new ErrorHandler(error.message,404))
    }
}

// delete user  - only by admins
export const deleteUser=async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const id = req.params.id
        const user = await User.findById(id)
        if(!user){
            return next(new ErrorHandler('User not found',404))
        }
        await User.deleteOne({_id:id})
        await redis.del(id)

        res.status(200).json({
            success:true,
            message:"User deleted successfully"
        })
    }catch(error){
        return next(new ErrorHandler(error.message,404))
    }
}


