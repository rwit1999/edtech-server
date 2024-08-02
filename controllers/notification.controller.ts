import Notification from "../models/notificationModel";
import { NextFunction,Request,Response } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import cron from 'node-cron'
 
//get all notifications (only admin)
export const getNotifications = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const notifications = await Notification.find().sort({createdAt:-1})
        res.status(201).json({
            success:true,
            notifications
        })

      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );


//update notification status (only admin)

export const updateNotificationStatus = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notification = await Notification.findById(req.params.id);
      if (!notification) {
        console.log('Notification not found');
        return next(new ErrorHandler('Notification not found', 404));
      }

      console.log('Fetched notification:', notification);

      if (notification.status === 'unread') {
        notification.status = 'read';
      }

      console.log('Updating notification status to read');
      
      await notification.save();
      console.log('Updated notification:', notification);

      const notifications = await Notification.find().sort({ createdAt: -1 });
      console.log('All notifications:', notifications);

      res.status(201).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      console.log('Error during notification status update:', error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);


  //delete notification (only admin)
  
cron.schedule("0 0 * * *",async ()=>{
    const thirtyDaysAgo = new Date(Date.now()-30*24*60*60*1000)
    await Notification.deleteMany({status:"read",createdAt:{$lt:thirtyDaysAgo}})
    // This cron job is set to run every day at midnight and deletes notifications older than 30 days. 
})
