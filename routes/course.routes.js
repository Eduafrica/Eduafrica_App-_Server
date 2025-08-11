import express from 'express'
import * as controllers from '../controllers/course.controllers.js'
import { AdminProtect, InstructorsOrAdminProtect, Protect, UserRole } from '../middleware/auth.js'

const router = express.Router()

router.post('/newCourse', Protect, UserRole(['instructor', 'organization']), controllers.newCourse )
router.post('/updateCourse', Protect, UserRole(['instructor', 'organization']), controllers.updateCourse )
router.post('/rateACourse', Protect, controllers.rateACourse )

router.post('/newCategory', controllers.newCategory )
router.post('/updateCategory', controllers.updateCategory )
router.post('/flagCourse', AdminProtect, controllers.flagCourse )
router.post('/unFlagCourse', AdminProtect, controllers.unFlagCourse )
router.post('/reportCourse', controllers.reportCourse )

router.post('/requestCourseApproval', Protect, UserRole(['instructor', 'organization']), controllers.requestCourseApproval)
router.post('/approveCourse', AdminProtect, controllers.approveCourse )
router.post('/rejectCourse', AdminProtect, controllers.rejectCourse )

router.post('/deActivateCourse', Protect, UserRole(['instructor', 'organization']), controllers.deActivateCourse)
router.post('/activateCourse', Protect, UserRole(['instructor', 'organization']), controllers.activateCourse)
router.post('/deleteCourse', Protect, UserRole(['instructor', 'organization']), controllers.deleteCourse)






//GET ROUTES
router.get('/getAllCourse',  controllers.getAllCourse)
router.get('/getAllCourseAdmin', AdminProtect,  controllers.getAllCourseAdmin)
router.get('/getCourse/:_id', controllers.getCourse)
router.get('/getACourseAdmin/:_id', AdminProtect, controllers.getACourseAdmin)
router.get('/getPopularCourse', controllers.getPopularCourse)
router.get('/getAllCourseCategories', controllers.getAllCourseCategories)
router.get('/getCourseByCategory/:category', controllers.getCourseByCategory)

router.get('/getCourseByParams/:param', controllers.getCourseByParams)
router.get('/getCourseByCouponCode/:couponCode', controllers.getCourseByCouponCode)

router.get('/getInstructorCourses/:_id', InstructorsOrAdminProtect, controllers.getInstructorCourses)
router.get('/getAInstructorCourse/:_id', InstructorsOrAdminProtect, controllers.getAInstructorCourse)

router.get('/getAStudentCourse/:_id', Protect, UserRole(['student']), controllers.getAStudentCourse)
router.get('/getStudentCourses/:_id', Protect, UserRole(['student']), controllers.getStudentCourses)

router.get('/getCourseStats/:stats', AdminProtect, controllers.getCourseStats)






//PUT ROUTES

export default router