import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [ true, 'User ID is required' ]
    },
    orderId: {
        type: String,
        required: [ true, 'Order ID is required' ],
        //unique: [ true, 'Order ID already Exist' ]
    },
    orderID: {
        type: String,
        default: Date.now()
        //required: [ true, 'Order ID is required' ],
        //unique: [ true, 'Order ID already Exist' ]
    },
    amount: {
        type: Number
    },
    discount: {
        type: Boolean,
        default: false
    },
    payableAmount: {
        type: Number
    },
    discountOff: {
        type: Number
    },
    couponCode: {
        type: String
    },
    currency: {
        type: String
    },
    orderStatus: {
        type: String,
        enum: ['Successful', 'Failed', 'Pending', 'Initiated']
    },
    courseId: {
        type: String,
        required: [ true, 'Course ID is required for course bought' ]
    },
    courseSlug: {
        type: String,
        required: [ true, 'Course Slug code is required for course bought' ]
    },
    courseTitle: {
        type: String,
    },
    courseImg: {
        type: String,
    },
    categories: {
        type: Array
    },
    courseInstructor: {
        type: String
    },
    instructorCode: {
        type: String
    },
    paymentRefrence: {
        type: String
    },
    email: {
        type: String,
        required: [ true, ' User email is required' ]
    },
    paid: {
        type: Boolean,
        default: false,
    },
    paymentType: {
        type: String,
        default: 'online',
        enum: ['online', 'offline']
    }
},
{ timestamps: true }
)

const OrderModel = mongoose.model('courseorder', OrderSchema)
export default OrderModel