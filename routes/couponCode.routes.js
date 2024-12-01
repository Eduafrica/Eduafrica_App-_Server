import express from 'express'
import * as controllers from '../controllers/couponCode.controllers.js'
import { AdminProtect, AdminRole } from '../middleware/auth.js'

const router = express.Router()


//POST
router.post('/createCoupon', AdminProtect, AdminRole(['Admin']), controllers.createCoupon)
router.post('/updateCoupon', AdminProtect, AdminRole(['Admin']), controllers.updateCoupon)
router.post('/deleteCouponCode', AdminProtect, AdminRole(['Admin']), controllers.deleteCouponCode)


//GET ROUTES
router.post('/getCoupons/:id', controllers.getCoupons)
router.post('/getCouponCode/:id', controllers.getCouponCode)


//PUT ROUTES

export default router
