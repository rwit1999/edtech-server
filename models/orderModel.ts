require('dotenv').config()
import mongoose,{Document, Model, Schema, mongo} from "mongoose";

export interface IOrder extends Document{
    courseId:string,
    userId:string,
    payment_info:object
}

const orderSchema = new Schema<IOrder>({
    courseId:{
        type:String,
        required:true
    },
    userId:{
        type:String,
        required:true
    },
    payment_info:{
        type:Object,
    }
},{timestamps:true})

const Order:Model<IOrder> = mongoose.model("Order",orderSchema)

export default Order







