import express from 'express'
import * as controllers from '../controllers/studentAuth.controllers.js'
import { Protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', controllers.registerUser )
router.post('/login', controllers.login )
router.post('/forgotPassword', controllers.forgotPassword )
router.post('/resetPassword/:resetToken', controllers.resetPassword )

//GET ROUTES
router.post('/getStudentAllCourse', Protect, controllers.getStudentAllCourse )


//PUT ROUTES

export default router