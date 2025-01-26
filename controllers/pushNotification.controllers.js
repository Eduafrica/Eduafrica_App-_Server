import webpush from 'web-push';
import PushNotificationModel from '../models/PushNotifications.js';
import CmsModel from '../models/cms.js';

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
    const { email, data, accountType } = req.body;

    // Validate required fields
    if (!email) {
        return res.status(400).json({ success: false, data: 'Email address is required' });
    }
    if (!accountType) {
        return res.status(400).json({ success: false, data: 'User account type is required' });
    }

    try {
        // Find or create the document
        let pushNotificationDoc = await PushNotificationModel.findOne();
        if (!pushNotificationDoc) {
            pushNotificationDoc = new PushNotificationModel({ user: [] });
        }

        // Check if the subscription already exists
        const existingSubscription = pushNotificationDoc.user.find(
            (u) => u.email === email && u.accountType === accountType
        );

        if (existingSubscription) {
            // Update the existing subscription
            existingSubscription.data = data;
        } else {
            // Add new subscription
            pushNotificationDoc.user.push({ email, data, accountType });
        }

        // Save the updated document
        await pushNotificationDoc.save();

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

            for (const subscriber of pushSubscribers) {
                for (const user of subscriber.user) {
                    const { email, data } = user;

                    // Ensure the subscription object exists
                    if (data && data.endpoint) {
                        const notificationPayload = JSON.stringify({
                            title,
                            message,
                            url: latestData.url, // Optional: Use CMS URL if provided
                            image: latestData.image, // Optional: Use CMS image if provided
                        });

                        try {
                            console.log('object', notificationPayload)
                            await webpush.sendNotification(data, notificationPayload);
                            console.log(`Notification sent to ${email}`);
                        } catch (error) {
                            console.error(`Failed to send notification to ${email}`, error);
                        }
                    }
                }
            }
        }

        res.status(200).json({ success: true, data: "Notifications sent successfully" });
    } catch (error) {
        console.error('UNABLE TO SEND NOTIFICATIONS', error);
        res.status(500).json({ success: false, data: 'Unable to send push notifications' });
    }
}

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