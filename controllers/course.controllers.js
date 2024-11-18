import { calculateAverageCourseRating, generateUniqueCode } from "../middleware/utils.js"
import CourseModel from "../models/Course.js"
import CourseCategoryModel from "../models/CourseCategories.js"
import CourseContentModel from "../models/CourseContent.js"
import CourseRejectionModel from "../models/CourseRejectionReason.js"
import NotificationModel from "../models/Notifications.js"
import ReportCourseModel from "../models/ReportCourse.js"

//CREATE NEW COURSE INFO
export async function newCourse(req, res) {
    const { _id, email, name } = req.user
    const { title, instructorName, about, desc, overview, category, price, priceCurrency, isDiscountAllowed, discountPercentage, coverImage, studentLevel, skillsToGain, language, faq, syllabus } = req.body
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
            title, about, desc, instructorName: `${instructorName ? instructorName : name}`, instructorEmail: email, instructorId: _id, overview, category, price, priceCurrency, isDiscountAllowed, discountPercentage, coverImage, studentLevel, skillsToGain, language, faq, syllabus, slugCode: `AFRIC${generatedCourseSlug}`
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
    const { _id, title, instructorName, about, desc, overview, category, price, isDiscountAllowed, discountPercentage, coverImage, studentLevel, skillsToGain, language, faq, syllabus } = req.body
    try {
        const findCourse = await CourseModel.findByIdAndUpdate(
            _id, 
            {
                $set: {
                    title, about, instructorName, desc, overview, category, price, isDiscountAllowed, discountPercentage, coverImage, studentLevel, skillsToGain, language, faq, syllabus
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
        const allCourses = await CourseModel.find({ isBlocked: false, approved: 'Approved' }).sort({ createdAt: -1 })
        //const allCourses = await CourseModel.find().sort({ createdAt: -1 })

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

        const courses = await CourseModel.find({
            category: { $in: catSlug?.category }, // No brackets needed if it's already an array
            isBlocked: false,
            approved: 'Approved'
          });
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
        if(!getCourse.isBlocked){
            return res.status(403).json({ success: false, data: 'This course has been blocked by admin' })
        }
        if(!getCourse.approved !== 'Approved'){
            return res.status(403).json({ success: false, data: 'This course has not been approved' })
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
    const { _id, reason } = req.body
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

//REQUEST COURSE APPROVAL BY COURSE INSTRUCTORS
export async function requestCourseApproval(req, res) {
    const { id } = req.body
    const { _id } =  req.user
    try {
        const getCourse = await CourseModel.findById({ _id: id })
        if(!getCourse){
            return res.status(404).json({ success: false, data: 'No course with this ID' })
        }

        if (getCourse.instructorId.toString() !== _id.toString()) {
            return res.status(403).json({ success: false, data: 'Not allowed: Permission Denied' });
        }

        const getCourseContent = await CourseContentModel.findOne({ courseId: getCourse?._id })
        if(!getCourseContent || getCourseContent?.sections.length < 1){
            return res.status(400).json({ success: false, data: 'There must be at least one course chapter content before a request can be made' })
        }

        getCourse.approved = 'Pending'
        await getCourse.save()

        const newNotification = await NotificationModel.create({
            message: `${getCourse.instructorName} course has request for course approval from Admin`,
            actionBy: req.user._id,
            name: `${getCourse.instructorName}`
        })

        res.status(201).json({ success: true, data: 'Course approval request submitted' })
    } catch (error) {
        console.log('UNABLE TO PROCESS COURSE APPROVAL REQUEST', error)
        res.status(500).json({ success: false, data: 'Unable to make request approval' })
    }
}

//APPROVE A COURSE BY ADMIN
export async function approveCourse(req, res) {
    const { id } = req.body
    try {
        if(!id){
            return res.status(404).json({ success: false, data: 'No Course ID' })
        }
        const getCourse = await CourseModel.findById({ _id: id })
        if(!getCourse){
            return res.status(404).json({ success: false, data: 'Course not found' })
        }

        getCourse.approved = 'Approved'
        getCourse.isBlocked = false
        await getCourse.save()

        const newNotification = await NotificationModel.create({
            message: `${getCourse.instructorName} course has been Approved by Admin`,
            actionBy: req.admin._id,
            name: `${req.admin.firstName} ${req.admin.lastName}`
        })

        res.status(201).json({ success: true, data: 'Course has been approved' })
    } catch (error) {
        console.log('UNABLE TO APPROVE USER COURSE', error)
        res.status(500).json({ success: false, data: 'Unable to approve course' })
    }
}

//REJECT A COURSE BY ADMIN
export async function rejectCourse(req, res) {
    const { id, reason, block } = req.body
    console.log(id, 'REject data')

    try {
        if(!id){
            return res.status(404).json({ success: false, data: 'No Course ID' })
        }
        if(!reason){
            return res.status(404).json({ success: false, data: 'Please provide a reason for rejecting course' })
        }
        const getCourse = await CourseModel.findById({ _id: id })
        if(!getCourse){
            return res.status(404).json({ success: false, data: 'Course not found' })
        }

        getCourse.approved = 'Rejected'
        if(block){
            getCourse.isBlocked = true
            await getCourse.save()
        }
        await getCourse.save()

        const courseExist = await CourseRejectionModel.findOne({ courseId: id })
        if(courseExist){
            courseExist.reasons.push({reason})
            await courseExist.save()

            const newNotification = await NotificationModel.create({
                message: `${getCourse.instructorName} course has been Rejected by Admin`,
                actionBy: req.admin._id,
                name: `${req.admin.firstName} ${req.admin.lastName}`
            })

            return res.status(201).json({ success: true, data: 'Course Rejected successfull' })
        }

        const newRejection = await CourseRejectionModel.create({
            courseId: id, 
        })

        newRejection.reasons.push({reason})
        await newRejection.save()

        const newNotification = await NotificationModel.create({
            message: `${getCourse.instructorName} course has been Rejected by Admin`,
            actionBy: req.admin._id,
            name: `${req.admin.firstName} ${req.admin.lastName}`
        })

        return res.status(201).json({ success: true, data: 'Course Rejected successfull' })
    } catch (error) {
        console.log('UNDABLE TO REJECT COURSE', error)
        res.status(500).json({ success: false, data: 'Unable to reject course' })
    }
}

// GET ALL COURSE OF AN INSTRUCTOR
export async function getInstructorCourses(req, res) {
    const { _id } = req.params;
    try {
        if (!_id) {
            return res.status(400).json({ success: false, data: 'An Instructor ID is required' });
        }

        // Fetch all courses for the instructor
        const getCourses = await CourseModel.find({ instructorId: _id });

        // Check if a user is an instructor or organisation
        if (req.user) {
            const processedCourses = await Promise.all(
                getCourses.map(async (course) => {
                    // Convert the course document to a plain object
                    const courseObject = course.toObject();

                    if (course.approved === 'Rejected' || course.isBlocked) {
                        // Find rejection reasons for the course
                        const courseRejection = await CourseRejectionModel.findOne({ courseId: course._id });

                        if (courseRejection && courseRejection.reasons.length > 0) {
                            // Get the latest reason based on createdAt
                            const latestReason = courseRejection.reasons
                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

                            // Add the latest rejection reason to the course object
                            courseObject.rejectionReason = latestReason.reason;
                        }
                    }

                    return courseObject;
                })
            );

            return res.status(200).json({ success: true, data: processedCourses });
        } else {
            return res.status(200).json({ success: true, data: getCourses });
        }
    } catch (error) {
        console.log('UNABLE TO GET ALL COURSE OF AN INSTRUCTOR', error);
        res.status(500).json({ success: false, data: 'Unable to get all courses of an instructor' });
    }
}

// GET A SINGLE COURSE OF AN INSTRUCTOR
export async function getAInstructorCourse(req, res) {
    const { _id } = req.params;

    try {
        if (!_id) {
            return res.status(400).json({ success: false, data: 'A Course ID is required' });
        }

        // Find the course by ID
        const course = await CourseModel.findOne({ _id });

        if (!course) {
            return res.status(404).json({ success: false, data: 'Course Not Found' });
        }

        // Convert the course document to a plain object to add properties
        const courseObject = course.toObject();

        // Check if the course is rejected
        if (course.approved === 'Rejected') {
            // Find rejection reasons for the course
            const courseRejection = await CourseRejectionModel.findOne({ courseId: course._id });

            if (courseRejection && courseRejection.reasons.length > 0) {
                // Get the latest reason based on createdAt
                const latestReason = courseRejection.reasons
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

                // Add the latest rejection reason to the course object
                courseObject.rejectionReason = latestReason.reason;
            }
        }

        res.status(200).json({ success: true, data: courseObject });
    } catch (error) {
        console.error('UNABLE TO GET A COURSE OF AN INSTRUCTOR', error);
        res.status(500).json({ success: false, data: 'Unable to get the course of an instructor' });
    }
}
