import express from 'express'
import { isAuthenticated ,authorizedRoles} from '../middlewares/protectRoute'
import { getNotifications, updateNotificationStatus } from '../controllers/notification.controller'
import { createLayout, editLayout, getLayout } from '../controllers/layout.controller'
import { updateAccessToken } from '../controllers/user.controller'

const layoutRouter = express.Router()

layoutRouter.post('/create-layout',updateAccessToken,isAuthenticated,authorizedRoles("admin"),createLayout)
layoutRouter.put('/edit-layout',updateAccessToken,isAuthenticated,authorizedRoles("admin"),editLayout)
layoutRouter.get('/get-layout',getLayout)  

export default layoutRouter 