import cron from 'node-cron';
import CmsModel from '../models/cms.js';
import StudentModel from '../models/Student.js';
import InstructorModel from '../models/Instructors.js';
import organizationModel from '../models/Organization.js';
import sendEmail from '../middleware/mailer.js';
import { sendNotificationById } from './pushNotification.controllers.js';

// Function to check for scheduled emails and send them
async function checkAndSendScheduledEmails() {
    try {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        const currentTime = now.toLocaleTimeString('en-US', { hour12: false }); // Format as HH:mm:ss (24-hour clock)

        // Find all scheduled promotional emails whose time has come
        const scheduledEmails = await CmsModel.find({
            status: 'Scheduled',
            type: 'promotionalmail',
            scheduledDate: {
                $elemMatch: {
                    date: { $lte: currentDate }, // Date has arrived
                    time: { $lte: currentTime }, // Time has arrived
                },
            },
        });

        console.log(`Found ${scheduledEmails.length} scheduled emails to send.`);

        for (const email of scheduledEmails) {
            const recipients = [];

            // Fetch recipients based on accountType
            if (email.accountType === 'student') {
                const students = await StudentModel.find({}, 'email name');
                recipients.push(...students.map(student => ({ email: student.email, name: student.name || '' })));
            } else if (email.accountType === 'instructor') {
                const instructors = await InstructorModel.find({}, 'email name');
                recipients.push(...instructors.map(instructor => ({ email: instructor.email, name: instructor.name || '' })));
            } else if (email.accountType === 'organization') {
                const organizations = await organizationModel.find({}, 'email name');
                recipients.push(...organizations.map(org => ({ email: org.email, name: org.name || '' })));
            } else if (email.accountType === 'allUsers') {
                const students = await StudentModel.find({}, 'email name');
                const instructors = await InstructorModel.find({}, 'email name');
                const organizations = await organizationModel.find({}, 'email name');
                recipients.push(
                    ...students.map(student => ({ email: student.email, name: student.name || '' })),
                    ...instructors.map(instructor => ({ email: instructor.email, name: instructor.name || '' })),
                    ...organizations.map(org => ({ email: org.email, name: org.name || '' }))
                );
            } else if (email.accountType === 'custom') {
                recipients.push(...email.users.map(userEmail => ({ email: userEmail, name: '' })));
            }

            // Send emails to all recipients
            for (const recipient of recipients) {
                const emailContent = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                        <h1>${email.title}</h1>
                        <p>${email.message}</p>
                        <footer>
                            <p>This email was sent to ${recipient.email}. If you'd like to unsubscribe, click here.</p>
                        </footer>
                    </div>
                `;

                // Sending email
                await sendEmail({
                    to: recipient.email,
                    subject: email.title,
                    html: emailContent,
                });

                console.log(`Email sent to ${recipient.email}`);
            }

            // Update the email status to 'Published'
            email.status = 'Published';
            await email.save();
            console.log(`Updated email status to 'Published' for email ID: ${email._id}`);
        }
    } catch (error) {
        console.error('Error checking or sending scheduled emails:', error);
    }
}

// Function to check for scheduled push notification and send them
async function checkAndSendScheduledPushNotification() {
    try {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        const currentTime = now.toLocaleTimeString('en-US', { hour12: false }); // Format as HH:mm:ss (24-hour clock)

        // Find all scheduled promotional emails whose time has come
        const scheduledPushNotifications = await CmsModel.find({
            status: 'Scheduled',
            type: 'pushnotification',
            scheduledDate: {
                $elemMatch: {
                    date: { $lte: currentDate }, // Date has arrived
                    time: { $lte: currentTime }, // Time has arrived
                },
            },
        });

        console.log(`Found ${scheduledPushNotifications.length} scheduled push notification to send.`);

        for (const pushNotification of scheduledPushNotifications) {


        //send push notification
        if(updateCms.status === 'Scheduled' && updateCms.type === 'pushnotification'){
            const cmsId = pushNotification._id; // CMS ID
            const sendPushNotification = await sendNotificationById(cmsId);
            console.log('sendPushNotification data', sendPushNotification);
        }
            // Update the pushNotification status to 'Published'
            pushNotification.status = 'Published';
            await pushNotification.save();
            console.log(`Updated push notifications status to 'Published' for notification ID: ${email._id}`);
        }
    } catch (error) {
        console.error('Error checking or sending scheduled push notifications:', error);
    }
}

// Schedule the cron job to run every minute
cron.schedule('* * * * *', checkAndSendScheduledEmails);
cron.schedule('* * * * *', checkAndSendScheduledPushNotification);

