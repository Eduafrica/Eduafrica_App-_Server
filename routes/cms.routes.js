import express from 'express'
import * as controllers from '../controllers/cms.controllers.js'
import { AdminProtect } from '../middleware/auth.js'

const router = express.Router()

router.post('/newCms', AdminProtect, controllers.newCms)
router.post('/updateCms', AdminProtect, controllers.updateCms)
router.post('/deleteCms', AdminProtect, controllers.deleteCms)

//GET ROUTES
router.get('/getAllCms', controllers.getAllCms)
router.get('/getCms/:id', AdminProtect, controllers.getCms)



//PUT ROUTES

export default router