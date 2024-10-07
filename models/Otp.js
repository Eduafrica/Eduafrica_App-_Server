import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema({
    userId: {
        type: String
    },
    code: {
        type: Number
    },
    createdAt:{
        type: Date,
        default: Date.now(),
        expires: 3600 //1Hour
    }

},
    { timestamps: true }
)

const OtpModel = mongoose.model('otp', OtpSchema)
export default OtpModel