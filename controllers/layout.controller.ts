import Notification from "../models/notificationModel";
import { NextFunction,Request,Response } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import cron from 'node-cron'
import Layout from "../models/layout.model";
import cloudinary from 'cloudinary'
 

export const createLayout = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {type} = req.body
        const isTypeExists = await Layout.findOne({type})   
        if(isTypeExists){
            return next(new ErrorHandler(`${type} already exists`,404))
        }

        if(type==='Banner'){
            const {image,title,subTitle} = req.body
            const myCloud = await cloudinary.v2.uploader.upload(image,{
                folder:"layout"
            })

            const banner = {
                image:{
                    public_id:myCloud.public_id,
                    url:myCloud.secure_url
                },
                title,
                subTitle
            }

            await Layout.create(banner)            
        }

        if(type==='FAQ'){
            const {faq}=req.body
            const faqItems = await Promise.all(
                faq.map(async(item:any)=>{
                    return {
                        question:item.question,
                        answer:item.answer
                    }
                })
            )
            await Layout.create({type:"FAQ",faq:faqItems})
        }

        if(type==='Categories'){
            const {categories}=req.body
            const categoriesItems = await Promise.all(
                categories.map(async(item:any)=>{
                    return {
                        title:item.title
                    }
                })
            )
            await Layout.create({type:"Catergory",categories:categoriesItems})
        }

        res.status(201).json({
            success:true,
        })

      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );


  //create layout

  export const editLayout = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {type} = req.body
        if(type==='Banner'){
            const bannerData:any = await Layout.findOne({type:"Banner"})
            const {image,title,subTitle} = req.body
            if(bannerData){
                await cloudinary.v2.uploader.destroy(bannerData.banner.image.url)
            }
            const myCloud = await cloudinary.v2.uploader.upload(image,{
                folder:"layout"
            })

            const banner = {
                type:"Banner",
                image:{
                    public_id:myCloud.public_id,
                    url:myCloud.secure_url
                },
                title,
                subTitle
            }

            await Layout.findByIdAndUpdate(bannerData._id,{banner})            
        }

        if(type==='FAQ'){
            const {faq}=req.body
            const faqItem = await Layout.findOne({type:"FAQ"}) // from db
            const faqItems = await Promise.all(
                faq.map(async(item:any)=>{
                    return {
                        question:item.question,
                        answer:item.answer
                    }
                })
            )
            await Layout.findByIdAndUpdate(faqItem._id,{type:"FAQ",faq:faqItems})
        }

        if(type==='Category'){
            const {categories}=req.body
            const categoriesItem = await Layout.findOne({type:"Category"})
            const categoriesItems = await Promise.all(
                categories.map(async(item:any)=>{
                    return {
                        title:item.title
                    }
                })
            )
            await Layout.findByIdAndUpdate(categoriesItem._id,{type:"Category",categories:categoriesItems})
        }

        res.status(201).json({
            success:true,
            message:"Layout updated successfully"
        })

      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );

  //get layout by type

  export const getLayout = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const layout = await Layout.findOne(req.body)
        
        res.status(201).json({
            success:true,
            layout
        })

      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );


