import express from 'express'
import * as controllers from '../controllers/organizationAuth.controllers.js'
import { AdminProtect, Protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/verifyOrganizationDetails', controllers.verifyOrganizationDetails)
router.post('/register', controllers.registerUser )
router.post('/login', controllers.login )
router.post('/googleSignin', controllers.googleSignin )
router.post('/forgotPassword', controllers.forgotPassword )
router.post('/resetPassword/:resetToken', controllers.resetPassword )
router.post('/toggleblock', AdminProtect, controllers.toggleblock)


//GET ROUTES
router.get('/getAllOrganizations', AdminProtect, controllers.getAllOrganizations)
router.get('/getOrganization/:_id', AdminProtect, controllers.getOrganization)
router.get('/getOrganizationStats/:stats', AdminProtect, controllers.getOrganizationStats)
router.get('/getOrganizationProfile', Protect, controllers.getOrganizationProfile)




//PUT ROUTES

export default router