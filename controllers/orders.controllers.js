import mongoose from "mongoose"
import { generateUniqueCode } from "../middleware/utils.js"
import CourseModel from "../models/Course.js"
import OrderModel from "../models/Orders.js"
import StudentModel from "../models/Student.js"

export async function fetchAllOrders(req, res){
    try {
        const orders = await OrderModel.find()

        res.status(200).json({ success: true, data: orders })
    } catch (error) {
        console.log('UNABLE TO FETCH ALL ORDERS', error)
        res.status(500).json({ success: false, data: 'Unable to get all orders' })
    }
}

export async function fetchOrder(req, res) {
    const { _id } = req.params
    if(!_id){
        return res.status(400).json({ success: false, data: 'Provide a order id' })
    }
    try {
        const order = await OrderModel.findById({ _id: _id })
        if(!order){
            return res.status(404).json({ success: false, data: 'Order with this id not found' })
        }

        res.status(200).json({ success: true, data: order })
    } catch (error) {
        console.log('UNABLE TO GET ORDER DETAILS', error)
        res.status(500).json({ success: false, data: 'Unable to get order details' })
    }
}

//GET A STUDENT ORDERS
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
                return res.status(404).json({ success: false, data: 'No Order found' });
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

export async function getOrderStats(req, res) {
    const { stats } = req.params;
    console.log('STATSUS', stats)
    if(!stats){
        return
    }

    const getFilterDates = (value) => {
        const today = new Date();
        let startDate, endDate, previousStartDate, previousEndDate;

        switch (value) {
            case 'today':
                endDate = new Date(today);
                startDate = new Date(today.setDate(today.getDate() - 1));
                previousEndDate = new Date(startDate);
                previousStartDate = new Date(previousEndDate.setDate(previousEndDate.getDate() - 1));
                break;

            case '7days':
                endDate = new Date();
                startDate = new Date(today.setDate(today.getDate() - 7));
                previousEndDate = new Date(startDate);
                previousStartDate = new Date(previousEndDate.setDate(previousEndDate.getDate() - 7));
                break;

            case '30days':
                endDate = new Date();
                startDate = new Date(today.setDate(today.getDate() - 30));
                previousEndDate = new Date(startDate);
                previousStartDate = new Date(previousEndDate.setDate(previousEndDate.getDate() - 30));
                break;

            case '1year':
                endDate = new Date();
                startDate = new Date(today.setFullYear(today.getFullYear() - 1));
                previousEndDate = new Date(startDate);
                previousStartDate = new Date(previousEndDate.setFullYear(previousEndDate.getFullYear() - 1));
                break;

            case 'alltime':
                startDate = new Date(0); // Unix epoch start
                endDate = new Date();
                previousStartDate = null;
                previousEndDate = null;
                break;

            default:
                throw new Error('Invalid stats value');
        }

        return { startDate, endDate, previousStartDate, previousEndDate };
    };

    const calculatePercentageChange = (current, previous) => {
        if (previous === 0) return { change: 100, percentage: '+' }; // Handle division by zero
        const change = ((current - previous) / previous) * 100;
        return {
            change: parseFloat(change.toFixed(2)),
            percentage: change >= 0 ? '+' : '-',
        };
    };

    try {
        const { startDate, endDate, previousStartDate, previousEndDate } = getFilterDates(stats);

        const selectedPeriodData = await OrderModel.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: null,
                    totalStudents: { $sum: 1 },
                    activeStudents: { $sum: { $cond: [{ $eq: ["$verified", true] }, 1, 0] } },
                    inactiveStudents: { $sum: { $cond: [{ $eq: ["$verified", false] }, 1, 0] } },
                    blacklistStudents: { $sum: { $cond: [{ $eq: ["$blocked", true] }, 1, 0] } },
                },
            },
        ]);

        let previousPeriodData = [];
        if (previousStartDate && previousEndDate) {
            previousPeriodData = await OrderModel.aggregate([
                { $match: { createdAt: { $gte: previousStartDate, $lte: previousEndDate } } },
                {
                    $group: {
                        _id: null,
                        totalStudents: { $sum: 1 },
                        activeStudents: { $sum: { $cond: [{ $eq: ["$verified", true] }, 1, 0] } },
                        inactiveStudents: { $sum: { $cond: [{ $eq: ["$verified", false] }, 1, 0] } },
                        blacklistStudents: { $sum: { $cond: [{ $eq: ["$blocked", true] }, 1, 0] } },
                    },
                },
            ]);
        }

        // Ensure data structure
        const currentData = selectedPeriodData[0] || { totalStudents: 0, activeStudents: 0, inactiveStudents: 0, blacklistStudents: 0 };
        const previousData = previousPeriodData[0] || { totalStudents: 0, activeStudents: 0, inactiveStudents: 0, blacklistStudents: 0 };

        // Calculate percentage changes with indicators
        const statsComparison = [
            {
                current: currentData.totalStudents,
                previous: previousData.totalStudents,
                id: 'totalstudent',
                name: 'Total Student',
                ...calculatePercentageChange(currentData.totalStudents, previousData.totalStudents),
            },
            {
                current: currentData.activeStudents,
                previous: previousData.activeStudents,
                id: 'totalactivestudent',
                name: 'Total Active Student',
                ...calculatePercentageChange(currentData.activeStudents, previousData.activeStudents),
            },
            {
                current: currentData.inactiveStudents,
                previous: previousData.inactiveStudents,
                id: 'totalinactivestudent',
                name: 'Total Inactive Student',
                ...calculatePercentageChange(currentData.inactiveStudents, previousData.inactiveStudents),
            },
            {
                current: currentData.blacklistStudents,
                previous: previousData.blacklistStudents,
                id: 'totalblackliststudent',
                name: 'Total Blacklist Student',
                ...calculatePercentageChange(currentData.blacklistStudents, previousData.blacklistStudents),
            },
        ];

        res.status(200).json({ success: true, data: statsComparison });
    } catch (error) {
        console.error('UNABLE TO GET STUDENT STATS', error);
        res.status(500).json({ success: false, data: 'Unable to get student stats' });
    }
}
