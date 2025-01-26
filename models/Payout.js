import mongoose from "mongoose";

const PayoutSchema = new mongoose.Schema({
    instructorId: {
        type: String,
        required: [ true, 'Instructor Id is required']
    },
    amount: {
        type: Number,
        required: [ true, 'Payout amount is required' ]
    },
    bankName: {
        type: String
    },
    accountName: {
        type: String
    },
    accountNumber: {
        type: String
    },
    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Approved', 'Rejected']
    }
},
{ timestamps: true }
)

const PayoutModel = mongoose.model('payout', PayoutSchema)
export default PayoutModel