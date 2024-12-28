import { generateUniqueCode } from "../middleware/utils.js"
import AdvertModel from "../models/Advert.js"

//NEW ADVERT
export async function newAdvert(req, res) {
    const { name, image, destination, organizationUrl, startDate, endDate, type, advertType } = req.body
    if(!name){
        return res.status(400).json({ success: false, data: 'Advert name is required' })
    }
    if(!advertType){
        return res.status(400).json({ success: false, data: 'Advert type is required' })
    }
    if(advertType.toLowerCase() !== 'banner' || advertType.toLowerCase() !== 'recommendation'){
        return res.status(400).json({ success: false, data: 'Invalid Advert type. Advert type value: "banner", "recommendation"' })
    }
    try {
        const advertId = await generateUniqueCode(8)
        console.log('ADVERT ID', advertId)
        const newAdvert = AdvertModel.create({
            name, image, type, destination, organizationUrl, startDate, endDate, advertId, advertType
        })

        res.status(201).json({ success: true, data: 'Advert Created Successful' })
    } catch (error) {
        console.log('UABLE TO CREATE NEW ADVERT', error)
        res.status(500).json({ success: false, data: 'Unable to create new advert' })
    }
}

//UPDATE ADVERT
export async function updateAdvert(req, res) {
    const { id, name, image, destination, organizationUrl, startDate, endDate, type } = req.body
    try {
        const getAdvert = await AdvertModel.findById({ _id: id })
        if(!getAdvert){
            return res.status(404).json({ success: false, data: 'Advert with this Id does not exist' })
        }

        const updateAdvertData = await AdvertModel.findByIdAndUpdate(
            id, 
            {
                $set: {
                    name,
                    image,
                    destination,
                    organizationUrl,
                    startDate,
                    endDate,
                    type
                }
            },
            { new: true }
        )
        
        res.status(200).json({ success: true, data: 'Advert Updated Successful' })
    } catch (error) {
        console.log('UNABLE TO UPDATE NEW ADVERT', error)
        res.status(500).json({ success: false, data: 'Unable to update new' })
    }
}

//GET ALL ADVERTS BASED ON VALUE
export async function fetchAllAdvert(req, res) {
    const { value } = req.params
    if(value !== 'banner' || value !== 'recommendation'){
        return res.status(400).json({ success: false, data: 'Invalid value. value either: banner or recommendation'})
    }
    try {
        const newProps = value.toLowerCase()

        const advertData = await AdvertModel.find({ adve: newProps })

        res.status(200).json({ success: true, data: advertData })
    } catch (error) {
        console.log('object', error)
        res.status(500).json({ success: false, data: '' })
    }
}

//GET ADVERT
export async function fetchAdvert(req, res) {
    const { id } = req.params
    if(!id){
        return res.status(400).json({ success: false, data: 'Provide an advert id' })
    }
    try {
        const getAdvert = await AdvertModel.findById({ _id: id })
        if(!getAdvert){
            return res.status(404).json({ success: false, data: 'Advert with this Id does not exist' })
        } 

        res.status(200).json({ success: true, data: getAdvert })
    } catch (error) {
        console.log('object', error)
        res.status(500).json({ success: false, data: '' })
    }
}

//DELETE ADVERT
export async function deleteAdvert(req, res) {
    const { id } = req.params
    if(!id){
        return res.status(400).json({ success: false, data: 'Provide an advert id' })
    }
    try {
        const getAdvert = await AdvertModel.findById({ _id: id })
        if(!getAdvert){
            return res.status(404).json({ success: false, data: 'Advert with this Id does not exist' })
        } 

        const deleteAdvertData = await AdvertModel.findByIdAndDelete({ _id: id })

        res.status(200).json({ success: true, data: 'Advert Deleted Succesful' })
    } catch (error) {
        console.log('UNABLE TO DELETE ADVERT', error)
        res.status(500).json({ success: false, data: 'Unable to delete Advert' })
    }
}