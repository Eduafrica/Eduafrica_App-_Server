import express from 'express'
import * as controllers from '../controllers/course.controllers.js'

const router = express.Router()

router.post('/newCourse', controllers.newCourse )
router.post('/updateCourse', controllers.updateCourse )
router.post('/newCategory', controllers.newCategory )


//GET ROUTES
router.get('/getAllCourse', controllers.getAllCourse)
router.get('/getAllCourseCategories', controllers.getAllCourseCategories)
router.get('/getCourseByCategory/:category', controllers.getCourseByCategory)
router.get('/getCourseByParams/:param', controllers.getCourseByParams)





//PUT ROUTES

export default router