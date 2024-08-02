"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideoUrl = exports.deleteCourse = exports.getAllCoursesForAdmin = exports.addReplyToReview = exports.addReview = exports.addAnswer = exports.addQuestion = exports.getCourseByUser = exports.getCoursesUserBought = exports.getAllCourses = exports.getSingleCourse = exports.editCourse = exports.uploadCourse = void 0;
const catchAsyncError_1 = require("../middlewares/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const course_model_1 = __importDefault(require("../models/course.model"));
const redis_1 = require("../utils/redis");
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const axios_1 = __importDefault(require("axios"));
//create course
exports.uploadCourse = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const data = req.body;
        // console.log("hhaha from backend");
        console.log(data);
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        const course = await course_model_1.default.create(data);
        res.status(201).json({
            success: true,
            course
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//edit course
exports.editCourse = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        const courseData = await course_model_1.default.findById(req.params.id);
        if (thumbnail && !thumbnail.startsWith("https")) {
            await cloudinary_1.default.v2.uploader.destroy(courseData.thumbnail.public_id);
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        if (thumbnail.startsWith("https")) {
            data.thumbnail = {
                public_id: courseData?.thumbnail.public_id,
                url: courseData?.thumbnail.url
            };
        }
        const courseId = req.params.id;
        const course = await course_model_1.default.findByIdAndUpdate(courseId, { $set: data }, { new: true });
        res.status(201).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//get single course - without purchase
exports.getSingleCourse = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const courseInCache = await redis_1.redis.get(courseId);
        if (courseInCache) {
            const course = JSON.parse(courseInCache);
            res.status(201).json({
                success: true,
                course,
            });
        }
        else {
            const course = await course_model_1.default.findById(req.params.id).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
            await redis_1.redis.set(courseId, JSON.stringify(course), 'EX', 604800);
            res.status(201).json({
                success: true,
                course,
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//get all courses -without purchasing
exports.getAllCourses = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const courses = await course_model_1.default.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
        res.status(201).json({
            success: true,
            courses,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.getCoursesUserBought = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const userCourses = req.user.courses;
        const boughtCourseIds = userCourses.map((course) => course.courseId);
        const courses = await course_model_1.default.find({ _id: { $in: boughtCourseIds } });
        res.status(201).json({
            success: true,
            courses,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//get course content for valid user
exports.getCourseByUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const userCourseList = req.user?.courses;
        const courseExists = userCourseList?.find((course) => course.courseId === courseId);
        if (courseExists) {
            const course = await course_model_1.default.findById(courseId);
            const content = course?.courseData;
            res.status(201).json({
                success: true,
                content,
            });
        }
        else {
            return next(new ErrorHandler_1.default('You are not eligible to access this course', 404));
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addQuestion = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { question, courseId, contentId } = req.body;
        console.log(req.body);
        const course = await course_model_1.default.findById(courseId);
        // console.log(course);
        const courseContent = await course?.courseData?.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler_1.default('Invalid content Id', 400));
        }
        const newQuestion = {
            user: req.user,
            question,
            questionReplies: []
        };
        courseContent.questions.push(newQuestion);
        await notificationModel_1.default.create({
            userId: req.user._id,
            title: "New Question Received",
            message: `You have a new question in ${courseContent.title}`
        });
        await course?.save();
        res.status(201).json({
            success: true,
            course
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addAnswer = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { answer, questionId, courseId, contentId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        const courseContent = await course?.courseData?.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler_1.default('Invalid content Id', 400));
        }
        const question = courseContent.questions.find((item) => item._id.equals(questionId));
        if (!question) {
            return next(new ErrorHandler_1.default('Invalid question Id', 500));
        }
        const newAnswer = {
            answer,
            user: req.user,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        question.questionReplies.push(newAnswer);
        await course?.save();
        if (req.user?._id === question.user._id) { // user
            //create a notification
            await notificationModel_1.default.create({
                user: req.user._id,
                title: "New Question Reply Received",
                message: `You have a new question reply in ${courseContent.title}`
            });
        }
        else { // admin or other people gives answer
            const data = {
                name: question.user.name,
                title: courseContent.title,
            };
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
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addReview = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { review, rating } = req.body;
        const courseId = req.params.id;
        const course = await course_model_1.default.findById(courseId);
        const newReview = {
            user: req.user,
            comment: review,
            rating
        };
        course.reviews.push(newReview);
        let sum = 0;
        course?.reviews.forEach((review) => {
            sum += review.rating;
        });
        if (course) {
            course.rating = sum / course.reviews.length;
        }
        await course?.save();
        await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800);
        //create notification (we'll be done later by socket)
        await notificationModel_1.default.create({
            user: req.user._id,
            title: "New review received",
            message: `${req.user?.name} has given a review in ${course?.name}`
        });
        res.status(200).json({
            success: true,
            course
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addReplyToReview = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { comment, reviewId, courseId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        const review = await course.reviews.find((rev) => rev._id.toString() === reviewId);
        if (!review) {
            return next(new ErrorHandler_1.default('Review not found', 404));
        }
        const replyData = {
            user: req.user,
            comment,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        review.commentReplies.push(replyData);
        await course?.save();
        const notification = {
            title: "New review received",
            message: `${req.user?.name} has given a review in ${course?.name}`
        };
        //create notification (we'll be done later by socket)
        res.status(200).json({
            success: true,
            course
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//get all courses
const getAllCoursesForAdmin = async (req, res, next) => {
    try {
        const courses = await course_model_1.default.find().sort({ createdAt: -1 });
        res.status(201).json({
            success: true,
            courses
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 404));
    }
};
exports.getAllCoursesForAdmin = getAllCoursesForAdmin;
// delete course  - only by admins
const deleteCourse = async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = await course_model_1.default.findById(id);
        console.log("hello from backend");
        if (!user) {
            return next(new ErrorHandler_1.default('Course not found', 404));
        }
        await course_model_1.default.deleteOne({ _id: id });
        await redis_1.redis.del(id);
        res.status(200).json({
            success: true,
            message: "Course deleted successfully"
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 404));
    }
};
exports.deleteCourse = deleteCourse;
//generate video url
exports.generateVideoUrl = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { videoId } = req.body;
        console.log(videoId);
        const response = await axios_1.default.post(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, { ttl: 300 }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Apisecret RvM2Mp2gZF0kPEGiMH9sfcM1glEUO6aw0eIO7nPIPcJNlAoK62IlmP34w96bcGY7', // Ensure the API secret is correct
            },
        });
        // Log the response data for debugging
        console.log(response.data);
        // Send the response data back to the client
        res.status(200).json(response.data);
    }
    catch (error) {
        // Log detailed error information
        console.error('Error generating video URL:', error);
        // Use a more generic error code, as 404 might not be appropriate for all errors
        return next(new ErrorHandler_1.default(error.response ? error.response.data.message : error.message, error.response ? error.response.status : 500));
    }
});
