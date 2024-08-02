import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.service";
import Course from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose, { isValidObjectId } from "mongoose";
import path from "path";
import ejs from 'ejs'
import { sendMail } from "../sendMail";
import Notification from "../models/notificationModel";
import axios from "axios";

//create course
export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      // console.log("hhaha from backend");
      console.log(data);
      

      const thumbnail = data.thumbnail;
      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      const course = await Course.create(data)
      res.status(201).json({
          success:true,
          course
      })
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//edit course
export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      const courseData = await Course.findById(req.params.id) as any

      if (thumbnail && !thumbnail.startsWith("https")) {
        await cloudinary.v2.uploader.destroy(courseData.thumbnail.public_id);

        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      if(thumbnail.startsWith("https")){
        data.thumbnail={
          public_id:courseData?.thumbnail.public_id,
          url:courseData?.thumbnail.url
        }
      }

      const courseId = req.params.id;
      const course = await Course.findByIdAndUpdate(
        courseId,
        { $set: data },
        { new: true }
      );

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get single course - without purchase

export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
        const courseId = req.params.id
        const courseInCache = await redis.get(courseId)
        if(courseInCache){
            const course = JSON.parse(courseInCache)
            res.status(201).json({
                success: true,
                course,
              });
        }
        else{
            const course = await Course.findById(req.params.id).select(
              "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
            );

            await redis.set(courseId,JSON.stringify(course),'EX',604800)   

            res.status(201).json({
              success: true,
              course,
            });

        
          }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get all courses -without purchasing
export const getAllCourses = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const courses = await Course.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links") 
        
        res.status(201).json({
          success: true,
          courses,
        });

      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );


export const getCoursesUserBought = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userCourses=req.user.courses
        const boughtCourseIds=userCourses.map((course)=>course.courseId)
        
        const courses = await Course.find({ _id: { $in: boughtCourseIds } });
        
        res.status(201).json({
          success: true,
          courses,
        });

      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );


  
  //get course content for valid user
  export const getCourseByUser = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
          const courseId = req.params.id
          const userCourseList = req.user?.courses
          const courseExists = userCourseList?.find((course:any)=>course.courseId===courseId)
          if(courseExists){
            const course = await Course.findById(courseId)
            const content = course?.courseData
            res.status(201).json({
                success: true,
                content,
              });
          }
          else{
            return next(new ErrorHandler('You are not eligible to access this course',404));
        } 

      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );


  //add questions in course
interface IAddQuestionData{
  question:string,
  courseId:string,
  contentId:string,
}

export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {question,courseId,contentId}:IAddQuestionData = req.body
        console.log(req.body);
        

        const course = await Course.findById(courseId)
        // console.log(course);
        
        const courseContent = await course?.courseData?.find((item:any)=>item._id.equals(contentId)
      )

        if(!courseContent){
          return next(new ErrorHandler('Invalid content Id', 400));
        }

        const newQuestion:any = {
          user:req.user,
          question,
          questionReplies:[]
        }

        courseContent.questions.push(newQuestion)

        await Notification.create({
          userId:req.user._id,
          title:"New Question Received",
          message:`You have a new question in ${courseContent.title}`
        })

        await course?.save()

        res.status(201).json({
          success: true,
          course
        });


    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//add answer in course question
// answer can be given by anyone(other users or admins....)
interface IAnswerData{
  answer:string,
  courseId:string,
  contentId:string,
  questionId:string
}

