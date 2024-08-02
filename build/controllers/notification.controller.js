"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationStatus = exports.getNotifications = void 0;
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const catchAsyncError_1 = require("../middlewares/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const node_cron_1 = __importDefault(require("node-cron"));
//get all notifications (only admin)
exports.getNotifications = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const notifications = await notificationModel_1.default.find().sort({ createdAt: -1 });
        res.status(201).json({
            success: true,
            notifications
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//update notification status (only admin)
exports.updateNotificationStatus = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const notification = await notificationModel_1.default.findById(req.params.id);
        if (!notification) {
            console.log('Notification not found');
            return next(new ErrorHandler_1.default('Notification not found', 404));
        }
        console.log('Fetched notification:', notification);
        if (notification.status === 'unread') {
            notification.status = 'read';
        }
        console.log('Updating notification status to read');
        await notification.save();
        console.log('Updated notification:', notification);
        const notifications = await notificationModel_1.default.find().sort({ createdAt: -1 });
        console.log('All notifications:', notifications);
        res.status(201).json({
            success: true,
            notifications,
        });
    }
    catch (error) {
        console.log('Error during notification status update:', error);
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//delete notification (only admin)
node_cron_1.default.schedule("0 0 * * *", async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await notificationModel_1.default.deleteMany({ status: "read", createdAt: { $lt: thirtyDaysAgo } });
    // This cron job is set to run every day at midnight and deletes notifications older than 30 days. 
});
