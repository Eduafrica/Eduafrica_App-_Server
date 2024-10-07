import express from 'express'
import * as controllers from '../controllers/aichat.controllers.js'

const router = express.Router()

router.post('/aiChat', controllers.aiChat )



//PUT ROUTES

export default router