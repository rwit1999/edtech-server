"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const protectRoute_1 = require("../middlewares/protectRoute");
const layout_controller_1 = require("../controllers/layout.controller");
const user_controller_1 = require("../controllers/user.controller");
const layoutRouter = express_1.default.Router();
layoutRouter.post('/create-layout', user_controller_1.updateAccessToken, protectRoute_1.isAuthenticated, (0, protectRoute_1.authorizedRoles)("admin"), layout_controller_1.createLayout);
layoutRouter.put('/edit-layout', user_controller_1.updateAccessToken, protectRoute_1.isAuthenticated, (0, protectRoute_1.authorizedRoles)("admin"), layout_controller_1.editLayout);
layoutRouter.get('/get-layout', layout_controller_1.getLayout);
exports.default = layoutRouter;
