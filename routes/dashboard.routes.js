import * as controllers from '../controllers/dashboard.controllers.js'
import express from 'express'
import { AdminProtect } from '../middleware/auth.js'

const router = express.Router()

router.get('/dashboardStats/:stats', AdminProtect, controllers.getDashboardStats)

export default router