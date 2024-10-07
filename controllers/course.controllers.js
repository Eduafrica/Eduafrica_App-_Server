import CourseModel from "../models/Course.js"
import CourseCategoryModel from "../models/CourseCategories.js"

//CREATE NEW COURSE INFO
export async function newCourse(req, res) {
    const { _id, email, firstName, lastName } = req.user
    const { title, about, desc, overview, category, price, isDiscountAllowed, discountPercentage, coverImage, studentLevel, skillsToGain, language } = req.body
    try {
        if(!title || !about || overview || price || category?.length < 1 || coverImage || studentLevel || skillsToGain?.length < 1 || language){
            return res.status(400).json({ success: false, data: 'Fill all required fields'})
        }

        const makeNewCourse = await CourseModel.create({
            title, about, desc, instructorName: `${firstName} ${lastName}`, instructorId: _id, overview, category, price, isDiscountAllowed, discountPercentage, coverImage, studentLevel, skillsToGain, language
        })

        res.status(201).json({ success: true, data: 'Cousre created successfull', courseId: makeNewCourse._id })
    } catch (error) {
        console.log('UNABLE TO CREATE A NEW CREATE NEW COURSE', error)
        res.status(500).json({ success: false, data: 'Unable to create new course'})
    }
}

//UPDATE COURSE INFO
export async function updateCourse(req, res) {
    const { _id, title, about, desc, overview, category, price, isDiscountAllowed, discountPercentage, coverImage, studentLevel, skillsToGain, language } = req.body
    try {
        const findCourse = await CourseModel.findByIdAndUpdate(
            _id, 
            {
                $set: {
                    title, about, desc, overview, category, price, isDiscountAllowed, discountPercentage, coverImage, studentLevel, skillsToGain, language
                }
            },
            { new: true }
        )     

        return res.status(200).json({ success: true, data: findCourse })
    } catch (error) {
        console.log('UNABLE TO CREATE A NEW CREATE NEW COURSE', error)
        res.status(500).json({ success: false, data: 'Unable to create new course'})
    }
}

//GET ALL COURSE
export async function getAllCourse(req, res) {
    
    try {
        const allCourses = await CourseModel.find()

        res.status(200).json({ success: false, data: allCourses })
    } catch (error) {
        console.log('UNABLE TO GET ALL COURSE', error)
        res.status(500).json({ success: false, data: 'Unable to get all course'})
    }
}

//GET ALL COURSE CATEGORIES
export async function getAllCourseCategories(req, res) {
    try {
        const categories = await CourseCategoryModel.find()

        res.status(200).json({ success: true, data: categories })
    } catch (error) {
        console.log('UNABLE TO GET ALL COURSE', error)
        res.status(500).json({ success: false, data: 'Unable to get all course'})
    }
}

//GET COURSE BY CATEGORY
export async function getCourseByCategory(req, res) {
    const { category } = req.params
    try {
        
    } catch (error) {
        console.log('UNABLE TO GET COURSE BY PARAMS', error)
        res.status(500).json({ success: false, data: 'Unable to get courses with this category' })
    }
}

//CREATE A NEW CATEGORY
export async function newCategory(req, res) {
    const { category } = req.body
    try {
        if(!category){
            return res.status(400).json({ success: false, data: 'Category is Needed' })
        }
        const slugValue = category.replace(/\s+/g, '').toLowerCase();

        const makeNewCategory = await CourseCategoryModel.create({
            category, slug: slugValue
        })

        res.status(201).json({ success: true, data: `${makeNewCategory.category} category has been added` })
    } catch (error) {
        console.log('UNABLE TO CREATE NEW CATEGORY', error)
        res.status(500).json({ success: false, data: 'Failed to create new category' })
    }
}

//GET COURSE BY PARAMS
export async function getCourseByParams(req, res) {
    const {} = req.params
    try {
        
    } catch (error) {
        
    }
}