import { app } from "./app";
import { initSocketServer } from "./socketServer";
import { connectDB } from "./utils/db";
require("dotenv").config()
import {v2 as cloudinary} from 'cloudinary'

import http from 'http'
const server = http.createServer(app)
initSocketServer(server)

//cloudinary config
cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_API_SECRET 
})


server.listen(process.env.PORT,()=>{
    console.log(`Server running on ${process.env.PORT}`);
    connectDB()
})