import express from "express";
import * as controllers from '../controllers/admin.controllers.js'
import { AdminProtect } from "../middleware/auth.js";
const router = express.Router()

router.post('/createAdmin', AdminProtect, controllers.createAdmin) //auth
router.post('/login', controllers.login)
router.post('/forgotPassword', controllers.forgotPassword)
router.post('/resetPassword/:resetToken', controllers.resetPassword)
router.post('/editProfile', AdminProtect, controllers.editProfile) //auth
router.post('/blockAccount', AdminProtect, controllers.blockAccount) //auth
router.post('/unBlockAccount', AdminProtect, controllers.unBlockAccount) //auth
router.post('/deleteAccount', AdminProtect, controllers.deleteAccount) //auth

//GET ROUTES
router.get('/getAllAdmin', AdminProtect, controllers.getAllAdmin) //auth
router.get('/getAdmin', AdminProtect, controllers.getAdmin) //auth

export default router