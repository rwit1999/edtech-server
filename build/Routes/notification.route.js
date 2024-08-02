"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const protectRoute_1 = require("../middlewares/protectRoute");
const user_controller_1 = require("../controllers/user.controller");
const notification_controller_1 = require("../controllers/notification.controller");
const notificationRouter = express_1.default.Router();
notificationRouter.get('/get-all-notifications', user_controller_1.updateAccessToken, protectRoute_1.isAuthenticated, (0, protectRoute_1.authorizedRoles)("admin"), notification_controller_1.getNotifications);
notificationRouter.put('/update-notification/:id', user_controller_1.updateAccessToken, protectRoute_1.isAuthenticated, (0, protectRoute_1.authorizedRoles)("admin"), notification_controller_1.updateNotificationStatus);
exports.default = notificationRouter;
