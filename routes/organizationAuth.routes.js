import express from 'express'
import * as controllers from '../controllers/organizationAuth.controllers.js'
import { AdminProtect, Protect, UserRole } from '../middleware/auth.js'

const router = express.Router()

router.post('/verifyOrganizationDetails', controllers.verifyOrganizationDetails)
router.post('/register', controllers.registerUser )
router.post('/login', controllers.login )
router.post('/googleSignin', controllers.googleSignin )
router.post('/forgotPassword', controllers.forgotPassword )
router.post('/resetPassword/:resetToken', controllers.resetPassword )
router.post('/toggleblock', AdminProtect, controllers.toggleblock)
router.post('/newInstructor', Protect, UserRole(['organization']), controllers.newInstructor)
router.post('/updateInstructor', Protect, UserRole(['organization']), controllers.updateInstructor)
router.post('/deleteInstructor', Protect, UserRole(['organization']), controllers.deleteInstructor)


//GET ROUTES
router.get('/getAllOrganizations', AdminProtect, controllers.getAllOrganizations)
router.get('/getOrganization/:_id', AdminProtect, controllers.getOrganization)
router.get('/getOrganizationStats/:stats', AdminProtect, controllers.getOrganizationStats)
router.get('/getOrganizationProfile', Protect, controllers.getOrganizationProfile)

router.get('/getInstructor/:organisationID', controllers.getInstructor)
router.get('/getAInstructor/:organisationID/:instructorID', controllers.getAInstructor)





//PUT ROUTES

export default router