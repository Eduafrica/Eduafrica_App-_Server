import CmsModel from "../models/cms.js";

//CREATE NEW CMS
export async function newCms(req, res) {
    const { title, message, type, status, image, users, accountType, caption, url, day, time, date } = req.body;
    const { firstName, lastName, _id } =  req.admin
    if(!title){
        return res.status(400).json({ success: false, data: 'Provide a title'})
    }
    if(!message){
        return res.status(400).json({ success: false, data: 'Provide a message'})
    }
    if(!message){
        return res.status(400).json({ success: false, data: 'Provide a message'})
    }
    if(!type){
        return res.status(400).json({ success: false, data: 'Provide a message'})
    }
    if(!accountType){
        return res.status(400).json({ success: false, data: 'Provide a message'})
    }
    if(accountType === 'custom' && users.length < 1){
        return res.status(400).json({ success: false, data: 'Provide atleast on user email address'})
    }
    try {
        if (status === "Scheduled") {
            if (!day) {
                return res.status(400).json({ success: false, data: 'Provide day' });
            }

            if (!time) {
                return res.status(400).json({ success: false, data: 'Provide time' });
            }

            // Validate time format
            const timeRegex = /^([0-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/;
            if (!timeRegex.test(time)) {
                return res.status(400).json({ success: false, data: 'Invalid time format. Use E.G "09:15 AM" or "12:00 PM" format' });
            }

            // Validate day of the week
            const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            if (!validDays.includes(day)) {
                return res.status(400).json({ success: false, data: 'Invalid day format. Use full day names, e.g., "Monday", "Tuesday".' });
            }

            // Validate date
            if (!date) {
                return res.status(400).json({ success: false, data: 'Provide a date' });
            }

            // Parse and validate the provided date
            const currentDate = new Date();
            const providedDate = new Date(date);

            // Check if the date format is valid and not in the past
            if (isNaN(providedDate.getTime())) {
                return res.status(400).json({ success: false, data: 'Invalid date format. Use E.G "YYYY-MM-DD".' });
            }

            if (providedDate.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)) {
                return res.status(400).json({ success: false, data: 'The date cannot be in the past.' });
            }

        }
        const newCms = await CmsModel.create({
            title, message, type, status, image, scheduled: status === "Scheduled" ? true : false, caption, url, users: accountType === 'custom' ? users : [] , accountType, allUsers: accountType === 'allUsers' ? true : false, author: `${firstName} ${lastName}`, authorID: _id
        });

        // Push the scheduled information
        newCms.scheduledDate.push({ day, time, date });

        // Save the CMS document
        await newCms.save();

        return res.status(201).json({ success: true, data: 'CMS message created successfully' });
    } catch (error) {
        console.log('UNABLE TO CREATE NEW CMS MESSAGE', error);
        res.status(500).json({ success: false, data: 'Unable to create a new CMS message' });
    }
}

//HANDLE SCHEDULED CMS

//UPDATE CMS
export async function updateCms(req, res) {
    const { _id, title, message, type, status, image, scheduled, url, caption, users, allUsers } = req.body;
    try {
        const updateCms = await CmsModel.findById({ _id: _id });

        if (!updateCms) {
            return res.status(404).json({ success: false, data: 'No CMS found with this ID' });
        }

        const editCms = await CmsModel.findByIdAndUpdate(
            _id,
            {
                title,
                message,
                type,
                status,
                image,
                scheduled,
                users,
                allUsers,
                url,
                caption
            },
            { new: true }
        );
        const timeData = req.body.scheduledDate[0]
        const { day, time, date } = timeData

        if (status === "Scheduled") {
            if (!editCms.scheduledDate[0].day) {
                return res.status(400).json({ success: false, data: 'Provide day' });
            }

            if (!editCms.scheduledDate[0].time) {
                return res.status(400).json({ success: false, data: 'Provide time' });
            }

            // Validate time format
            const timeRegex = /^([0-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/;
            if (!timeRegex.test(time)) {
                return res.status(400).json({ success: false, data: 'Invalid time format. Use E.G "09:15 AM" or "12:00 PM" format' });
            }

            // Validate day of the week
            const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            if (!validDays.includes(day)) {
                return res.status(400).json({ success: false, data: 'Invalid day format. Use full day names, e.g., "Monday", "Tuesday".' });
            }

            // Validate date format
            if (!editCms.scheduledDate[0].date) {
                return res.status(400).json({ success: false, data: 'Provide a date' });
            }

            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date)) {
                return res.status(400).json({ success: false, data: 'Invalid date format. Use E.G "YYYY-MM-DD".' });
            }

            // Parse and validate the provided date
            const currentDate = new Date();
            const providedDate = new Date(date);

            // Check if the date is a valid calendar date and not in the past
            if (isNaN(providedDate.getTime())) {
                return res.status(400).json({ success: false, data: 'Invalid date format. Ensure it is a valid calendar date.' });
            }

            if (providedDate.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)) {
                return res.status(400).json({ success: false, data: 'The date cannot be in the past.' });
            }

            // Update the first object in the scheduledDate array
            if (updateCms.scheduledDate && updateCms.scheduledDate.length > 0) {
                updateCms.scheduledDate[0] = { day, time, date };
            } else {
                updateCms.scheduledDate = [{ day, time, date }];
            }
        }

        // Update the CMS document
        await updateCms.save();

        return res.status(201).json({ success: true, data: 'CMS message updated successfully' });
    } catch (error) {
        console.log('UNABLE TO UPDATE NEW CMS MESSAGE', error);
        res.status(500).json({ success: false, data: 'Unable to update a new CMS message' });
    }
}

//DELETE CMS
export async function deleteCms(req, res) {
    const { id } = req.body
    if(!id){
        return res.status(400).json({ success: false, data: 'Provide a CMS ID'})
    }
    try {
        const getCms = await CmsModel.findByIdAndDelete({ _id: id })      

        res.status(201).json({ success: true, data: 'CMS data is deleted successful' })
    } catch (error) {
        console.log('UNABLE TO DLETE CMS', error)
        res.status(500).json({ success: false, data: 'Unable to delete CMS data' })
    }
}

//GET ALL CMS DATA
export async function getAllCms(req, res) {
    try {
        const data = await CmsModel.find()

        res.status(200).json({ success: false, data: data })
    } catch (error) {
        console.log('UNABLE TO GET ALL CMS DATA', error)
        res.status(500).json({ success: false, data: 'Unable to get CMS data' })
    }
}

//GET A CMS DATA
export async function getCms(req, res) {
    const { id } = req.params
    if(!id){
        return res.status(400).json({ success: false, data: 'Provide a CMS ID' })
    }
    try {
        const data = await CmsModel.findById({ _id: id })

        if(!data){
            return res.status(404).json({ success: false, data: 'No CMS found with this ID' })
        }

        res.status(200).json({ success: false, data: data })
    } catch (error) {
        console.log('UNABLE TO GET ALL CMS DATA', error)
        res.status(500).json({ success: false, data: 'Unable to get CMS data' })
    }
}