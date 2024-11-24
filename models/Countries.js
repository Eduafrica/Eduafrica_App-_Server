import mongoose from "mongoose";

const CountrySchema = new mongoose.Schema({
    image: {
        type: String
    },
    country: {
        type: String
    },
    currency: {
        type: String
    },
    slug: {
        type: String
    }
})

const CountryModel = new mongoose.model('countrie', CountrySchema)
export default CountryModel