import mongoose from "mongoose";

const SiteSettingSchema = new mongoose.Schema({ 
    siteImage: {
        type: String
    },
    siteName: {
        type: String
    },
    siteLink: {
        type: String
    },
    siteEmail: {
        type: String
    },
    siteCountry: {
        type: String
    },
    salesPercentage: {
        type: Number
    }
})

const SiteSettingModel = mongoose.model('siteSetting', SiteSettingSchema)
export default SiteSettingModel