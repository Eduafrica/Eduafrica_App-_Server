import mongoose from "mongoose";

const  OrderValidationSchema = new mongoose.Schema({
    email: {
        type: String
    },
    userId: {
        type: String
    },
    amount: {
        type: String
    },
    currency: {
        type: String
    },
    discount: {
        type: Boolean,
        default: false
    },
    discountOff: {
        type: Number,
        default: 0
    },
    payableAmount: {
        type: Number
    },
    courseId: {
        type: String
    },
    courseSlug: {
        type: String
    },
    paymentRefrence: {
        type: String //unique payment refrence
    },
    orderStatus: {
        type: String,
        enum: ['Successful', 'Failed', 'Pending', 'Initiated']
    },
    orderId: {
        type: String //order._id
    },
    orderSlug: {
        type: String //unique order slug
    },
    paid: {
        type: Boolean,
        default: false,
    }
}, 
{ timestamps: true }
)

const OrderValidationModel = mongoose.model('orderValidation', OrderValidationSchema)
export default OrderValidationModel