import mongoose from "mongoose";

const CourseContentSchema = new mongoose.Schema({
    courseId: {
        type: String,
        required: [ true, 'Cousre Id is required']
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