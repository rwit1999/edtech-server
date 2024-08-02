import express from 'express'
import { activateUser, addAdmin, deleteUser, getAllUsers, getUserInfo, loginUser, logoutUser, registerUser, socialAuth, updateAccessToken, updatePassword, updateProfilePicture, updateUserInfo, updateUserRole } from '../controllers/user.controller'
import { authorizedRoles, isAuthenticated } from '../middlewares/protectRoute'

const userRouter = express.Router()

userRouter.post('/register',registerUser)
userRouter.post('/activate-user',activateUser)
userRouter.post('/add-admin',updateAccessToken,isAuthenticated,authorizedRoles("admin"),addAdmin)
userRouter.post('/login',loginUser)
userRouter.get('/logout',updateAccessToken,isAuthenticated,logoutUser)
userRouter.post('/social-auth',socialAuth)

userRouter.get('/refresh-token',isAuthenticated,updateAccessToken)
userRouter.get('/me',updateAccessToken,isAuthenticated,getUserInfo)
userRouter.get('/get-all-users',updateAccessToken,isAuthenticated,authorizedRoles("admin"),getAllUsers)

userRouter.put('/update-user-info',updateAccessToken,isAuthenticated,updateUserInfo)
userRouter.put('/update-password',updateAccessToken,isAuthenticated,updatePassword )
userRouter.put('/update-profile-picture',updateAccessToken,isAuthenticated,updateProfilePicture )
userRouter.put('/update-user-role',updateAccessToken,isAuthenticated,authorizedRoles("admin"),updateUserRole )

userRouter.delete('/delete-user/:id',updateAccessToken,isAuthenticated,authorizedRoles("admin"),deleteUser )

export default userRouter