import mongoose from "mongoose";

const AiChatSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: [true, 'User with this number already exist']
    },
    history: {
        type: Array
    },
},
{ timestamps: true }
)

const AiChatModel = mongoose.model('Aichat', AiChatSchema)
export default AiChatModel