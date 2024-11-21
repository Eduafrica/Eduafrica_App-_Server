import express from 'express'
import * as controllers from '../controllers/courseContent.controllers.js'
import { AdminProtect, Protect, UserRole } from '../middleware/auth.js'

const router = express.Router()

//router.post('/uploadCourseContent', Protect, UserRole(['instructor', 'organization']), controllers.uploadCourseContent )
router.post('/uploadCourseContent', controllers.uploadCourseContent )

//GET ROUTES
router.get('/getCourseContentForAdmin/:id', AdminProtect, controllers.getCourseContentForAdmin )




//PUT ROUTES

export default router