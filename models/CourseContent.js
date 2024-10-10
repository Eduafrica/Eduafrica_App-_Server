import mongoose from "mongoose";

const CourseContentSchema = new mongoose.Schema({
    courseId: {
        type: String,
        required: [ true, 'Cousre Id is required']
    },
    slugCode: {
        type: String,
        unique: [true, 'slug Code must be unique']
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
            assest: [
                {
                    assestLink: {
                        type: String
                    },
                    assestType: {
                        type: String
                    }
                } 
            ],
            assignment: {
                
            }
        }
    ]
},
{ timestamps: true }
)

const CourseContentModel = mongoose.model('CourseContent', CourseContentSchema)
export default CourseContentModel