import mongoose from "mongoose";

const CourseChatSchema = new mongoose.Schema({
    courseSlug: {
        type: String,
        required: [ true, 'Course slug code is required']
    },
    chats: [
        {
            message: {
                type: String
            },
            studentId: {
                type: String
            },
            instructorId: {
                type: String
            },
            studentName: {
                type: String
            },
            instructorName: {
                type: String
            },
            profileImg: {
                type: String
            }
        }
    ]
},
{ timestamps: true }
);

const CourseChatModel = mongoose.model('courseChat', CourseChatSchema);
export default CourseChatModel;