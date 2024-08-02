require('dotenv').config()
import mongoose,{Document, Model, Schema, mongo} from "mongoose";
import { StringMappingType } from "typescript";
import { IUser } from "./user.model";

//interfaces
interface IComment extends Document{
    user:IUser,
    question:string 
    questionReplies:IComment[] 
}

interface IReview extends Document{
    user:IUser,// the user who is giving the review
    rating:number,
    comment:string,
    commentReplies:IComment[]
}

interface ILink extends Document{
    title:string,
    url:string
}

interface ICourseData extends Document{
    title:string,
    description:string,
    videoUrl:string,
    videoThumbnail:object,
    videoSection:string,
    videoLength:number,
    videoPlayer:string,
    links:ILink[],
    suggestion:string,
    questions:IComment[]
}

interface ICourse extends Document{
    name:string,
    description:string,
    price:number,
    estimatedPrice:number, //original course price
    thumbnail:object,
    tags:string,
    level:string,
    videoUrl:string,
    categories:string,
    benefits:{title:string}[],
    prerequisites:{title:string}[],
    reviews:IReview[],
    courseData:ICourseData[],
    rating?:number,
    purchased?:number 
}



//schemas
const reviewSchema = new Schema<IReview>({
    user:Object,
    rating:{
        type:Number,
        default:0
    },
    comment:String,
    commentReplies:[Object]
},{timestamps:true})

const linkSchema = new Schema<ILink>({
    title:String,
    url:String
})

const commentSchema = new Schema<IComment>({
    user:Object,
    question:String,
    questionReplies:[Object] 
},{timestamps:true})

const courseDataSchema = new Schema<ICourseData>({
    title:String,
    description:String,
    videoUrl:String,
    videoSection:String,
    videoLength:Number,
    videoPlayer:String, 
    links:[linkSchema],
    suggestion:String,
    questions:[commentSchema]
})

const courseSchema = new Schema<ICourse>({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    categories:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    estimatedPrice:{
        type:Number, //original course price
    },
    thumbnail:{
        public_id:{
            type:String,
        },
        url:{
            type:String,
        }
    },
    tags:{
        type:String,
        required:true
    },
    level:{
        type:String,
        required:true
    },
    videoUrl:{
        type:String,
    },
    benefits:[{title:String}], 
    prerequisites:[{title:String}],
    reviews:[reviewSchema],
    rating:{
        type:Number,
        default:0
    },
    courseData:[courseDataSchema],
    purchased:{
        type:Number,
        default:0
    } 
},{timestamps:true})

const Course:Model<ICourse> = mongoose.model("Course",courseSchema)

export default Course







