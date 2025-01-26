import express from 'express'
import * as controllers from '../controllers/payout.controllers.js'

const router = express.Router()

//POST
router.post('/newPayoutRequest', controllers.newPayoutRequest)
router.post('/approvedPayoutRequest', controllers.approvedPayoutRequest)
router.post('/rejectPayoutRequest', controllers.rejectPayoutRequest)


//GET ROUTES
router.get('/getPayoutRequest', controllers.getPayoutRequest)
router.get('/getAPayoutRequest', controllers.getAPayoutRequest)



//PUT ROUTES

export default router
