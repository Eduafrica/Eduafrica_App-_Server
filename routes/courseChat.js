import express from 'express'
import * as controllers from '../controllers/courseChat.js'
import { AdminProtect, Protect, UserRole } from '../middleware/auth.js'

const router = express.Router()

//POST
router.get('/getStudentCoursesWithChat', Protect, UserRole(['student', 'instructor', 'organization']), controllers.getStudentCoursesWithChat)

export default router
