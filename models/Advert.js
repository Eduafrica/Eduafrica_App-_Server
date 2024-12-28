import mongoose from "mongoose";

const AdvertSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [ true, 'Advert name is required' ]
    },
    type: {
        type: String
    },
    destination: {
        type: String
    },
    image: {
        type: String
    },
    organizationUrl: {
        type: String
    },
    startDate: {
        type: String
    },
    endDate: {
        type: String
    },
    advertType:{
        type: String,
        required: [ true, 'Advert Type is required' ],
        enum: [ 'banner', 'recommendation']
    }
},
{ timestamps: true }
)

const AdvertModel = mongoose.model('advert', AdvertSchema)
export default AdvertModel