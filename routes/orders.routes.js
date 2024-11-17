import express from 'express'
import * as controllers from '../controllers/orders.controllers.js'

const router = express.Router()

router.post('/new', controllers.newOrder)

//GET ROUTES
router.get('/getStudentOrders/:_id',  controllers.getStudentOrders)



//PUT ROUTES

export default router