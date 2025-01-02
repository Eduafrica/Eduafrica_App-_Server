import * as controllers from '../controllers/appUpload.controllers.js'
import express from 'express'
const router = express.Router()

router.post('/appUpload', controllers.appUpload )



//PUT ROUTES

export default router