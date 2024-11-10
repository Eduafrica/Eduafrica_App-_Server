import express from 'express'
import * as controllers from '../controllers/course.controllers.js'
import { Protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/newCourse', Protect, controllers.newCourse )
router.post('/updateCourse', Protect, controllers.updateCourse )
router.post('/rateACourse', Protect, controllers.rateACourse )

router.post('/newCategory', controllers.newCategory )
router.post('/updateCategory', controllers.updateCategory )
router.post('/flagCourse', controllers.flagCourse )
router.post('/unFlagCourse', controllers.flagCourse )
router.post('/reportCourse', controllers.reportCourse )





//GET ROUTES
router.get('/getAllCourse',  controllers.getAllCourse)
router.get('/getCourse/:_id', controllers.getCourse)
router.get('/getPopularCourse', controllers.getPopularCourse)
router.get('/getAllCourseCategories', controllers.getAllCourseCategories)
router.get('/getCourseByCategory/:category', controllers.getCourseByCategory)
router.get('/getCourseByParams/:param', controllers.getCourseByParams)





//PUT ROUTES

export default router