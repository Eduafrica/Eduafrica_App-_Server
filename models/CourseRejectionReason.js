import mongoose from "mongoose";

const CourseRejectionSchema = new mongoose.Schema({
    courseId: {
        type: String,
    },
    reasons: [
        {
            reason: {
                type: String
            }
        }
    ]
})

const CourseRejectionModel = mongoose.model('courseRejection', CourseRejectionSchema)
export default CourseRejectionModel