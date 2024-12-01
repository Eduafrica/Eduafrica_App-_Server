import express from 'express'
import * as controllers from '../controllers/couponCode.controllers.js'
import { AdminProtect, AdminRole } from '../middleware/auth.js'

const router = express.Router()


//POST
router.post('/createCoupon', AdminProtect, AdminRole(['Admin']), controllers.createCoupon)



//PUT ROUTES

export default router
