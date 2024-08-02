require('dotenv').config()
import mongoose,{Document, Model, Schema} from "mongoose";
import bcrypt from 'bcrypt'
import { Models } from "mongoose";
import jwt from "jsonwebtoken";

const emailRegexPattern:RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface IUser extends Document{
    name:string,
    email:string,
    password:string,
    avatar:{ //cloudinary
        public_id:string,
        url:string 
    },
    role:string,
    isVerfied:boolean,
    courses:Array<{courseId:string}>,
    comparePassword:(password:string)=>Promise<boolean>,
    SignAccessToken:()=>string
    SignRefreshToken:()=>string
}

const userSchema:Schema<IUser> = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        validate:{
            validator:function(value:string){
                return emailRegexPattern.test(value)
            },
            message:"please enter a valid email"
        },
        unique:true,

    },
    password:{
        type:String,
        minlength:[6,"Password must be atleast 6 characters"],
        select:false
    },
    avatar:{
        public_id:String,
        url:String
    },
    role:{
        type:String,
        default:"user"
    },
    isVerfied:{
        type:Boolean,
        default:false
    },
    courses:[{
        courseId:String,
}]

},{timestamps:true})


//Hash password before saving
userSchema.pre<IUser>('save',async function(next){
    if(!this.isModified('password')){
        next()
    }   
    this.password=await bcrypt.hash(this.password,10)
    next()
})

//compare password
userSchema.methods.comparePassword=async function(enteredPassword:string):Promise<boolean>{
    return await bcrypt.compare(enteredPassword,this.password) 
}

//sign access token
userSchema.methods.SignAccessToken=function():string{
    return jwt.sign({id:this._id},process.env.ACCESS_TOKEN_SECRET,{expiresIn:'5m'}) 
}

//sign refresh token
userSchema.methods.SignRefreshToken=function():string{
    return jwt.sign({id:this._id},process.env.REFRESH_TOKEN_SECRET,{expiresIn:"3d"} ) 
}





const User:Model<IUser>=mongoose.model('User',userSchema)
export default User



