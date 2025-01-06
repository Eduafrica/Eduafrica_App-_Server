import express from 'express'
import * as controllers from '../controllers/orders.controllers.js'
import { AdminProtect, Protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/newOrder', Protect, controllers.newOrder)
router.post('/updatePaymentStatus', AdminProtect, controllers.updatePaymentStatus)
router.post('/verifyPaymentPaystackWebhook', controllers.verifyPaymentPaystackWebhook)






//GET ROUTES
router.get('/getStudentOrders/:_id',  controllers.getStudentOrders)
router.get('/getOrderStats/:stats', AdminProtect, controllers.getOrderStats)

router.get('/fetchAllOrders', AdminProtect, controllers.fetchAllOrders)
router.get('/fetchOrder/:_id', AdminProtect, controllers.fetchOrder)

router.get('/topSellingCourse/:stats', AdminProtect, controllers.topSellingCourse)



//PUT ROUTES

export default router