import mongoose from "mongoose";

const CourseCategorySchema = new mongoose.Schema({
    category: {
        type: String,
        required: [ true, 'category is required' ]
    },
    slug: {
        type: String
    }

},
{ timestamps: true }
)

const CourseCategoryModel = mongoose.model('CourseCategory', CourseCategorySchema)
export default CourseCategoryModel