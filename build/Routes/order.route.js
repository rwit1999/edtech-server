"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const protectRoute_1 = require("../middlewares/protectRoute");
const order_controller_1 = require("../controllers/order.controller");
const user_controller_1 = require("../controllers/user.controller");
const orderRouter = express_1.default.Router();
orderRouter.post('/create-order', user_controller_1.updateAccessToken, protectRoute_1.isAuthenticated, order_controller_1.createOrder);
orderRouter.get('/get-all-orders', user_controller_1.updateAccessToken, protectRoute_1.isAuthenticated, (0, protectRoute_1.authorizedRoles)("admin"), order_controller_1.getAllOrders);
orderRouter.get('/payment/stripePublishableKey', order_controller_1.sendStripePublishableKey);
orderRouter.post('/payment', protectRoute_1.isAuthenticated, order_controller_1.newPayment);
exports.default = orderRouter;
