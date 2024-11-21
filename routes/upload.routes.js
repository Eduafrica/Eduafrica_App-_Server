import express from 'express'
import * as controllers from '../controllers/upload.controllers.js'
import multer from 'multer';

const router = express.Router()


const upload = multer();

//POST
router.post('/initiateUpload', controllers.initiateUpload)
router.post('/uploadFile', upload.single('file'), controllers.uploadFile)
router.post('/completeUpload', controllers.completeUpload)


//PUT ROUTES

export default router
