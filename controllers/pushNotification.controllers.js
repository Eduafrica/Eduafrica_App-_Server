import webpush from 'web-push';
import PushNotificationModel from '../models/PushNotifications.js';
import CmsModel from '../models/cms.js';
import admin from '../middlewares/firebase.js';

const apiKeys = {
    publicKey: process.env.WEB_PUSH_PUBLIC_KEY,
    privateKey: process.env.WEB_PUSH_PRIVATE_KEY
}

webpush.setVapidDetails(
    `mailto:${process.env.NODEMAILER_USER}`,
    apiKeys.publicKey,
    apiKeys.privateKey
)

export async function saveSubscription(req, res) {
    console.log('PUSH NOTIFICATION DATA', req.body);
    const { data } = req.body;
    const { name, email } = req.user

    // Validate required fields

    if (!data) {
        return res.status(400).json({ success: false, data: 'Data is required is required. data {deviceToken: "token"}' });
    }

    try {
        // Find or create the document
        const deviceToken = data.deviceToken
        const getPushNotification = await PushNotificationModel.findOne({ 'data.deviceToken': deviceToken });
        if (!getPushNotification) {
            res.status(201).json({ success: true, data: 'Subscription saved!' });
            return;
        }

        const NewPushNotification = await PushNotificationModel.create({ data, name, email });

        const notificationPayload = {
            notification: {
                title: "NEW SUBSCRIPTION",
                body: 'Welcome to Eduafrica',
                //image, // Fixed image URL
            },
            token: data.deviceToken
        };

        try {
            // Send the notification using FCM
            console.log('SENDING PUSH NOTIFICATION', data.deviceToken)
            const response =  await admin.messaging().send(notificationPayload);
            console.log(`Notification sent to ${email}`, response);
        } catch (error) {
            console.error(`Failed to send notification to ${email}`, error);
        }

        res.status(201).json({ success: true, data: 'Subscription saved!' });
    } catch (error) {
        console.error('UNABLE TO SAVE SUBSCRIPTION', error);
        res.status(500).json({ success: false, data: 'Unable to save subscription request' });
    }
}

