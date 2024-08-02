"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newOrder = void 0;
const catchAsyncError_1 = require("../middlewares/catchAsyncError");
const orderModel_1 = __importDefault(require("../models/orderModel"));
//create new order
exports.newOrder = (0, catchAsyncError_1.CatchAsyncError)(async (data, res) => {
    const order = await orderModel_1.default.create(data);
});
