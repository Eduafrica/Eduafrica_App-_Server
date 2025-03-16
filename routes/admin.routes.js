import express from "express";
import * as controllers from '../controllers/admin.controllers.js'
import { AdminProtect, AdminRole } from "../middleware/auth.js";
const router = express.Router()

router.post('/register', controllers.createAdmin)
//router.post('/approveAdmin', controllers.approveAdmin)
router.post('/approveAdmin', AdminProtect, AdminRole(['Admin']), controllers.approveAdmin)
router.post('/siteSetting', AdminProtect, AdminRole(['Admin']), controllers.siteSetting)
router.post('/login', controllers.login)
router.post('/forgotPassword', controllers.forgotPassword)
router.post('/resetPassword/:resetToken', controllers.resetPassword)
router.post('/editProfile', AdminProtect, controllers.editProfile) //auth
router.post('/adminEditStaff', AdminProtect, AdminRole(['Admin']), controllers.adminEditStaff) //auth
router.post('/updatePassword', AdminProtect, controllers.updatePassword) //auth
router.post('/blockAccount', AdminProtect, AdminRole(['Admin']), controllers.blockAccount) //auth
router.post('/unBlockAccount', AdminProtect, AdminRole(['Admin']), controllers.unBlockAccount) //auth
router.post('/deleteAccount', AdminProtect, AdminRole(['Admin']), controllers.deleteAccount) //auth
router.post('/signout', controllers.signout)

//GET ROUTES
router.get('/getAllAdmin', AdminProtect, AdminRole(['Admin']), controllers.getAllAdmin) //auth
router.get('/getAdmin/:_id', AdminProtect, AdminRole(['Admin']), controllers.getAdmin) //auth
router.get('/getSiteSettings', AdminProtect, AdminRole(['Admin']), controllers.getSiteSettings)


//router.post('/clear', controllers.clear)

export default router