export async function sendNotification(req, res) {
    try {
        // Fetch the latest CMS data for each account type
        const cmsData = await CmsModel.aggregate([
            { $match: { type: 'pushnotification' } },
            { $sort: { createdAt: -1 } },
            { $group: { _id: "$accountType", latestData: { $first: "$$ROOT" } } }
        ]);
        
        if (!cmsData.length) {
            return res.status(404).json({ success: false, data: 'No push notification CMS data found.' });
        }
        
        // Process notifications for each account type
        for (const { latestData } of cmsData) {
            console.log('alive')
            const { accountType, message, title, allUsers, users } = latestData;

            let query = {};

            if (accountType === 'allUser') {
                // Send to all users
                query = {};
            } else if (accountType === 'custom') {
                // Send to users in the CMS users array
                query = { 'user.email': { $in: users } };
            } else {
                // Send to specific account type (student, instructor, organization)
                query = { 'user.accountType': accountType };
            }

            // Fetch matching subscribers from the PushNotificationModel
            const pushSubscribers = await PushNotificationModel.find(query).exec();

            if (!pushSubscribers.length) continue;

        // Prepare the notification payload for FCM
        const notificationPayload = {
            notification: {
                title,
                body: message,
                //image, // Optional: Include image if provided
            },
            //data: {
            //    url: url || '', // Optional: Include URL if provided
            //},
        };

        // Collect all device tokens
        const deviceTokens = pushSubscribers
            .map(subscriber => subscriber.data.deviceToken) // Extract device tokens
            .filter(token => token); // Filter out invalid or empty tokens

        if (deviceTokens.length === 0) {
            console.error('No valid device tokens found.');
            return { success: false, message: 'No valid device tokens found.' };
        }

        // Send notifications to all subscribers
        try {
            const multicastMessage = {
                tokens: deviceTokens, // Array of device tokens
                notification: notificationPayload.notification,
                data: notificationPayload.data,
            };

            // Use sendEachForMulticast to send notifications to multiple devices
            const response = await admin.messaging().sendEachForMulticast(multicastMessage);
            console.log(`Successfully sent notifications: ${response.successCount} successful, ${response.failureCount} failed.`);

            if (response.failureCount > 0) {
                response.responses.forEach((resp, index) => {
                    if (!resp.success) {
                        console.error(`Failed to send notification to ${pushSubscribers[index].email}:`, resp.error);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to send notifications:', error);
            return { success: false, message: 'Failed to send notifications.' };
        }

        // Update the CMS status to "published"
        await CmsModel.findByIdAndUpdate(cmsId, { status: 'published' });

        }

        res.status(200).json({ success: true, data: "Notifications sent successfully" });
    } catch (error) {
        console.error('UNABLE TO SEND NOTIFICATIONS', error);
        res.status(500).json({ success: false, data: 'Unable to send push notifications' });
    }
}

/**\
 * 
export async function sendNotificationById(cmsId) {
    try {
        // Find the CMS data by ID
        const cmsData = await CmsModel.findById(cmsId).exec();
        if (!cmsData) {
            console.error(`No CMS data found with ID: ${cmsId}`);
            return { success: false, message: 'CMS data not found.' };
        }

        const { accountType, message, title, allUsers, users, url, image } = cmsData;

        let query = {};

        if (accountType === 'allUser') {
            // Send to all users
            query = {};
        } else if (accountType === 'custom') {
            // Send to users in the CMS users array
            query = { 'user.email': { $in: users } };
        } else {
            // Send to specific account type (student, instructor, organization)
            query = { 'user.accountType': accountType };
        }

        // Fetch matching subscribers from the PushNotificationModel
        const pushSubscribers = await PushNotificationModel.find(query).exec();

        if (!pushSubscribers.length) {
            console.error('No subscribers found for the specified query.');
            return { success: false, message: 'No subscribers found.' };
        }

        // Send notifications to each subscriber
        for (const subscriber of pushSubscribers) {
            for (const user of subscriber.user) {
                const { email, data } = user;

                // Ensure the subscription object exists
                if (data && data.endpoint) {
                    const notificationPayload = JSON.stringify({
                        title,
                        message,
                        url,   // Optional: Use CMS URL if provided
                        image, // Optional: Use CMS image if provided
                    });

                    try {
                        await webpush.sendNotification(data, notificationPayload);
                        console.log(`Notification sent to ${email}`);
                    } catch (error) {
                        console.error(`Failed to send notification to ${email}`, error);
                    }
                }
            }
        }

        return { success: true, message: 'Notifications sent successfully.' };
    } catch (error) {
        console.error('UNABLE TO SEND NOTIFICATIONS', error);
        return { success: false, message: 'Unable to send push notifications.' };
    }
}
 */

export async function sendNotificationById(cmsId) {
    try {
        // Find the CMS data by ID
        const cmsData = await CmsModel.findById(cmsId).exec();
        if (!cmsData) {
            console.error(`No CMS data found with ID: ${cmsId}`);
            return { success: false, message: 'CMS data not found.' };
        }

        const { accountType, message, title, allUsers, users, url, image } = cmsData;

        // Build the query based on accountType
        let query = {};
        if (accountType === 'allUser') {
            // Send to all users
            query = {};
        } else if (accountType === 'custom') {
            // Send to specific users in the CMS users array
            query = { email: { $in: users } };
        } else {
            // Send to specific account type (e.g., passenger, driver)
            query = { accountType };
        }

        // Fetch matching subscribers from the PushNotificationModel
        const pushSubscribers = await PushNotificationModel.find(query).exec();

        if (!pushSubscribers.length) {
            console.error('No subscribers found for the specified query.');
            return { success: false, message: 'No subscribers found.' };
        }

        // Prepare the notification payload for FCM
        const notificationPayload = {
            notification: {
                title,
                body: message,
                //image, // Optional: Include image if provided
            },
            //data: {
            //    url: url || '', // Optional: Include URL if provided
            //},
        };

        // Collect all device tokens
        const deviceTokens = pushSubscribers
            .map(subscriber => subscriber.data.deviceToken) // Extract device tokens
            .filter(token => token); // Filter out invalid or empty tokens

        if (deviceTokens.length === 0) {
            console.error('No valid device tokens found.');
            return { success: false, message: 'No valid device tokens found.' };
        }

        // Send notifications to all subscribers
        try {
            const multicastMessage = {
                tokens: deviceTokens, // Array of device tokens
                notification: notificationPayload.notification,
                data: notificationPayload.data,
            };

            // Use sendEachForMulticast to send notifications to multiple devices
            const response = await admin.messaging().sendEachForMulticast(multicastMessage);
            console.log(`Successfully sent notifications: ${response.successCount} successful, ${response.failureCount} failed.`);

            if (response.failureCount > 0) {
                response.responses.forEach((resp, index) => {
                    if (!resp.success) {
                        console.error(`Failed to send notification to ${pushSubscribers[index].email}:`, resp.error);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to send notifications:', error);
            return { success: false, message: 'Failed to send notifications.' };
        }

        // Update the CMS status to "published"
        await CmsModel.findByIdAndUpdate(cmsId, { status: 'published' });

        return { success: true, message: 'Notifications sent successfully and CMS status updated to published.' };
    } catch (error) {
        console.error('UNABLE TO SEND NOTIFICATIONS:', error);
        return { success: false, message: 'Unable to send push notifications.' };
    }
}

/**
 export async function sendCustomNotification(message, email) {
     try {
         // Find the user in the PushNotificationModel by email
         const pushSubscribers = await PushNotificationModel.find({ 'user.email': email }).exec();
 
         if (!pushSubscribers.length) {
             console.error(`No subscriber found with email: ${email}`);
             return { success: false, message: 'Subscriber not found.' };
         }
 
         // Send the notification to the matching subscriber(s)
         for (const subscriber of pushSubscribers) {
             for (const user of subscriber.user) {
                 if (user.email === email) {
                     const { data } = user;
 
                     // Ensure the subscription object exists
                     if (data && data.endpoint) {
                         const notificationPayload = JSON.stringify({
                             title: 'Learning Reminder', // You can customize the title as needed
                             message,                   // The message passed as a parameter
                         });
 
                         try {
                             await webpush.sendNotification(data, notificationPayload);
                             console.log(`Notification sent to ${email}`);
                         } catch (error) {
                             console.error(`Failed to send notification to ${email}`, error);
                         }
                     }
                 }
             }
         }
 
         return { success: true, message: 'Notification sent successfully.' };
     } catch (error) {
         console.error('UNABLE TO SEND NOTIFICATION', error);
         return { success: false, message: 'Unable to send push notification.' };
     }
 }

 */

export async function sendCustomNotification({ email, title, message, url }) {
    console.log('cUSTOM pUSH NOTIFICATIOn', message)
    try {
        const image = 'https://i.ibb.co/HtNmMC5/Group-625936.png';

        const subscriber = await PushNotificationModel.findOne({ email });
        console.log('subscriber', subscriber,email )
        if (!subscriber) {
            console.error(`No subscriber found with email: ${email}`);
            return { success: false, message: 'Subscriber not found.' };
        }

        const { data } = subscriber;
        if (!data) {
            console.error(`No device token found for subscriber: ${subscriber.email}`);
            return { success: false, message: 'No device token found.' };
        }

        const notificationPayload = {
            notification: {
                title: title || 'EDU-AFRICA',
                body: message,
                //image,
            },
            //data: {
            //    url: url || '',
            //},
            token: data.deviceToken, // Use the device token directly
        };

        try {
            console.log('SENDING PUSH NOTIFICATION', data.deviceToken)
            const response = await admin.messaging().send(notificationPayload);
            console.log(`Custom Notification sent to ${subscriber.email}`, response);
            return { success: true, message: 'Notification sent successfully.' };
        } catch (error) {
            console.error(`Failed to send notification to ${subscriber.email}`, error);
            return { success: false, message: 'Failed to send notification.' };
        }
    } catch (error) {
        console.error('UNABLE TO SEND NOTIFICATION:', error);
        return { success: false, message: 'Unable to send notification.' };
    }
}