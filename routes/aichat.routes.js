import express from 'express'
import * as controllers from '../controllers/aichat.controllers.js'
import { ChatId } from '../middleware/auth.js'

const router = express.Router()

router.post('/aiChat', ChatId, controllers.aiChat )



//PUT ROUTES

export default router