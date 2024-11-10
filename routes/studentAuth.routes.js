import express from 'express'
import * as controllers from '../controllers/studentAuth.controllers.js'
import { Protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', controllers.registerUser )
router.post('/login', controllers.login )
router.post('/forgotPassword', controllers.forgotPassword )
router.post('/resetPassword/:resetToken', controllers.resetPassword )
router.post('/updateProfile', Protect, controllers.updateProfile )
router.post('/newPaymentCard', Protect, controllers.newPaymentCard )
router.post('/updatePaymentCard', Protect, controllers.updatePaymentCard )
router.post('/deletePaymentCard', Protect, controllers.deletePaymentCard )
router.post('/setLearningReminder', Protect, controllers.setLearningReminder )
router.post('/deleteLearningReminder', Protect, controllers.deleteLearningReminder )



//GET ROUTES
router.get('/getStudentAllCourse', Protect, controllers.getStudentAllCourse )


//PUT ROUTES

export default router