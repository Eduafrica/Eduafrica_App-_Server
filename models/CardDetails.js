import mongoose from "mongoose";
import bcryptjs from 'bcryptjs';

const CardDetailsSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    card: [
        {
            cardType: {
                type: String
            },
            cardNumber: {
                type: String
            },
            cardName: {
                type: String
            },
            expiryDate: {
                type: String
            },
            cvv: {
                type: String
            },
            defaultCard: {
                type: Boolean,
                default: false
            },
            timeStamp: {
                type: Date,
                default: Date.now  // Automatically set the timeStamp to the current date/time when the card is created
            }
        }
    ]
}, 
{ timestamps: true }  // Global timestamps for the entire document (createdAt, updatedAt)
);

CardDetailsSchema.pre('save', async function(next) {
    if (!this.isModified('cardNumber')) {
        return next();
    }
  
    try {
        const salt = await bcryptjs.genSalt(10);
        this.cardNumber = await bcryptjs.hash(this.cardNumber, salt);
        next();
    } catch (error) {
        next(error);
    }
});

CardDetailsSchema.methods.matchCardNumber = async function(cardNumber) {
    return await bcryptjs.compare(cardNumber, this.cardNumber);
}

CardDetailsSchema.pre('save', async function(next) {
    if (!this.isModified('cvv')) {
        return next();
    }
  
    try {
        const salt = await bcryptjs.genSalt(10);
        this.cvv = await bcryptjs.hash(this.cvv, salt);
        next();
    } catch (error) {
        next(error);
    }
});

CardDetailsSchema.methods.matchCvv = async function(cvv) {
    return await bcryptjs.compare(cvv, this.cvv);
}

const CardDeatilsModel = mongoose.model('cardDetails', CardDetailsSchema);
export default CardDeatilsModel;
