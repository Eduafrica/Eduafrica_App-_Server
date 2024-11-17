import mongoose from "mongoose";

const UserChatsWithAiShema = new mongoose.Schema({
    userId: {
        type: String,
        unique: [true, 'User with this number already exist']
    },
    chats: {
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

const UserChatsWithAiModel = mongoose.model('userChatsWithAi', UserChatsWithAiShema)
export default UserChatsWithAiModel