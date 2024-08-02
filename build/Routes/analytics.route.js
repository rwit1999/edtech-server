"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const protectRoute_1 = require("../middlewares/protectRoute");
const analytics_controller_1 = require("../controllers/analytics.controller");
const analyticsRouter = express_1.default.Router();
analyticsRouter.get('/get-user-analytics', protectRoute_1.isAuthenticated, (0, protectRoute_1.authorizedRoles)("admin"), analytics_controller_1.getUserAnalytics);
analyticsRouter.get('/get-course-analytics', protectRoute_1.isAuthenticated, (0, protectRoute_1.authorizedRoles)("admin"), analytics_controller_1.getCourseAnalytics);
analyticsRouter.get('/get-order-analytics', protectRoute_1.isAuthenticated, (0, protectRoute_1.authorizedRoles)("admin"), analytics_controller_1.getOrderAnalytics);
exports.default = analyticsRouter;
