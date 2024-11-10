import { calculateAverageCourseRating, generateUniqueCode } from "../middleware/utils.js"
import CourseModel from "../models/Course.js"
import CourseCategoryModel from "../models/CourseCategories.js"
import NotificationModel from "../models/Notifications.js"
import ReportCourseModel from "../models/ReportCourse.js"

//CREATE NEW COURSE INFO
export async function newCourse(req, res) {
    const { _id, email, name } = req.user
    const { title, instructorName, about, desc, overview, category, price, priceCurrency, isDiscountAllowed, discountPercentage, coverImage, studentLevel, skillsToGain, language } = req.body
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
            title, about, desc, instructorName: `${instructorName ? instructorName : name}`, instructorEmail: email, instructorId: _id, overview, category, price, priceCurrency, isDiscountAllowed, discountPercentage, coverImage, studentLevel, skillsToGain, language, slugCode: `AFRIC${generatedCourseSlug}`
        })

        const newNotification = await NotificationModel.create({
            message: `${name} created a new course and is waiting for approval by Admin`,
            actionBy: `name - (Instructor)`,
            name: `${name}`
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

//RATE A COURSE BY STUDENTS
export async function rateACourse(req, res) {
    const { _id, comment, rateNumber } = req.body
    const { _id: userId, name, displayName, } =  req.user
    try {
        if(!_id){
            return res.status(400).json({ success: false, data: 'Course ID is required' })
        }
        if(rateNumber < 0){
            return res.status(400).json({ success: false, data: 'Rating number(value) must be at least one'})
        }
        if(rateNumber > 5){
            return res.status(400).json({ success: false, data: 'Rating number max value is 5'})
        }

        const findCourse = await CourseModel.findById({ _id: _id })
        if(!findCourse){
            return res.status(404).json({ success: false, data: 'Course not found'})
        }

        const data = {
            userName: name ? name : displayName,
            userId,
            rateNumber,
            comment: comment ? comment : ''
        }

        findCourse.ratings.push(data)
        await findCourse.save()

        res.status.json({ success: true, data: 'Course review added' })
    } catch (error) {
        console.log('UNABLE TO RATE A COURSE', error)
        res.status(500).json({ success: false, data: 'Unable to add ratings' })
    }
}

//GET ALL COURSE PUBLIC
export async function getAllCourse(req, res) {
    
    try {
        //const allCourses = await CourseModel.find({ isBlocked: false }).sort({ createdAt: -1 })
        const allCourses = await CourseModel.find().sort({ createdAt: -1 })

        const coursesWithRatings = await calculateAverageCourseRating(allCourses);
        
        res.status(200).json({ success: true, data: coursesWithRatings })
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
        const coursesWithRatings = await calculateAverageCourseRating(courses);

        res.status(200).json({ success: true, data: coursesWithRatings })
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
    const { _id } = req.params
    console.log('RESD', req.body, _id)
    try {
        if(!_id){
            return res.status(404).json({ success: false, data: 'No Course ID' })
        }

        const getCourse = await CourseModel.findById({ _id: _id })
        if(!getCourse){
            return res.status(404).json({ success: false, data: 'Course not found' })
        }

        const coursesWithRatings = await calculateAverageCourseRating(getCourse);

        res.status(200).json({ success: true, data: coursesWithRatings })
    } catch (error) {
        console.log('UNABLE TO GET A COURSE', error)
        res.status(500).json({ success: false, data: 'Unable to get course' })
    }
}

//GET POPULAR COURSE
export async function getPopularCourse(req, res) {
    try {
        // Fetch courses sorted by the number of students in descending order, limit to 100
        const topCourses = await CourseModel.find()
            .sort({ 'students.length': -1 }) 
            .limit(100);

        const shuffledCourses = topCourses.sort(() => 0.5 - Math.random());
        const selectedCourses = shuffledCourses.slice(0, 5);

        const coursesWithRatings = await calculateAverageCourseRating(selectedCourses);

        res.status(200).json({ success: true, data: coursesWithRatings });
    } catch (error) {
        console.log('UNABLE TO GET POPULAR COURSES', error);
        res.status(500).json({ success: false, data: 'Failed to get popular course' });
    }
}

//GET COURSE BY PARAMS
export async function getCourseByParams(req, res) {
    const { param } = req.params
    try {
        
    } catch (error) {
        
    }
}

//REPORT COURSE BY STUDENT
export async function reportCourse(req, res) {
    const { message } = req.body
    const { _id, name, email } = req.user
   try {
        if(!message){
            return res.status(400).json({ success: true, data: 'Message is Required' })
        }
        const newReport = await ReportCourseModel.create({
            message, userName: name, email, userId: _id
        })

        res.status(201).json({ success: true, data: 'Report has been submitted successful' })
   } catch (error) {
        console.log('UNABLE TO REPORT COURSE BY STUDENT', error)
        res.status(500).json({ success: true, data: 'Unable to report course' })
   } 
}

//BUY A COURSE
export async function buyCourse(req, res) {
    try {
        
    } catch (error) {
        
    }
}

//FLAG A COURSE
export async function flagCourse(req, res) {
    const { _id } = req.body
    try {
        if(!_id){
            return res.status(404).json({ success: false, data: 'No Course ID' })
        }

        const getCourse = await CourseModel.findById({ _id: _id })
        if(!getCourse){
            return res.status(404).json({ success: false, data: 'Course not found' })
        }

        getCourse.isBlocked = true
        await getCourse.save()

        const newNotification = await NotificationModel.create({
            message: `${getCourse.instructorName} course has been blocked by Admin`,
            actionBy: req.admin._id,
            name: `${req.admin.firstName} ${req.admin.lastName}`
        })

        res.status(201).json({ success: true, data: `course by ${getCourse.instructorName} has been blocked` })
    } catch (error) {
        console.log('UNABLE TO GET A COURSE')
        res.status(500).json({ success: false, data: 'Unable to get course' })
    }
}

//UNFLAG A COURSE
export async function unFlagCourse(req, res) {
    const { _id } = req.body
    try {
        if(!_id){
            return res.status(404).json({ success: false, data: 'No Course ID' })
        }

        const getCourse = await CourseModel.findById({ _id: _id })
        if(!getCourse){
            return res.status(404).json({ success: false, data: 'Course not found' })
        }

        getCourse.isBlocked = false
        await getCourse.save()

        const newNotification = await NotificationModel.create({
            message: `${getCourse.instructorName} course has been unblocked by Admin`,
            actionBy: req.admin._id,
            name: `${req.admin.firstName} ${req.admin.lastName}`
        })

        res.status(201).json({ success: true, data: `course by ${getCourse.instructorName} has been blocked` })
    } catch (error) {
        console.log('UNABLE TO GET A COURSE')
        res.status(500).json({ success: false, data: 'Unable to get course' })
    }
}