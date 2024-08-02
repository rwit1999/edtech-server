"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = void 0;
const redis_1 = require("../utils/redis");
//get user By id
const getUserById = async (id, res) => {
    const userJson = await redis_1.redis.get(id);
    if (userJson) {
        const user = JSON.parse(userJson);
        res.status(201).json({
            success: 'true',
            user
        });
    }
};
exports.getUserById = getUserById;
