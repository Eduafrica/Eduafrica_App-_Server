import mongoose from "mongoose"
import { generateUniqueCode } from "../middleware/utils.js"
import CourseModel from "../models/Course.js"
import OrderModel from "../models/Orders.js"
import StudentModel from "../models/Student.js"

export async function getStudentOrders(req, res) {
    const { _id } = req.params
    console.log('PARAM', _id)

    let singleOrder

    // Check if the parameter is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(_id)) {
        singleOrder = true
    }

    try {
        if(singleOrder){
            const findOrders = await OrderModel.findOne({ orderID: _id });

            if (!findOrders) {
                return res.status(404).json({ success: false, data: 'No Course found' });
            }
    
            // Fetch course details with instructorName and coverImg
            const course = await CourseModel.findById(findOrders.courseId).select('instructorName coverImage');
    
            // Combine order data with course details
            const responseData = {
                ...findOrders.toObject(), // Convert Mongoose document to plain JS object
                instructorName: course.instructorName,
                coverImg: course.coverImage,
            };
    
            return res.status(200).json({ success: true, data: responseData });
        } 
        const findOrders = await OrderModel.find({ userId: _id })

        return res.status(200).json({ success: true, data: findOrders?.length < 1 ? [] : findOrders })
    } catch (error) {
        console.log('UNABLE TO GET ALL ORDERS OF A STUDENTS', error)
        res.status(500).json({ success: false, data: 'Unable to get student orders' })
    }
}

export async function newOrder(req, res) {
    const { userId, orderStatus, courseId } = req.body
    try {
        const newOrderID = await generateUniqueCode(7)
        console.log('ORDER CODE>>', `${newOrderID}FD`)

        const user = await StudentModel.findById({ _id: userId })
        if(!user){
            return res.status(404).json({ success: false, data: 'Invalid User Account' })
        }
        const getCourse = await CourseModel.findById({ _id: courseId })
        if(!getCourse){
            return res.status(404).json({ success: false, data: 'Course Not Found' })
        }
        if(getCourse.isBlocked){
            return res.status(404).json({ success: false, data: 'Course is Blocked and cannot be accessed' })
        }
 
        const newOrder = await OrderModel.create({
            userId, 
            orderID: `${newOrderID}FD`, 
            amount: getCourse?.price, 
            orderStatus, courseId, 
            courseTitle: getCourse?.title,
            courseImg: getCourse?.coverImage, 
            categories: getCourse?.category, 
            currency: getCourse?.priceCurrency, 
            email: user?.email
        })

        res.status(201).json({ success: true, data: 'ORDER CREATED' })
    } catch (error) {
        console.log('ERROR', error)
        res.end()
    }
}