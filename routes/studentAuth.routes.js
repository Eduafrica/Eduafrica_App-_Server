import express from 'express'
import * as controllers from '../controllers/studentAuth.controllers.js'
import { AdminProtect, Protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/verifyStudentDetails', controllers.verifyStudentDetails )
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
router.post('/toggleblock', AdminProtect, controllers.toggleblock)


//GET ROUTES
router.get('/getStudentAllCourse', Protect, controllers.getStudentAllCourse )

router.get('/getAllStudent', AdminProtect, controllers.getAllStudent)
router.get('/getStudent/:_id', AdminProtect, controllers.getStudent)
router.get('/getStudentStats/:stats', AdminProtect, controllers.getStudentStats)
//PUT ROUTES

export default router