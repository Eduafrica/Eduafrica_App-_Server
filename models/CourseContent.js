import mongoose from "mongoose";

const CourseContentSchema = new mongoose.Schema({
    courseId: {
        type: String,
        required: [ true, 'Cousre Id is required']
    },
    slugCode: {
        type: String,
        unique: [true, 'slug Code must be unique']
        //same with course
    },
    students: {
        type: Array
    },
    sections: [
        {
            sectionTitle: {
                type: String
            },
            overview: {
                type: String
            },
            courseNote: {
                type: String
            },
            assestLink: {
                type: String
            },
            assestType: {
                type: String,
                enum: ['video', 'audio', 'image', 'pdf']
            },
            assignment: {
                type: String,
            },
        }
    ]
},
{ timestamps: true }
)

const CourseContentModel = mongoose.model('CourseContent', CourseContentSchema)
export default CourseContentModel