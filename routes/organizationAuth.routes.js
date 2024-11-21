import express from 'express'
import * as controllers from '../controllers/organizationAuth.controllers.js'
import { AdminProtect } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', controllers.registerUser )
router.post('/login', controllers.login )
router.post('/forgotPassword', controllers.forgotPassword )
router.post('/resetPassword/:resetToken', controllers.resetPassword )
router.post('/toggleblock', AdminProtect, controllers.toggleblock)


//GET ROUTES
router.get('/getAllOrganizations', AdminProtect, controllers.getAllOrganizations)
router.get('/getOrganization/:_id', AdminProtect, controllers.getOrganization)


//PUT ROUTES

export default router