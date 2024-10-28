import express from 'express'
import * as controllers from '../controllers/instructorsAuth.controllers.js'

const router = express.Router()

router.post('/register', controllers.registerUser )
router.post('/login', controllers.login )


//PUT ROUTES

export default router