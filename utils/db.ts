import mongoose from "mongoose";
require("dotenv").config()
const dbUrl:string=process.env.DB_URI || ''

export const connectDB=async()=>{
    try{
        await mongoose.connect(dbUrl).then(()=>{
            console.log('DB connected');
        })
    }catch(error:any){
        console.log(error.message); 
    }
}