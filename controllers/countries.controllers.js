import CountryModel from "../models/Countries.js";

//NEW COUNTRY
export async function newCountry(req, res) {
    const { image, country, currency } = req.body
    try {
        if(!country){
            return res.status(400).json({ success: false, data: 'Provide a Country' })
        }
        if(!currency){
            return res.status(400).json({ success: false, data: 'Provide a Currency' })
        }
        const slug = country.toLowerCase().replace(/\s+/g, '');
        const countryExist = await CountryModel.findOne({ slug })
        if(countryExist){
            return res.status(400).json({ success: false, data: 'Country already Exist' })
        }

        const newCountry = await CountryModel.create({
            image, country, slug, currency
        })

        res.status(201).json({ success: true, data: 'New country added' })
    } catch (error) {
        console.log('UNABLE TO CREATE NEW COUNTRY', error)
        res.status(500).json({ success: true, data: 'Unable to create new country' })
    }
}

//UPDATE COUNTRY
export async function updateCountry(req, res) {
    const { id, image, country, currency } = req.body
    if(!id){
        return res.status(400).json({ success: false, data: 'ID is required' })
    }
    try {
        const countryExist = await CountryModel.findById({ _id: id })
        if(!countryExist){
            return res.status(404).json({ success: false, data: 'Country with this ID does not exist' })
        }
        let slug
        if(country){
            slug = country.toLowerCase().replace(/\s+/g, '');
        }
        const getCountry = await CountryModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    image,
                    country,
                    currency,
                    slug
                }
            },
            { new: true }
        )

        res.status(201).json({ success: true, data: 'Country has been updated'})
    } catch (error) {
        console.log('UNABLE TO UPDATE COUNTRY', error)
        res.status(500).json({ success: false, data: 'Unable to update country'})
    }
}

//DELETE COUNTRY
export async function deleteCountry(req, res) {
    const { id } = req.body
    if(!id){
        return res.status(400).json({ success: false, data: 'ID is required' })
    }
    try {
        const deleteCountry = await CountryModel.findByIdAndDelete({ _id: id })

        res.status(201).json({ success: true, data: 'Country Deleted Successfull'})
    } catch (error) {
        console.log('UNABLE TO DELETE COUNTRY', error)
        res.status(500).json({ success: false, data: 'Unable to delete country' })
    }
}

//GET ALL COUNTRIES
export async function getCountries(req, res) {
    try {
        const getAllCountries = await CountryModel.find()

        res.status(200).json({ success: true, data: getAllCountries })
    } catch (error) {
        console.log('UNABLE TO GET COUNTRIES', error)
        res.status(500).json({ success: false, data: 'Unable to get countries' })
    }
}

//GET COUNTRY
export async function getCountry(req, res) {
    const { id } = req.params
    if(!id){
        return res.status(400).json({ success: false, data: 'ID is required' })
    }
    try {
        const getCountry = await CountryModel.findById({ _id: id })
        if(!getCountry){
            return res.status(404).json({ success: false, data: 'Country with this ID does not exist' })
        }

        res.status(200).json({ success: true, data: getCountry })
    } catch (error) {
        console.log('UNABLE TO GET COUNTRY', error)
        res.status(500).json({ success: false, data: 'Unable to get country' })
    }
}