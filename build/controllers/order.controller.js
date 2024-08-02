"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newPayment = exports.sendStripePublishableKey = exports.getAllOrders = exports.createOrder = void 0;
const catchAsyncError_1 = require("../middlewares/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const sendMail_1 = require("../sendMail");
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const orderModel_1 = __importDefault(require("../models/orderModel"));
const user_model_1 = __importDefault(require("../models/user.model"));
const course_model_1 = __importDefault(require("../models/course.model"));
const redis_1 = require("../utils/redis");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
exports.createOrder = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { courseId, payment_info } = req.body;
        // console.log(courseId);
        // console.log(payment_info);
        if (payment_info) {
            if ("id" in payment_info) {
                const paymentIntentId = payment_info.id;
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                if (paymentIntent.status !== 'succeeded') {
                    return next(new ErrorHandler_1.default("Payment not authorized", 404));
                }
            }
        }
        const user = await user_model_1.default.findById(req.user._id);
        const courseExistsInUser = user.courses.find((course) => {
            return course._id.toString() === courseId;
        });
        if (courseExistsInUser) {
            return next(new ErrorHandler_1.default('You have already purchased this course', 400));
        }
        const course = await course_model_1.default.findById(courseId);
        console.log(course);
        const data = {
            courseId: course._id,
            userId: user._id,
            payment_info
        };
        const mailData = {
            order: {
                _id: course._id.toString().slice(0, 6),
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            }
        };
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, '../mails/order-confirmation.ejs'), { order: mailData });
        try {
            if (user) {
                await (0, sendMail_1.sendMail)({
                    email: user.email,
                    subject: "Order confirmation",
                    template: "order-confirmation.ejs",
                    data: mailData
                });
            }
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 500));
        }
        user?.courses?.push({ courseId });
        const userId = req.user._id;
        await redis_1.redis.set(userId, JSON.stringify(user));
        await user?.save();
        await notificationModel_1.default.create({
            user: user?._id,
            title: "New Order",
            message: `You have a new order from ${course.name}`
        });
        course.purchased = course.purchased + 1;
        await course.save();
        const order = await orderModel_1.default.create(data);
        res.status(201).json({
            success: 'true',
            order
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//get all orders (only for admin)
const getAllOrders = async (req, res, next) => {
    try {
        const orders = await orderModel_1.default.find().sort({ createdAt: -1 });
        res.status(201).json({
            success: true,
            orders
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 404));
    }
};
exports.getAllOrders = getAllOrders;
// send stripe publishible key
const sendStripePublishableKey = async (req, res, next) => {
    try {
        res.status(201).json({
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 404));
    }
};
exports.sendStripePublishableKey = sendStripePublishableKey;
// new payment
const newPayment = async (req, res, next) => {
    try {
        // console.log(req.body.amount);
        const myPayment = await stripe.paymentIntents.create({
            amount: req.body.amount * 100,
            currency: "INR",
            metadata: {
                company: "Wiser"
            },
            automatic_payment_methods: {
                enabled: true
            }
        });
        res.status(201).json({
            success: true,
            client_secret: myPayment.client_secret
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 404));
    }
};
exports.newPayment = newPayment;
