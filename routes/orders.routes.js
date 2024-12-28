import express from 'express'
import * as controllers from '../controllers/orders.controllers.js'
import { AdminProtect } from '../middleware/auth.js'

const router = express.Router()

router.post('/new', controllers.newOrder)

//GET ROUTES
router.get('/getStudentOrders/:_id',  controllers.getStudentOrders)
router.get('/getOrderStats/:stats', AdminProtect, controllers.getOrderStats)

router.get('/fetchAllOrders', AdminProtect, controllers.fetchAllOrders)
router.get('/fetchOrder/:_id', AdminProtect, controllers.fetchOrder)




//PUT ROUTES

export default router