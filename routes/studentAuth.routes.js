import express from 'express'
import * as controllers from '../controllers/studentAuth.controllers.js'

const router = express.Router()

router.post('/register', controllers.registerUser )
router.post('/login', controllers.login )
router.post('/forgotPassword', controllers.forgotPassword )
router.post('/resetPassword/:resetToken', controllers.resetPassword )




//PUT ROUTES

export default router