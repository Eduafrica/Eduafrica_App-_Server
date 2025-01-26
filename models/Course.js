import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Course title is required']
    },
    about: {
        type: String,
        required: [true, 'Course about is required']
    },
    overview: {
        type: String
    },
    syllabus: [
        {
            period: {
                type: String,
            },
            mileStone: [
                {
                    progress: {
                        type: String,
                    }
                }
            ]
        }
    ],
    instructorName: {
        type: String,
        required: [true, 'Instructors Name is Required']
    },
    instructorEmail: {
        type: String,
        required: [true, 'Instructors Email is Required']
    },
    instructorId: {
        type: String,
        required: [true, 'Instructors ID is required']
    },
    instructorImg: {
        type: String
    },
    category: {
        type: Array,
        required: [true, 'At least one category is required']
    },
    slugCode: {
        type: String,
        unique: [true, 'slug Code must be unique']
    },
    price: {
        type: Number,
        required: [true, 'Course Price is required']
    },
    priceCurrency: {
        type: String,
        default: 'NGN'
    },
    isDiscountAllowed: {
        type: Boolean,
        default: false
    },
    discountPercentage: {
        type: Number
    },
    coverImage: {
        type: String,
    },
    students: {
        type: Array
    },
    studentsTotal: {
        type: Number,
        default: 0
    },
    ratings: [{
        userName: {
            type: String
        },
        userId: {
            type: String
        },
        rateNumber: {
            type: Number
        },
        comment:{
            type: String
        }
    }],
    studentLevel: {
        type: String,
        enum: [ 'Beginner', 'Intermediate', 'Advanced']
    },
    skillsToGain: {
        type: Array
    },
    language: {
        type: String
    },
    faq: [
        {
            question: {
                type: String,
            },
            answer: {
                type: String
            }
        }
    ],
    keyWords: {
        type: Array
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    active: {
        type: Boolean,
        default: true
    },
    approved: {
        type: String,
        default: 'No Request',
        enum: ['Approved', 'Pending', 'No Request', 'Rejected']
    },
},
{timestamps: true}
)

const CourseModel = mongoose.model('course', CourseSchema)
export default CourseModel