export const addAnswer = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {answer,questionId,courseId,contentId}:IAnswerData = req.body

        const course = await Course.findById(courseId)
        const courseContent = await course?.courseData?.find((item:any)=>item._id.equals(contentId))

        if(!courseContent){
          return next(new ErrorHandler('Invalid content Id', 400));
        }

        const question = courseContent.questions.find((item:any)=>item._id.equals(questionId))
        if(!question){
          return next(new ErrorHandler('Invalid question Id', 500));
        }

        const newAnswer:any = {
          answer,
          user:req.user,
          createdAt:new Date().toISOString(),
          updatedAt:new Date().toISOString()  
        }

        question.questionReplies.push(newAnswer)
        await course?.save()

        if(req.user?._id===question.user._id){ // user
          //create a notification
          await Notification.create({
            user:req.user._id,
            title:"New Question Reply Received",
            message:`You have a new question reply in ${courseContent.title}`
          })
          
        }else{ // admin or other people gives answer
          const data={
            name:question.user.name,
            title:courseContent.title,
          }
        }
          // const html = await ejs.renderFile(path.join(__dirname,"../mails/question-reply.ejs"),data)

          // console.log(question.user.email);
          

        //   try{
        //     await sendMail({
        //       email:question.user.email, 
        //       subject:"Question reply",
        //       template:"question-reply.ejs",
        //       data
        //     })
        //   }catch(error){
        //     return next(new ErrorHandler(error,404))
        //   }
        // }

        res.status(201).json({
          success: true,
          course
        });


    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//add review in course
interface IAddReviewData{
  review:string,
  rating:number,
  userId:string
}

export const addReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {review,rating}:IAddReviewData = req.body

        const courseId = req.params.id
        const course = await Course.findById(courseId)
        
        const newReview:any = {
          user:req.user,
          comment:review,
          rating
        }

        course.reviews.push(newReview)

        let sum =0;
        course?.reviews.forEach((review:any)=>{
          sum+=review.rating
        })

        if(course){
          course.rating = sum/course.reviews.length
        }
        await course?.save()
        await redis.set(courseId,JSON.stringify(course),"EX",604800)

        //create notification (we'll be done later by socket)
        await Notification.create({
          user:req.user._id,
          title:"New review received",
          message:`${req.user?.name} has given a review in ${course?.name}`
        })

        res.status(200).json({
          success: true,
          course
        });


    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);


//add reply to review

interface IAddReplyToReviewData{
  comment:string,
  courseId:string,
  reviewId:string
}

export const addReplyToReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {comment,reviewId,courseId}:IAddReplyToReviewData = req.body

        const course = await Course.findById(courseId)
        const review = await course.reviews.find((rev:any)=>rev._id.toString()===reviewId)

        if(!review){
          return next(new ErrorHandler('Review not found', 404));
        }
      
        const replyData:any = {
          user:req.user,
          comment,
          createdAt:new Date().toISOString(),
          updatedAt:new Date().toISOString()  
        }
        
        review.commentReplies.push(replyData)
        
        await course?.save()

        const notification = {
          title:"New review received",
          message:`${req.user?.name} has given a review in ${course?.name}`
        }
        //create notification (we'll be done later by socket)

        res.status(200).json({
          success: true,
          course
        });


    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);


//get all courses
export const getAllCoursesForAdmin=async(req:Request,res:Response,next:NextFunction)=>{
  try{
      const courses = await Course.find().sort({createdAt:-1})
      res.status(201).json({
          success:true,
          courses
      })
  }catch(error){
      return next(new ErrorHandler(error.message,404))
  }
}


// delete course  - only by admins
export const deleteCourse=async(req:Request,res:Response,next:NextFunction)=>{
  try{
      const id = req.params.id
      const user = await Course.findById(id)
      console.log("hello from backend");
      
      if(!user){
          return next(new ErrorHandler('Course not found',404))
      }
      await Course.deleteOne({_id:id})
      await redis.del(id)

      res.status(200).json({
          success:true,
          message:"Course deleted successfully"
      })
  }catch(error){
      return next(new ErrorHandler(error.message,404))
  }
}

//generate video url
export const generateVideoUrl = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { videoId } = req.body;
    console.log(videoId);

    const response = await axios.post(
      `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
      { ttl: 300 },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Apisecret RvM2Mp2gZF0kPEGiMH9sfcM1glEUO6aw0eIO7nPIPcJNlAoK62IlmP34w96bcGY7', // Ensure the API secret is correct
        },
      }
    );

    // Log the response data for debugging
    console.log(response.data);

    // Send the response data back to the client
    res.status(200).json(response.data);
  } catch (error: any) {
    // Log detailed error information
    console.error('Error generating video URL:', error);

    // Use a more generic error code, as 404 might not be appropriate for all errors
    return next(new ErrorHandler(error.response ? error.response.data.message : error.message, error.response ? error.response.status : 500));
  }
});