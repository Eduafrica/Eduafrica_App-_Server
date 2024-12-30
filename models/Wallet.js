import mongoose from "mongoose";

const WalletSchema = new mongoose.Schema({
    orderId: {
        type: String
    },
    amount: {
        type: Number
    },
    note: {
        type: String
    }
},
{ timestamps: true }
)

const WalletModel = mongoose.model('wallet', WalletSchema)
export default WalletModel