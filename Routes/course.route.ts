import express from 'express'
import { isAuthenticated ,authorizedRoles} from '../middlewares/protectRoute'
import { addAnswer, addQuestion, addReplyToReview, addReview, deleteCourse, editCourse, generateVideoUrl, getAllCourses, getAllCoursesForAdmin, getCourseByUser, getCoursesUserBought, getSingleCourse, uploadCourse } from '../controllers/course.controller'
import { updateAccessToken } from '../controllers/user.controller'

const courseRouter = express.Router()

courseRouter.post('/create-course',updateAccessToken,isAuthenticated,authorizedRoles("admin"),uploadCourse)
courseRouter.post('/add-question',updateAccessToken,isAuthenticated,addQuestion)
courseRouter.post('/add-answer',updateAccessToken,isAuthenticated,addAnswer)
courseRouter.post('/add-review/:id',updateAccessToken,isAuthenticated,addReview)
courseRouter.post('/add-reply-to-review',updateAccessToken,isAuthenticated,authorizedRoles("admin"),addReplyToReview)
courseRouter.post('/getVdoCipherOTP',generateVideoUrl)

courseRouter.put('/edit-course/:id',updateAccessToken,isAuthenticated,authorizedRoles("admin"),editCourse)

courseRouter.get('/get-course/:id',getSingleCourse)
courseRouter.get('/get-all-courses',getAllCourses)
courseRouter.get('/get-user-courses',updateAccessToken,isAuthenticated,getCoursesUserBought)
courseRouter.get('/get-course-content/:id',updateAccessToken,isAuthenticated,getCourseByUser)
courseRouter.get('/get-all-courses-admin',updateAccessToken,isAuthenticated,authorizedRoles("admin"),getAllCoursesForAdmin)


courseRouter.delete('/delete-course/:id',updateAccessToken,isAuthenticated,authorizedRoles("admin"),deleteCourse)




export default courseRouter 