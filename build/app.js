"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require('dotenv').config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
exports.app = (0, express_1.default)();
const error_1 = require("./middlewares/error");
const user_route_1 = __importDefault(require("./Routes/user.route"));
const course_route_1 = __importDefault(require("./Routes/course.route"));
const order_route_1 = __importDefault(require("./Routes/order.route"));
const notification_route_1 = __importDefault(require("./Routes/notification.route"));
const analytics_route_1 = __importDefault(require("./Routes/analytics.route"));
const layout_route_1 = __importDefault(require("./Routes/layout.route"));
exports.app.use(express_1.default.json({ limit: '50mb' })); //this is body parser
exports.app.use((0, cookie_parser_1.default)());
const allowedOrigins = ['https://edtech-client-six.vercel.app'];
exports.app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // Allow credentials
}));
exports.app.use('/api/v1', user_route_1.default);
exports.app.use('/api/v1', course_route_1.default);
exports.app.use('/api/v1', order_route_1.default);
exports.app.use('/api/v1', notification_route_1.default);
exports.app.use('/api/v1', analytics_route_1.default);
exports.app.use('/api/v1', layout_route_1.default);
exports.app.get('/test', (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "API is working"
    });
});
exports.app.get('*', (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found`);
    err.statusCode = 404;
    next(err);
});
exports.app.use(error_1.ErrorMiddleware);
