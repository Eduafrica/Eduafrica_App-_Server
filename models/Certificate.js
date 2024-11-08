import mongoose from "mongoose";

const CertifcateSchema = new mongoose.Schema({
    studentID: {
        type: String,
        required: [true, 'Student ID is required']
    },
    certicifacates: [
        {

        }
    ]
},
{ timestamps: true}
)

const CertifcateModel = mongoose.model('certificates', CertifcateSchema)
export default CertifcateModel