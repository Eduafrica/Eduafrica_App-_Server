import express from 'express'
import * as controllers from '../controllers/auth.controllers.js'

const router = express.Router()

router.post('/register', controllers.registerUser )
router.post('/verifyOtp', controllers.verifyOtp )
router.post('/login', controllers.login )




//PUT ROUTES

export default router