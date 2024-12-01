import mongoose from "mongoose";

const CouponCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [ true, 'A coupon code is required' ],
        unique: [ true, 'Code already exist' ]
    },
    active: {
        type: Boolean,
        default: true
    },
    percentageOff: {
        type: Number,
        required: [ true, 'Provide a percentage discount']
    },
    text: {
        type: String
    },
    maxNumber: {
        type: Number //Max number of student
    },
    students: {
        type: Array
    },
    courseId: {
        type: String,
        required: [ true, 'Course id required']
    },
    courseSlug: {
        type: String,
        required: [ true, 'Course slug required']
    }
},
{ timestamps: true }
)

const CouponCodeModel = mongoose.model('couponCode', CouponCodeSchema)
export default CouponCodeModel