import express from 'express'
import * as controllers from '../controllers/instructorsAuth.controllers.js'
import { AdminProtect, Protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/verifyInstructorDetails', controllers.verifyInstructorDetails )
router.post('/register', controllers.registerUser )
router.post('/resendOtp', controllers.resendOtp )
router.post('/googleSignin', controllers.googleSignin )
router.post('/login', controllers.login )
router.post('/forgotPassword', controllers.forgotPassword )
router.post('/resetPassword/:resetToken', controllers.resetPassword )
router.post('/updateProfile', Protect, controllers.updateProfile )
router.post('/toggleblock', AdminProtect, controllers.toggleblock)

//GET ROUTES
router.get('/getAllInstructor', AdminProtect, controllers.getAllInstructor)
router.get('/getInstructor/:_id', AdminProtect, controllers.getInstructor)
router.get('/getInstructorStats/:stats', AdminProtect, controllers.getInstructorStats)
router.post('/getInstructorProfile', Protect, controllers.getInstructorProfile )


//PUT ROUTES

export default router