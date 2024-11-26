import mongoose from "mongoose";

const CmsSchema = new mongoose.Schema({
    title: {
        type: String
    },
    message: {
        type: String
    },
    type: {
        type: String
    },
    status: {
        type: String
    },
    image: {
        type: String
    },
    scheduled: {
        type: Boolean,
        default: false
    }, //true if scheduled
    users: {
        type: Array
    },//users ID
    allUsers: {
        type: Boolean,
    }
},
{ timestamps: true }
)

const CmsModel = mongoose.model('cms', CmsSchema)
export default CmsModel