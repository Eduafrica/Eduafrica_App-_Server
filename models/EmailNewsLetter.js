import mongoose from "mongoose";

const EmailNewsLetterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [ true, 'Email address is required' ]
    },
    accountType: {
        type: String
    }
})

const EmailNewsLetterModel = mongoose.model('EmailNewsLetterModel', EmailNewsLetterSchema)
export default EmailNewsLetterModel