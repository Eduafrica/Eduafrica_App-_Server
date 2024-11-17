import express from 'express'
import * as controllers from '../controllers/courseContent.controllers.js'
import { AdminProtect, Protect } from '../middleware/auth.js'

const router = express.Router()

//router.post('/newCourse', Protect, controllers.newCourse )

//GET ROUTES
router.get('/getCourseContentForAdmin/:id', AdminProtect, controllers.getCourseContentForAdmin )




//PUT ROUTES

export default router