import sendEmail from "../middleware/mailer.js";
import CmsModel from "../models/cms.js";
import InstructorModel from "../models/Instructors.js";
import organizationModel from "../models/Organization.js";
import StudentModel from "../models/Student.js";

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
    if(!type){
        return res.status(400).json({ success: false, data: 'Provide a message'})
    }
    if(!['pushnotification', 'promotionalmail'].includes(type)){
        return res.status(400).json({ success: false, data: 'CMS type must be either "pushnotification" or "promotionalmail"'})
    }
    if(!status){
        return res.status(400).json({ success: false, data: 'Provide a CMS status'})
    }
    console.log('type', type)
    if(!['Draft', 'Scheduled', 'Published'].includes(status)){
        return res.status(400).json({ success: false, data: 'CMS status must be either "Draft" or "Scheduled" or "Published"'})
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

        //send mail notifications
        if(status === 'Published' && type === 'promotionalmail'){
            //send mail notifications
            let recipients = [];
            if (accountType === 'student') {
                const students = await StudentModel.find({}, 'email name'); // Fetch emails and names
                recipients = students.map(student => ({ email: student.email, name: student.name || '' }));
            } else if (accountType === 'instructor') {
                const instructors = await InstructorModel.find({}, 'email name'); // Fetch emails and names
                recipients = instructors.map(instructor => ({ email: instructor.email, name: instructor.name || '' }));
            } else if (accountType === 'organization') {
                const instructors = await organizationModel.find({}, 'email name'); // Fetch emails and names
                recipients = instructors.map(instructor => ({ email: instructor.email, name: instructor.name || '' }));
            } else if (accountType === 'allUsers') {
                const students = await StudentModel.find({}, 'email name');
                const instructors = await InstructorModel.find({}, 'email name');
                const organizations = await organizationModel.find({}, 'email name');
                recipients = [
                    ...students.map(student => ({ email: student.email, name: student.name || '' })),
                    ...instructors.map(instructor => ({ email: instructor.email, name: instructor.name || '' })),
                    ...organizations.map(organization => ({ email: organization.email, name: organization.name || '' })),
                ];
            } else if (accountType === 'custom') {
                recipients = users.map(email => ({ email, name: '' })); // Use custom emails
            }

            // Send emails
            const emailLogoUrl = 'https://i.ibb.co/Yf12g4d/logo.png'; // Replace with your logo URL
            const twUrl = 'https://i.ibb.co/TrkW705/Vector.png'; //
            const fbUrl = 'https://i.ibb.co/Qd51cS7/Vector.png'; //
            const igUrl = 'https://i.ibb.co/BwXQBCr/Social-icon.png'; //
            const currentYear = new Date().getFullYear();
    
            for (const recipient of recipients) {
                const emailContent = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                        <div style="display: flex; align-items: left; margin-bottom: 20px;">
                            <img src="${emailLogoUrl}" alt="Logo" style="width: 100px; height: auto; margin-right: 20px;">
                        </div>
                        <br />
                        <p>Hi, ${recipient.name || ''},</p>
                        ${caption && `<p style="font-size: 19px; color: #00BF63;">${caption}</p>`}
                        <br />
                        <p style="color: #344054;">${message}</p>
                        ${image ? `<div><img src="${image}" alt="Promotional Image" style="max-width: 100%; height: auto; margin-top: 20px;"></div>` : ''}
                        <br />
                        ${url && `<a href=${url} style="background-color: #00BF63; color: #fff; width: 100% border-radius: 10px; padding: 16px; text-decoration: none;">Visit</a>`}
                        <footer style="margin-top: 20px; font-size: 12px; color: #344054;">
                            <p style="text-decoration: none;">This email was sent to <span style="color: #00BF63;">${recipient.email}</span>. If you'd rather not receive this kind of email, you can <span style="color: #00BF63;" >unsubscribe</span> or <span style="color: #00BF63;">manage your email preferences.</span></p>
                            <p>© ${currentYear} EduAfrica</p>
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 20px;">
                                <img src="${emailLogoUrl}" alt="Logo" style="width: 100px; height: auto;">
                                <div style="display: flex; align-items: center; gap: 8px;>
                                    <img src="${twUrl}" alt="Social Media Icons" style="width: 20px; height: auto;">
                                    <img src="${fbUrl}" alt="Social Media Icons" style="width: 20px; height: auto;">
                                    <img src="${igUrl}" alt="Social Media Icons" style="width: 20px; height: auto;">
                                </div>
                            </div>
                        </footer>
                    </div>
                `;
    
                // Send email
                sendEmail({
                    to: recipient.email,
                    subject: title,
                    text: emailContent,
                });
            }
        }


        return res.status(201).json({ success: true, data: 'CMS message created successfully' });
    } catch (error) {
        console.log('UNABLE TO CREATE NEW CMS MESSAGE', error);
        res.status(500).json({ success: false, data: 'Unable to create a new CMS message' });
    }
}

//HANDLE SCHEDULED CMS

//UPDATE CMS
export async function updateCms(req, res) {
    const { _id, title, message, type, status, image, scheduled, url, caption, users, allUsers, accountType } = req.body;
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
                accountType,
                users: accountType !== 'custom' ? [] : users?.length > 0 ? users : updateCms?.users ,
                allUsers,
                url,
                caption
            },
            { new: true }
        );
        await editCms.save()
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

                //send mail notifications
                if(updateCms?.status === 'Published' && updateCms?.type === 'promotionalmail'){
                    //send mail notifications
                    let recipients = [];
                    if (updateCms?.accountType === 'student') {
                        const students = await StudentModel.find({}, 'email name'); // Fetch emails and names
                        recipients = students.map(student => ({ email: student.email, name: student.name || '' }));
                    } else if (updateCms?.accountType === 'instructor') {
                        const instructors = await InstructorModel.find({}, 'email name'); // Fetch emails and names
                        recipients = instructors.map(instructor => ({ email: instructor.email, name: instructor.name || '' }));
                    } else if (updateCms?.accountType === 'organization') {
                        const instructors = await organizationModel.find({}, 'email name'); // Fetch emails and names
                        recipients = instructors.map(instructor => ({ email: instructor.email, name: instructor.name || '' }));
                    } else if (updateCms?.accountType === 'allUsers') {
                        const students = await StudentModel.find({}, 'email name');
                        const instructors = await InstructorModel.find({}, 'email name');
                        const organizations = await organizationModel.find({}, 'email name');
                        recipients = [
                            ...students.map(student => ({ email: student.email, name: student.name || '' })),
                            ...instructors.map(instructor => ({ email: instructor.email, name: instructor.name || '' })),
                            ...organizations.map(organization => ({ email: organization.email, name: organization.name || '' })),
                        ];
                    } else if (updateCms?.accountType === 'custom') {
                        recipients = editCms?.users.map(email => ({ email, name: '' })); // Use custom emails
                    }
        
                    // Send emails
                    const emailLogoUrl = 'https://i.ibb.co/Yf12g4d/logo.png'; // Replace with your logo URL
                    const twUrl = 'https://i.ibb.co/TrkW705/Vector.png'; //
                    const fbUrl = 'https://i.ibb.co/Qd51cS7/Vector.png'; //
                    const igUrl = 'https://i.ibb.co/BwXQBCr/Social-icon.png'; //
                    const currentYear = new Date().getFullYear();
                    console.log('editCms',editCms)
                    for (const recipient of recipients) {
                        const emailContent = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                                <div style="display: flex; align-items: left; margin-bottom: 20px;">
                                    <img src="${emailLogoUrl}" alt="Logo" style="width: 100px; height: auto; margin-right: 20px;">
                                </div>
                                <br />
                                <p>Hi, ${recipient.name || ''},</p>
                                ${editCms?.caption && `<p style="font-size: 19px; color: #00BF63;">${editCms?.caption}</p>`}
                                <br />
                                <p style="color: #344054; font-size: 17px;">${editCms?.message}</p>
                                ${editCms?.image ? `<div><img src="${editCms?.image}" alt="Promotional Image" style="max-width: 100%; height: auto; margin-top: 20px;"></div>` : ''}
                                <br />
                                ${editCms?.url && `<a href=${editCms?.url} style="background-color: #00BF63; color: #fff; width: 100% border-radius: 10px; padding: 16px; text-decoration: none;">Visit</a>`}
                                <footer style="margin-top: 20px; font-size: 12px; color: #344054;">
                                    <p style="text-decoration: none;">This email was sent to <span style="color: #00BF63;">${recipient.email}</span>. If you'd rather not receive this kind of email, you can <span style="color: #00BF63;" >unsubscribe</span> or <span style="color: #00BF63;">manage your email preferences.</span></p>
                                    <p>© ${currentYear} EduAfrica</p>
                                    <div style="width: 100%; display: flex; align-items: center; justify-content: space-between; margin-top: 20px;">
                                        <img src="${emailLogoUrl}" alt="Logo" style="width: 100px; height: auto;">
                                        <div style="display: flex; align-items: center; gap: 8px;>
                                            <img src="${twUrl}" alt="Social Media Icons" style="width: 20px; height: auto;">
                                            <img src="${fbUrl}" alt="Social Media Icons" style="width: 20px; height: auto;">
                                            <img src="${igUrl}" alt="Social Media Icons" style="width: 20px; height: auto;">
                                        </div>
                                    </div>
                                </footer>
                            </div>
                        `;
            
                        // Send email
                        sendEmail({
                            to: recipient.email,
                            subject: title,
                            text: emailContent,
                        });
                    }
                }
        

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