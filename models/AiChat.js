import mongoose from "mongoose";

const AiChatSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: [true, 'User with this number already exist']
    },
    history: {
        type: Array
    },
    expiresAt: { 
        type: Date,
        default: undefined,
        expires: 0 
    }
},
{ timestamps: true }
)

const AiChatModel = mongoose.model('Aichat', AiChatSchema)
export default AiChatModel