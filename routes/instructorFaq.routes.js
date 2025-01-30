import express from 'express'
import * as controllers from '../controllers/instructorFaq.controllers.js'
import { AdminProtect, Protect, UserRole } from '../middleware/auth.js'

const router = express.Router()

//POST
router.post('/newFaq', Protect, UserRole(['instructor', 'organization']), controllers.newFaq)
router.post('/updateFaq', Protect, UserRole(['instructor', 'organization']), controllers.updateFaq)
router.post('/deleteFaq', Protect, UserRole(['instructor', 'organization']), controllers.deleteFaq)

//GET ROUTES
router.get('/getFaq/:instructorID', controllers.getFaq)
router.get('/getAFaq/:instructorID/:faqId', controllers.getAFaq)



//PUT ROUTES

export default router
