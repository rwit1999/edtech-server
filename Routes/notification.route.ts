import express from 'express'
import { isAuthenticated ,authorizedRoles} from '../middlewares/protectRoute'

import { updateAccessToken } from '../controllers/user.controller'
import { getNotifications, updateNotificationStatus } from '../controllers/notification.controller'

const notificationRouter = express.Router()

notificationRouter.get('/get-all-notifications',updateAccessToken,isAuthenticated,authorizedRoles("admin"),getNotifications)

notificationRouter.put('/update-notification/:id',updateAccessToken,isAuthenticated,authorizedRoles("admin"),updateNotificationStatus)

export default notificationRouter 