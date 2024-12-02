import express from 'express'
import * as controllers from '../controllers/couponCode.controllers.js'
import { AdminProtect, AdminRole } from '../middleware/auth.js'

const router = express.Router()


//POST
router.post('/createCoupon', AdminProtect, AdminRole(['Admin']), controllers.createCoupon)
router.post('/updateCoupon', AdminProtect, AdminRole(['Admin']), controllers.updateCoupon)
router.post('/deleteCouponCode', AdminProtect, AdminRole(['Admin']), controllers.deleteCouponCode)


//GET ROUTES
router.get('/getCoupons/:id', controllers.getCoupons)//all coupon code of a course
router.get('/getCouponCode/:_id', controllers.getCouponCode) //specific coupon code with _id


//PUT ROUTES

export default router
