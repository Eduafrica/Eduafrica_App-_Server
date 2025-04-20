import express from 'express'
import * as controllers from '../controllers/pushNotification.controllers.js'
import { Protect, UserRole } from '../middleware/auth.js'

const router = express.Router()

//POST
router.post('/saveSubscription', Protect, UserRole(['student', 'instructor', 'organization']), controllers.saveSubscription)

//GET ROUTES
router.get('/sendNotification', controllers.sendNotification)

//PUT ROUTES

export default router
