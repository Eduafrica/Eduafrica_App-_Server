import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [ true, 'User ID is required' ]
    },
    orderID: {
        type: String,
        required: [ true, 'Order ID is required' ],
        unique: [ true, 'Order ID already Exist' ]
    },
    amount: {
        type: Number
    },
    currency: {
        type: String
    },
    orderStatus: {
        type: String,
        enum: ['Successful', 'Failed', 'Pending', 'Inactive']
    },
    courseId: {
        type: String,
        required: [ true, 'Course ID is required for course bought' ]
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
    email: {
        type: String,
        required: [ true, ' User email is required' ]
    }
},
{ timestamps: true }
)

const OrderModel = mongoose.model('courseorder', OrderSchema)
export default OrderModel