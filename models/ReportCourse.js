import mongoose from "mongoose";

const ReportCourseSchema = new mongoose.Schema({
    messsage: {
        type: String
    },
    userName: {
        type: String
    },
    email: {
        type: String
    },
    userId: {
        type: String
    }
})

const ReportCourseModel = mongoose.model('reportCourse', ReportCourseSchema)
export default ReportCourseModel