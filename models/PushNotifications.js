import mongoose from "mongoose";

const PushNotificationSchema = new mongoose.Schema({
    data: {
        type: Object,
        required: [true, 'Data token is required'],
    },
    name : {
        type: String
    },
    email : {
        type: String
    }
})

const PushNotificationModel = mongoose.model('PushNotification', PushNotificationSchema)
export default PushNotificationModel