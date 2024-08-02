import express from 'express'
import { isAuthenticated ,authorizedRoles} from '../middlewares/protectRoute'
import { createOrder, getAllOrders, newPayment, sendStripePublishableKey } from '../controllers/order.controller'
import { updateAccessToken } from '../controllers/user.controller'


const orderRouter = express.Router()

orderRouter.post('/create-order',updateAccessToken,isAuthenticated,createOrder)
orderRouter.get('/get-all-orders',updateAccessToken,isAuthenticated,authorizedRoles("admin"),getAllOrders)

orderRouter.get('/payment/stripePublishableKey',sendStripePublishableKey)

orderRouter.post('/payment',isAuthenticated,newPayment)

export default orderRouter  