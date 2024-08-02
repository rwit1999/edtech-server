import express from 'express'
import { isAuthenticated ,authorizedRoles} from '../middlewares/protectRoute'
import { getNotifications, updateNotificationStatus } from '../controllers/notification.controller'
import { getCourseAnalytics, getOrderAnalytics, getUserAnalytics } from '../controllers/analytics.controller'

const analyticsRouter = express.Router()

analyticsRouter.get('/get-user-analytics',isAuthenticated,authorizedRoles("admin"),getUserAnalytics)
analyticsRouter.get('/get-course-analytics',isAuthenticated,authorizedRoles("admin"),getCourseAnalytics)
analyticsRouter.get('/get-order-analytics',isAuthenticated,authorizedRoles("admin"),getOrderAnalytics)

export default analyticsRouter 