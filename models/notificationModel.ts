require('dotenv').config()
import mongoose,{Document, Model, Schema, mongo} from "mongoose";

export interface INotification extends Document{
    title:string,
    message:string,
    status:string,
    userId:string
}

const notificationSchema = new Schema<INotification>({
    title:{
        type:String,
        required:true
    },
    userId:{
        type:String,
        required:true
    },
    message:{
        type:String,
        required:true
    },
    status:{
        type:String,
        default:"unread"
    }
},{timestamps:true})

const Notification:Model<INotification> = mongoose.model("Notification",notificationSchema)

export default Notification







