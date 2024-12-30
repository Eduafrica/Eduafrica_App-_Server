import mongoose from "mongoose"
import { generateUniqueCode } from "../middleware/utils.js"
import CourseModel from "../models/Course.js"
import OrderModel from "../models/Orders.js"
import StudentModel from "../models/Student.js"
import OrderValidationModel from "../models/OrderValidation.js"
import axios from 'axios'
import CouponCodeModel from "../models/CouponCode.js"
import InstructorModel from "../models/Instructors.js"
import SiteSettingModel from "../models/SiteSettings.js"
import WalletModel from "../models/Wallet.js"
import CourseContentModel from "../models/CourseContent.js"
import organizationModel from "../models/Organization.js"

export async function fetchAllOrders(req, res){
    try {
        const orders = await OrderModel.find().sort({ createdAt: -1 })

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
    const { courseId, couponCode } = req.body
    const { _id } = req.user
    if(!courseId){
        return res.status(400).json({ success: false, data: 'Course ID is required' })
    }
    try {
        const newOrderID = await generateUniqueCode(7)
        console.log('ORDER CODE>>', `${newOrderID}FD`)

        const user = await StudentModel.findById({ _id: _id })
        if(!user){
            return res.status(404).json({ success: false, data: 'Invalid User Account' })
        }
        const getCourse = await CourseModel.findOne({ slugCode: courseId })
        if(!getCourse){
            return res.status(404).json({ success: false, data: 'Course Not Found' })
        }
        if(getCourse.isBlocked){
            return res.status(404).json({ success: false, data: 'Course is Blocked and cannot be accessed' })
        }
        if(getCourse.approved !== 'Approved'){
            return res.status(404).json({ success: false, data: 'Course is Blocked and cannot be accessed' })
        }
        if(!getCourse.active){
            return res.status(404).json({ success: false, data: 'Course is not active' })
        }

        let payableAmount = getCourse?.price
        let getCouponCodeCourse
        if(couponCode){
            getCouponCodeCourse = await CouponCodeModel.findOne({ code: couponCode })

            if(!getCouponCodeCourse){
                return res.status(404).json({ success: false, data: 'Invalid coupon code'})
            }
            if(getCouponCodeCourse?.quantityUsed >= getCouponCodeCourse?.maxNumber){
                return res.status(403).json({ success: false, data: 'This coupon code is no longer availble' })
            }

            const priceOff = ( getCouponCodeCourse?.percentageOff * getCourse?.price ) / 100
            payableAmount = getCourse?.price - priceOff
        }
 
        const newOrder = await OrderModel.create({
            userId: user?._id, 
            orderId: `${newOrderID}FD`, 
            orderID: Date.now(),
            amount: getCourse?.price,
            payableAmount: payableAmount,
            discount: getCouponCodeCourse?.percentageOff ? true : false,
            discountOff: getCouponCodeCourse?.percentageOff,
            couponCode: getCouponCodeCourse?.quantityUsed < getCouponCodeCourse?.maxNumber ? getCouponCodeCourse?.code : '',
            currency: getCourse?.priceCurrency, 
            orderStatus: 'Initiated',
            courseId: getCourse?._id,
            courseSlug: getCourse?.slugCode,
            courseTitle: getCourse?.title,
            courseImg: getCourse?.coverImage, 
            categories: getCourse?.category, 
            email: user?.email,
        })

        const newOrderValidation = await OrderValidationModel.create({
            email: user?.email,
            userId: user?._id,
            amount: getCourse?.price,
            payableAmount: payableAmount,
            discount: getCouponCodeCourse?.percentageOff ? true : false,
            discountOff: getCouponCodeCourse?.percentageOff,
            currency: getCourse?.priceCurrency,
            courseId: getCourse?._id,
            courseSlug: getCourse?.slugCode,
            courseInstructor: getCourse?.instructorName,
            instructorCode: getCourse?.instructorId,
            orderStatus: 'Initiated',
            orderId: newOrder?._id,
            orderSlug: newOrder?.orderId
        })

        const fullAmount = payableAmount * 100
        const response = await axios.post(
            `${process.env.PAYSTACK_INITIALIZE_URL}`,
            {
              email: user?.email,
              amount: fullAmount,
              currency: `${getCourse?.priceCurrency}`,
              callback_url: process.env.CALLBACK_URL
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_TEST_SK}`,
                'Content-Type': 'application/json'
              }
            }
          );
      
          console.log(response.data);
          const { authorization_url, reference } = response.data.data;
          console.log('refrence',reference, authorization_url)
          newOrder.paymentRefrence = reference
          await newOrder.save()
          newOrderValidation.paymentRefrence = reference
          await newOrderValidation.save()

        res.status(201).json({ success: true, data: 'ORDER CREATED', paymentUrl: authorization_url  })
    } catch (error) {
        console.log('UNABLE TO CREATE ORDER', error)
        res.status(500).json({ success: false, data: 'Unable to create order' })
    }
}

//approve payment and approve course and approve secound validation from webhook

//APPROVE COURSE PAYMENT BY ADMIN
export async function updatePaymentStatus(req, res) {
    const { id } = req.body
    if(!id){
        return res.status(400).json({ success: false, data: 'Order Id is required'})
    }
    try {
        const getOrder = await OrderModel.findOne({ orderId: id })    
        if(!getOrder){
            return res.status(404).json({ success: false, data: 'Invalid order' })
        }

        const getCourse = await CourseModel.findById({ _id: getOrder?.courseId })
        const getOrderValidation = await OrderValidationModel.findOne({ orderSlug: id })
        const getStudent = await StudentModel.findById({ _id: getOrder?.userId })
        let getInstructor
        getInstructor = await InstructorModel.findById(getCourse?.instructorId);
        if (!getInstructor) {
          // If not found, try fetching from organizationModel
          getInstructor = await organizationModel.findById(getCourse?.instructorId);
        }
        if (!getInstructor) {
            return res.status(404).json({ success: false, data: `Instructor not found in either model for ID` });
        }
        const courseContent = await CourseContentModel.findOne({ courseId: getCourse?._id })

        let getCouponCode
        if(getOrder?.couponCode)(
            getCouponCode = await CouponCodeModel.findOne({ code: getOrder?.couponCode })
        )

        
        //get edu africa commision and subtract from order payable amount
        const eduAfricaCommision = await SiteSettingModel.findOne()
        const siteCommision = eduAfricaCommision?.salesPercentage
        const commissionPrice = (siteCommision * getOrder?.payableAmount ) / 100
        console.log('object amount', commissionPrice, siteCommision, getOrder?.payableAmount)

        if(!getStudent){
            return res.status(404).json({ success: false, data: "Student Does not exist" })
        }
        if(getOrder?.paid){
            getOrder.paid = false
            getOrder.orderStatus = 'Failed'
            getOrderValidation.paid = false
            getOrderValidation.orderStatus = 'Failed'


            //remove student _id from student array course model
            getCourse.students.pop(getOrder?.userId)
            // remove course id from student course array
            getStudent.course.pop(getCourse?._id)
            // remove student _id from course content model
            courseContent?.students?.pop(getOrder.userId)
            //reduce student total by one in course model
            getCourse.studentsTotal -= 1
            //subtract from course owner earnings
            getInstructor.totalTransaction -= (getOrder?.payableAmount - commissionPrice)
            //remove coupon code reduce by one if there is
            if(getCouponCode){
                getCouponCode.quantityUsed -= 1
            }
            
            //delete corresponding wallet income
            const deleteWallet = await WalletModel.findOneAndDelete({ orderId: getOrder?.orderId })

            //save
            await getOrder.save()
            await getOrderValidation.save()
            await getCourse.save()
            await getStudent.save()
            await getInstructor.save()
            if(getCouponCode){
                await getCouponCode.save()
            }
            await courseContent.save()
                        
            return res.status(200).json({ success: true, data: 'Order status updated' })
        } else {
            getOrder.paid = true
            getOrder.orderStatus = 'Successful'
            getOrderValidation.paid = true
            getOrderValidation.orderStatus = 'Successful'

            //add student _id from student array course model
            getCourse?.students.push(getOrder?.userId)
            // add course id from student course array
            getStudent?.course.push(getCourse?._id)
            // remove student _id from course content model
            courseContent?.students.push(getOrder?.userId)
            //increase student total by one in course model
            getCourse.studentsTotal += 1
            //add course payable price to owner earnings
            getInstructor.totalTransaction += (getOrder?.payableAmount - commissionPrice)
            //add coupon code reduce by one if there is
            if(getCouponCode){
                getCouponCode.quantityUsed += 1
            }

            //create new wallet incom
            const newWallet = await WalletModel.create({
                orderId: getOrder?.orderId,
                amount: commissionPrice,
                note: 'Course bought'
            })

            //save
            await getOrder.save()
            await getOrderValidation.save()
            await getCourse.save()
            await getStudent.save()
            await getInstructor.save()
            if(getCouponCode){
                await getCouponCode.save()
            }
            await courseContent.save()
            
            return res.status(200).json({ success: true, data: 'Order status updated' })
        }


    } catch (error) {
        console.log('UNABLE TO UPDATE COURSE PAYMENT STATUS', error)
        res.status(500).json({ success: false, data: 'Unable to update course payment status' })
    }
}

//paystack webhook

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
