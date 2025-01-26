import express from 'express'
import * as controllers from '../controllers/payout.controllers.js'
import { AdminProtect, Protect, UserRole } from '../middleware/auth.js'

const router = express.Router()

//POST
router.post('/newPayoutRequest', Protect, UserRole(['instructor', 'organization']), controllers.newPayoutRequest)
router.post('/approvedPayoutRequest', AdminProtect, controllers.approvedPayoutRequest)
router.post('/rejectPayoutRequest', AdminProtect, controllers.rejectPayoutRequest)


//GET ROUTES
router.get('/getPayoutRequest', AdminProtect, controllers.getPayoutRequest)
router.get('/getAPayoutRequest/:_id', AdminProtect, controllers.getAPayoutRequest)
router.get('/getInstructorPayoutRequest', Protect, UserRole(['instructor', 'organization']), controllers.getInstructorPayoutRequest)
router.get('/getAInstructorPayoutRequest/:_id', Protect, UserRole(['instructor', 'organization']), controllers.getAInstructorPayoutRequest)



//PUT ROUTES

export default router
