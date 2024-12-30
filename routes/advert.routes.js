import express from 'express'
import * as controllers from '../controllers/advert.controllers.js'

const router = express.Router()

//POST
router.post('/newAdvert', controllers.newAdvert)
router.post('/updateAdvert', controllers.updateAdvert)
router.post('/deleteAdvert', controllers.deleteAdvert)



//GET ROUTES
router.get('/fetchAllAdvert/:value', controllers.fetchAllAdvert)
router.get('/fetchAdvert/:id', controllers.fetchAdvert)


//PUT ROUTES

export default router