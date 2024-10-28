import { generateUniqueCode } from "../middleware/utils.js"
import CourseModel from "../models/Course.js"
import CourseCategoryModel from "../models/CourseCategories.js"

//CREATE NEW COURSE INFO
export async function newCourse(req, res) {
    req.user= {
        firstName: 'Sam',
        lastName: 'Dave',
        email: 'samdave40@gmail.com',
        _id: '12344'
    }
    const { _id, email, firstName, lastName } = req.user
    const { title, about, desc, overview, category, price, isDiscountAllowed, discountPercentage, coverImage, studentLevel, skillsToGain, language } = req.body
    try {
        if(!title || !about || !overview || !price || !coverImage || !studentLevel || !language){
            return res.status(400).json({ success: false, data: 'Fill all required fields'})
        }
        if(category?.length < 1){
            return res.status(400).json({ success: false, data: 'Atleast one category is required' })
        }
        if(skillsToGain?.length < 1){
            return res.status(400).json({ success: false, data: '' })
        }

        const generatedCourseSlug = await generateUniqueCode(6)
        console.log('COURSE SLUG>>', `AFRIC${generatedCourseSlug}`, generatedCourseSlug)

        const makeNewCourse = await CourseModel.create({
            title, about, desc, instructorName: `${firstName} ${lastName}`, instructorId: _id, overview, category, price, isDiscountAllowed, discountPercentage, coverImage, studentLevel, skillsToGain, language, slugCode: `AFRIC${generatedCourseSlug}`
        })

        res.status(201).json({ success: true, data: 'Cousre created successfull', courseId: makeNewCourse._id })
    } catch (error) {
        console.log('UNABLE TO CREATE A NEW CREATE NEW COURSE', error)
        res.status(500).json({ success: false, data: 'Unable to create new course'})
    }
}

//UPDATE COURSE INFO
export async function updateCourse(req, res) {
    const { _id, title, instructorName, about, desc, overview, category, price, isDiscountAllowed, discountPercentage, coverImage, studentLevel, skillsToGain, language } = req.body
    try {
        const findCourse = await CourseModel.findByIdAndUpdate(
            _id, 
            {
                $set: {
                    title, about, instructorName, desc, overview, category, price, isDiscountAllowed, discountPercentage, coverImage, studentLevel, skillsToGain, language
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

        res.status(200).json({ success: true, data: allCourses })
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
    console.log(category)
    try {
        if(!category){
            console.log('NOT CATEGORY SENT TO FIND COURSE WITH')
            return res.end()
        }

        const catSlug = await CourseCategoryModel.findOne({ slug: category })
        if(!catSlug){
            return res.end()
        }

        const courses = await CourseModel.find({ category: { $in: [catSlug?.category] } });

        res.status(200).json({ success: true, data: courses })
    } catch (error) {
        console.log('UNABLE TO GET COURSE BY PARAMS', error)
        res.status(500).json({ success: false, data: 'Unable to get courses with this category' })
    }
}

//CREATE A NEW CATEGORY **
export async function newCategory(req, res) {
    const { category } = req.body
    try {
        if(!category){
            return res.status(400).json({ success: false, data: 'Category is Needed' })
        }
        const slugValue = category.replace(/\s+/g, '').toLowerCase();

        const categoryExist =  await CourseCategoryModel.findOne({ slug: slugValue })
        if(categoryExist){
            return res.status(400).json({ success: false, data: 'Category already exist' })
        }

        const makeNewCategory = await CourseCategoryModel.create({
            category, slug: slugValue
        })

        res.status(201).json({ success: true, data: `${makeNewCategory.category} category has been added` })
    } catch (error) {
        console.log('UNABLE TO CREATE NEW CATEGORY', error)
        res.status(500).json({ success: false, data: 'Failed to create new category' })
    }
}

//UPDATE CATEGORY **
export async function updateCategory(req, res) {
    const { _id, category } = req.body
    try {
        const findCat = await CourseCategoryModel.findById({ _id: _id })
        if(!findCat){
            res.status(404).json({ success: false, data: 'Category not found' })
        }

        const slugValue = category.replace(/\s+/g, '').toLowerCase();
        
        const oldCategory = findCat.category;
        const courses = await CourseModel.find({ category: { $in: [oldCategory] } });
        
        // Update the category in each course
        await Promise.all(courses.map(async (course) => {
            course.category = course.category.map(cat => cat === oldCategory ? category : cat);
            await course.save();
        }));

        findCat.category = category
        findCat.slug = slugValue
        await findCat.save()
        
        res.status(200).json({ success: true, data: `Category updated successful` })
    } catch (error) {
        console.log('UNABLE TO UPDATE CATEGORY', error)
        res.status(500).json({ success: false, data: 'Unable to update category' })
    }
}

//GET COURSE BY ID
export async function getCourse(req, res) {
    const { _id } = req.body
    try {
        if(!_id){
            return res.status(404).json({ success: false, data: 'No Course ID' })
        }

        const getCourse = await CourseModel.findById({ _id: _id })
        if(!getCourse){
            return res.status(404).json({ success: false, data: 'Course not found' })
        }

        res.status(200).json({ success: true, data: getCourse })
    } catch (error) {
        console.log('UNABLE TO GET A COURSE')
        res.status(500).json({ success: false, data: 'Unable to get course' })
    }
}

//GET COURSE BY PARAMS
export async function getCourseByParams(req, res) {
    const { param } = req.params
    try {
        
    } catch (error) {
        
    }
}