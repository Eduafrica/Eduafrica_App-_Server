import { generateUniqueCode } from "../middleware/utils.js"
import CouponCodeModel from "../models/CouponCode.js"
import CourseModel from "../models/Course.js"

//CREATE NEW COUPON
export async function createCoupon(req, res) {
    const { id, percentageOff, text, maxNumber } = req.body
    if(!id){
        return res.status(404).json({ success: false, data: 'Provide a course id' })
    }
    if(!percentageOff){
        return res.status(404).json({ success: false, data: 'Provide a percentage discount' })
    }
    if(percentageOff < 1 || percentageOff > 100){
        return res.status(404).json({ success: false, data: 'Percentage discount must be between 1 and 100' })
    }
    if(!maxNumber){
        return res.status(404).json({ success: false, data: 'Provide a maximium number of students' })
    }
    try {
        const getCourse = await CourseModel.findById({ _id: id })
        if(!getCourse){
            return res.status(404).json({ success: false, data: 'Course with this Id does not exist'})
        }
        const getCode = await generateUniqueCode(4)
        const couponCode = `COUP${getCode}EA`
        console.log('coupon code', couponCode)

        const newCoupon = await CouponCodeModel.create({
            code: couponCode, percentageOff, text, maxNumber, courseId: getCourse?._id, courseSlug: getCourse?.slugCode 
        })

        res.status(201).json({ success: true, data: 'Coupon code created' })
    } catch (error) {
        console.log('UNABLE TO CREATE COUPON CODE', error)
        res.status(500).json({ success: false, data: 'Unable to create coupon code' })
    }    
}

//UPDATE COUPON CODE
export async function updateCoupon(req, res) {
    const { _id, percentageOff, text, maxNumber, active } = req.body
    try {
        const getcouponCode = await CouponCodeModel.findById({ _id: _id })
        if(!getcouponCode){
            return res.status(404).json({ success: false, data: 'Coupon code with this Id does not exist'})
        }

        const editCoupon = await CouponCodeModel.findByIdAndUpdate(
            _id, {
                percentageOff,
                text,
                maxNumber,
                active
            },
            { new: true }
        )


        res.status(201).json({ success: true, data: 'Coupon code updated' })
    } catch (error) {
        console.log('UNABLE TO UPDATE COUPON CODE', error)
        res.status(500).json({ success: false, data: 'Unable to update coupon code' })
    }    
}

//DELETE COUPON CODE
export async function deleteCouponCode(req, res) {
    const { id } = req.body
    if(!id){
        return res.status(404).json({ success: false, data: 'Provide a id' })
    }
    try {
        const deleteCouponCode = await CouponCodeModel.findByIdAndDelete({ _id: id })

        res.status(200).json({ success: true, data: 'Coupon Code deleted succesful' })
    } catch (error) {
        console.log('UNABLE TO DELETE COUPON CODE', error)
        res.status(500).json({ success: false, data: 'Unable to delete coupon code' })
    }
}

//GET ALL COUPON CODE OF A COURSE
export async function getCoupons(req, res) {
    const { id } = req.params
    try {
        const couponCodes = await CouponCodeModel.find({ courseId: id })

        res.status(200).json({ success: true, data: couponCodes })
    } catch (error) {
        console.log('UNABLE TO GET COUPON CODES', error)
        res.status(200).json({ success: false, data: 'Unable to get all coupon of course' })
    }
}

//GET A COUPON CODE
export async function getCouponCode(req, res) {
    const { id } = req.params
    try {
        const couponCode = await CouponCodeModel.findById({ _id: id })

        res.status(200).json({ success: true, data: couponCode })
    } catch (error) {
        console.log('UNABLE TO GET COUPON CODES', error)
        res.status(200).json({ success: false, data: 'Unable to get all coupon of course' })
    }
}