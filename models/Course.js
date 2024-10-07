import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Course title is required']
    },
    about: {
        type: String,
        required: [true, 'Course title is required']
    },
    overview: {
        type: String
    },
    instructorName: {
        type: String,
        required: [true, 'Instructors Name is Required']
    },
    instructorId: {
        type: String,
        required: [true, 'Instructors ID is required']
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
        type: Number
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
    }
    ],
    studentLevel: {
        type: String,
        enum: [ 'Beginners', 'Intermediate', 'Advanced']
    },
    skillsToGain: {
        type: Array
    },
    language: {
        type: String
    },

},
{timestamps: true}
)

const CourseModel = mongoose.model('course', CourseSchema)
export default CourseModel