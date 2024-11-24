import express from "express";
import * as controllers from '../controllers/countries.controllers.js'
import { AdminProtect, AdminRole } from "../middleware/auth.js";
const router = express.Router()

router.post('/newCountry', AdminProtect, AdminRole(['Admin']), controllers.newCountry)
router.post('/updateCountry', AdminProtect, AdminRole(['Admin']), controllers.updateCountry)
router.post('/deleteCountry', AdminProtect, AdminRole(['Admin']), controllers.deleteCountry)


//GET ROUTES
router.get('/getCountries', controllers.getCountries)
router.get('/getCountry/:id', controllers.getCountry)

export default router