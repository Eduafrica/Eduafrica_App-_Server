import {  OAuth2Client } from "google-auth-library"
import { registerMail } from "../middleware/sendEmail.js";
import { checkRequiredFields, generateOtp, generateUniqueCode } from "../middleware/utils.js";
import OtpModel from "../models/Otp.js";
import StudentModel from "../models/Student.js";
import sendEmail from "../middleware/mailer.js";
import Mailgen from "mailgen";
import crypto from 'crypto'
import CardDeatilsModel from "../models/CardDetails.js";
import moment from 'moment';
const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
        name: 'Edu Africa',
        link: `${process.env.APP_LINK}`
    }
})

//REGISTER STUDENT
export async function registerUser(req, res) {
    const { displayName, name, password, confirmPassword, email, allowNotifications, intrestedCourses, preferredLanguage, country } = req.body
    if (!email) {
        return res.status(400).json({ success: false, data: 'Please your email address' });
    }
    if (!displayName) {
        return res.status(400).json({ success: false, data: 'Please your display name' });
    }
    if (!password) {
        return res.status(400).json({ success: false, data: 'Please provide a password' });
    }
    if (!confirmPassword) {
        return res.status(400).json({ success: false, data: 'Confirm Password is required' });
    }
    if (!name) {
        return res.status(400).json({ success: false, data: 'User name is required' });
    }
    if (!country) {
        return res.status(400).json({ success: false, data: 'Provide a country' });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(!emailRegex.test(email)){
        return res.status(401).json({ success: false, data: 'Invalid Email Address' })
    }

    if (password.length < 6) {
        return res.status(400).json({ success: false, data: 'Passwords must be at least 6 characters long' });
    }

    const specialChars = /[!@#$%^&*()_+{}[\]\\|;:'",.<>?]/;
    if (!specialChars.test(password)) {
        return res.status(400).json({ success: false, data: 'Passwords must contain at least one special character' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, data: 'Passwords do not match' });
    }
    try {
        const existingEmail = await StudentModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ success: false, data: 'Email already exists. Please use another email' });
        }

        const generatedStudentCode = await generateUniqueCode(6)
        console.log('STUDENT CODE>>', `EA${generatedStudentCode}`)

        const user = await StudentModel.create({ name, password, email, displayName, allowNotifications, intrestedCourses, preferredLanguage, country, studentID: `EA${generatedStudentCode}` });
        console.log('USER CREATED');

        const otpCode = await generateOtp(user._id, 'student')
        console.log('OTP', otpCode)

        try {
            await registerMail({
                username: `${user.name}`,
                userEmail: user.email,
                subject: 'EDTRCH AFRIC SIGNUP SUCCESSFUL',
                intro: 'Verify your Edtech Afric email address',
                instructions: `Account Signed Up Successfully. Enter Otp to verify your Email Address. Your OTP code is: ${otpCode} Note Otp is Valid for One (1) Hour.`,
                outro: `If you did not Sign Up, please ignore this email and report.
                `,
                otp: otpCode,
            });

            return res.status(200).json({ success: true, data: `Signup successful check otp code sent to ${user.email} to activate account` });
        } catch (error) {
            console.log('ERROR SENDING VERIFY OTP EMAIL', error);
        }

        res.status(201).json({ success: true, data: 'Account created' })
        
    } catch (error) {
        console.log('UNABLE TO REGISTER USER', error)
        res.status(500).json({ success: false, data: 'Failed to create account' })
    }
}

//LOGIN STUDENT
export async function login(req, res) {
    const { email, password } = req.body 
    if(!email || !password){
        return res.status(401).json({ success: false, data: 'Please provide an email and password'})
    }

    try {
        const user = await StudentModel.findOne({ email: email }).select('+password')
    
        if(!user){
            return res.status(401).json({ success: false, data: 'Invalid User'})
        }

        const isMatch = await user.matchStudentPasswords(password);

        if(!isMatch){
            return res.status(401).json({ success: false, data: 'Invalid credentials'})
        }

        if(!user.verified){
            let otpExist = await OtpModel.findOne({ userId: user._id})
            if(!otpExist){
                const otpCode = await generateOtp(user._id, 'student')
                console.log('OTP CODE', otpCode)

                try {
                    await registerMail({
                        username: `${user.firstName} ${user.lastName}`,
                        userEmail: user.email,
                        subject: 'EDTRCH AFRIC SIGNUP SUCCESSFUL',
                        intro: 'Verify your Edtech Afric email address',
                        instructions: 'Account Signed Up Successfully. Enter Otp to verify your Email Address. Note Otp is Valid for One (1) Hour.',
                        outro: `If you did not Sign Up, please ignore this email and report.
                        `,
                        otp: otpCode,
                    });
        
                    return res.status(200).json({ success: true, isVerified: false, data: `Signup successful check otp code sent to ${user.email} to activate account` });
                } catch (error) {
                    console.log('ERROR SENDING VERIFY OTP EMAIL', error);
                }
            } else {
                return res.status(200).json({ success: false, isVerified: false, data: 'Account Not Verified. An Email Has been sent to You Please Verify Account'})
            }
        }

        //SEND TOKEN
        const token = user.getStudentSignedToken();
        const expiryDate = new Date(Date.now() + 10 * 60 * 60 * 1000)
        const { resetPasswordToken, resetPasswordExpire, password: hashedPassword, _id, ...userData } = user._doc
        res.cookie('edtechafric', token, { httpOnly: true, expires: expiryDate, sameSite: 'None', secure: true } ).status(201).json({ success: true, token: token, isVerified: true, data: {success: true, data: userData }})
        
    } catch (error) {
        console.log(`UNABLE TO LOGIN USER WITH EMAIL: (${email})`, error)
        res.status(500).json({ success: false, data: 'Failed to login user' })
    }
}

//FORGOT PASSWORD
export async function forgotPassword(req, res) {
    const { email } = req.body
    if(!email){
        return res.status(404).json({ success: false, data: 'Provide your registered email address'})
    }
    try {
        const user = await StudentModel.findOne({ email });

        if(!user){
            return res.status(404).json({ success: false, data: 'Email Does Not Exist'})
        }

        const resetToken = user.getStudentResetPasswordToken()

        await user.save()
        //const resetUrl = `${process.env.APP_LINK}/reset-password/${resetToken}`
        const resetUrl = `<a href=“eduafrica-mobile://reset-password/${resetToken}”></a>`
        console.log('RESET TOKEN', resetToken)
        try {
            // send mail
            const emailContent = {
                body: {
                    intro: 'You have Requested a password reset.',
                    action: {
                        instructions: 'Please click the following button to reset your password. Link Expires in 10 mintues',
                        button: {
                            color: '#00BF63',
                            text: 'Reset Your Password',
                            link: resetUrl
                        },
                    },
                    outro: `
                        Reset link: ${resetUrl}

                        If you did not request a password reset, please ignore this email.
                    `
                },
            };

            const emailTemplate = mailGenerator.generate(emailContent)
            const emailText = mailGenerator.generatePlaintext(emailContent)

            try {
                await sendEmail({
                    to: user.email,
                    subject: 'Password Reset Request',
                    text: emailTemplate
                })
                res.status(200).json({success: true, msg: 'Email sent', data: email })
                
            } catch (error) {
                console.log('FORGOT PASSWORD EMAIL ERROR?>', error)
            }
            
        } catch (error) {
            user.resetPasswordToken = undefined
            user.resetPasswordExpire = undefined

            await user.save()
            console.log('Email could not be sent >>',error)
            return res.status(500).json({ success: false, data: 'Email could not be sent' })
        }
    } catch (error) {
        console.log('ERROR GENERATING STUDENT PASSWORD RESET LINK', error)
        res.status(500).json({ success: false, data: 'Something went wrong' })
    }
}

//STUDENT RESET PASSWORD
export async function resetPassword (req, res){
    const { password, confirmPassword } = req.body
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex')

    try {
        if (!password || !confirmPassword) {
            return res.status(400).json({ success: false, data: 'Password and confirm password are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, data: 'Passwords must be at least 8 characters long' });
        }

        const specialChars = /[!@#$%^&*()_+{}[\]\\|;:'",.<>?]/;
        if (!specialChars.test(password)) {
            return res.status(400).json({ success: false, data: 'Passwords must contain at least one special character' });
        }
    
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, data: 'Passwords do not match' });
        }
    

        const user = await StudentModel.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now()}
        })

        if(!user){
            return  res.status(400).json({ success: false, data: 'Invalid Reset Token'})
        }

        const isMatch = await user.matchStudentPasswords(password);
        if(isMatch){
            return res.status(401).json({ success: false, data: 'Old Password must not match new password' })
        }

        user.password = password
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined

        await user.save();

        res.status(201).json({
            success: true,
            data: 'Password Reset successful'
        })
    } catch (error) {
        console.log('ERROR RESETING USER PASSWORD', error)
        res.status(500).json({ success: false, data: 'Something went wrong. Unable to process reset password request' })
    }
}

//STUDENT UPDATE PROFILE
export async function updateProfile(req, res){
    const { name, displayName, country, intrestedCourses, preferredLanguage, allowNotifications } = req.body
    try {
        const updateUser = await StudentModel.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    name,
                    displayName,
                    country,
                    intrestedCourses,
                    preferredLanguage,
                    allowNotifications,
                }
            },
            { new: true }
        )

        res.status(200).json({ success: true, data: 'Profile Updated Successful' })
    } catch (error) {
        console.log('UNABLE TO UPDATE STUDENT PROFILE', error)
        res.status(500).json({ success: false, data: 'Unable to update student profile' })
    }
}

//CREATE NEW CARD DETAILS
export async function newPaymentCard(req, res) {
    const { _id } = req.user
    const { cardType, cardNumber, cardName, expiryDate, cvv, defaultCard } = req.body
    try {
        const requiredFields = ['cardType', 'cardNumber', 'cardName', 'expiryDate', 'cvv',];
        checkRequiredFields(requiredFields, req.body, res);
        if (validationResponse) {
            return;
        }
        if(cvv.length !== 3){
            return res.status(400).json({ success: false, data: 'Invalid CVV code' })
        }

        const cardObject = {
            cardType,
            cardNumber,
            cardName,
            expiryDate,
            cvv,
            defaultCard: defaultCard === true ? true : false
        }

        console.log('object')
        const newCard =  await CardDeatilsModel.create({
            userId: _id
        })
        newCard.card.push(cardObject)
        await newCard.save()

        res.status(201).json({ success: true, data: 'New Payment card added' })

    } catch (error) {
        console.log('UNABLE TO CREATE CARD DETAILS', error)
        res.status(500).json({ success: false, data: 'Unable to create card details' })
    }   
}

//UPDATE CARD DETAILS
export async function updatePaymentCard(req, res) {
    const { userId: _id } = req.user
    const { cardType, cardNumber, cardName, expiryDate, cvv, defaultCard } = req.body

    try {
        const cardDetails = await CardDeatilsModel.findOne({ userId });

        if (!cardDetails) {
          return res.status(404).json({ success: false, data: 'Card details not found' });
        }

        const card = cardDetails.card._id(req.body._id);

        if (!card) {
          return res.status(404).json({ success: false, data: 'Card not found' });
        }

        if (defaultCard === true) {
            // If the updated card is set to defaultCard, we need to unset it for other cards
            cardDetails.card.forEach(existingCard => {
                if (existingCard._id.toString() !== req.body._id.toString()) {
                    existingCard.defaultCard = false;  // Set other cards' defaultCard to false
                }
            });
        }

        // Step 3: 
        card.cardType = cardType || card.cardType;
        card.cardName = cardName || card.cardName;
        card.cardNumber = cardNumber || card.cardNumber;
        card.expiryDate = expiryDate || card.expiryDate;
        card.cvv = cvv || card.cvv;
        card.defaultCard = defaultCard === true ? true : card.defaultCard;

        await cardDetails.save();

        return res.status(200).json({
            success: true,
            data: 'Card Details Updated Succssful'
        });
    
    } catch (error) {
        console.log('UNABLE TO UPDATE CARD DETAILS', error)
        res.status(500).json({ success: false, data: 'Unable to create card details' })
    }
}

//DELETE CARD DETAILS
export async function deletePaymentCard(req, res) {
    const { userId: _id } = req.user

    try {
        const cardDetails = await CardDeatilsModel.findOne({ userId });

        if (!cardDetails) {
          return res.status(404).json({ success: false, data: 'Card details not found' });
        }

        const card = cardDetails.card._id(req.body._id);

        if (!card) {
          return res.status(404).json({ success: false, data: 'Card not found' });
        }

        cardDetails.card.pull({ _id: req.body._id });  
        await cardDetails.save();

        return res.status(200).json({
            success: true,
            data: 'Card deleted successfully'
        });
    } catch (error) {
        console.log('UNABLE TO CREATE CARD DETAILS', error)
        res.status(500).json({ success: false, data: 'Unable to create card details' })
    }
}

// SET LEARNING REMINDER
export async function setLearningReminder(req, res) {
    const { _id } = req.user;
    const { day, time } = req.body;

    if(!day){
        return res.status(400).json({ success: false, data: 'Provide day'})
    }

    if(!time){
        return res.status(400).json({ success: false, data: 'Provide time'})
    }

    try {
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

        // Find user and add the learning reminder
        const user = await StudentModel.findOne({ _id });
        user.learningReminder.push({ day, time });

        await user.save();

        return res.status(200).json({
            success: true,
            data: 'Learning reminder added successfully',
        });
    } catch (error) {
        console.log('Error adding learning reminder:', error);
        return res.status(500).json({ success: false, data: 'Unable to set your reminder' });
    }
}

// DELETE LEARNING REMINDER
export async function deleteLearningReminder(req, res) {
    const { userId: _id } = req.user
    try {
        const reminder = await StudentModel.findById(userId)

        const card = reminder.learningReminder._id(req.body._id);

        if (!card) {
          return res.status(404).json({ success: false, data: 'Reminder not found' });
        }

        reminder.learningReminder.pull({ _id: req.body._id })
        await reminder.save()

        return res.status(200).json({
            success: true,
            data: 'Reminder deleted successfully'
        });
    } catch (error) {
        console.log('UNABLE TO DLETE LERARING REMINDER', error)
        res.status(500).json({ success: false, data: 'Internal server error' })
    }
}

//CHECK FOR REMINDER DUE DATE AND TIME
export async function checkLearningReminders() {
    try {
        // Get all users and their learningReminder arrays
        const users = await StudentModel.find({});

        // Get the current day and time in the required format
        const currentDay = moment().format('dddd'); // e.g., 'Monday'
        const currentTime = moment().format('h:mm A'); // e.g., '9:00 AM'

        users.forEach(user => {
            // Loop through each user's learningReminder array
            user.learningReminder.forEach(reminder => {
                const { day, time } = reminder;
                
                // Compare both the current day and time with the reminder's day and time
                if (currentDay === day && currentTime === time) {
                    console.log(`Reminder for user ${user.userId} on ${day} at ${time}`);
                }
            });
        });
    } catch (error) {
        console.log('Error checking learning reminders:', error);
    }
}

// Run the check every minute (60 seconds)
setInterval(checkLearningReminders, 60000);

//GET ALL STUDENT
export async function getAllStudent(req, res) {
    try {
        let allStudent
        allStudent = await StudentModel.find()

        if(allStudent?.length < 0){
            allStudent = []
        }

        const data = allStudent.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        
        res.status(200).json({ success: true, data: data })
    } catch (error) {
        console.log('UNABLE TO GET ALL STUDENT', error)
        res.status(500).json({ success: false, data: 'Unable to get all Student' })
    }
}

//GET A STUDENT
export async function getStudent(req, res) {
    const { _id } = req.params
    if(!_id){
        return res.status(400).json({ success: false, data: 'Student ID is required' })
    }
    try {
        const getStudent = await StudentModel.findById({ _id: _id })

        res.status(200).json({ success: true, data: getStudent })
    } catch (error) {
        console.log('UNABLE TO GET STUDENT', error)
        res.status(500).json({ success: false, data: 'Uanble to get student' })
    }
}

export async function toggleblock(req, res) {
    const { id } = req.body
    try {
        const getUser = await StudentModel.findById({ _id: id })
        
        if(!getUser){
            return res.status(404).json({ success: false, data: 'Student Account not Found' })
        }

        // Set getUser.blocked to its inverse (toggle blocked status)
        getUser.blocked = !getUser.blocked;

        // Save the updated user document
        await getUser.save();

        res.status(201).json({ 
            success: true, 
            data: `Account has been ${getUser.blocked ? 'blocked' : 'unblocked'}` 
        });

    } catch (error) {
        console.log('UNABLE TO BLOCK USER ACCOUNT', error)
        res.status(500).json({ success: false, data: 'Failed to perform blocking action on user account' })
    }
}





//OAUTH
export async function googleOAuth(req, res) {
    res.haeder('Access-Controll-Allow-Origin', 'http://localhost:9000')
    res.header('Referrer-Policy', 'no-referrer-when-downgrade')

    const redirectUrl = 'http://localhost:9000';

    const OAuth2ClientConfig = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUrl
    );

    const authorizeUrl = OAuth2ClientConfig.generateAuthUrl({
        access_type: 'offline',
        scope: 'https//www.googleapis.com/auth/userinfo.profile openid',
        prompt: 'consent'
    });

    console.log('URL', authorizeUrl)
}

//GET USER INFO FROM GOOGLE
export async function getUserDataFromGoogle(req, res) {
    const { access_token } = req.body
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`)

    const data = await response.json();

    console.log('DATA',data)
}

//GET STUDENTS ALL COURSE
export async function getStudentAllCourse(req, res) {
    const { _id, name } = req.user
    try {
        const studentCourses = await CourseModel.find({
            students: { $in: [_id] },
            isBlocked: false // to get only unblocked courses
        });

        res.status(200).json({ success: true, data: studentCourses });
    } catch (error) {
        console.log('UNABLE TO GET ALL COURSE OFFERED BY STUDENT', error)
        res.status(500).json({ success: false, data: `Unable to get courses offered by ${name}` })
    }
}

// GET STUDENT STATS
export async function getStudentStats(req, res) {
    const { stats } = req.params;
    console.log('STATSUS', stats)
    if(!stats){
        return
    }

    const getFilterDates = (value) => {
        const today = new Date();
        let startDate, endDate, previousStartDate, previousEndDate;

        switch (value) {
            case 'today':
                endDate = new Date(today);
                startDate = new Date(today.setDate(today.getDate() - 1));
                previousEndDate = new Date(startDate);
                previousStartDate = new Date(previousEndDate.setDate(previousEndDate.getDate() - 1));
                break;

            case '7days':
                endDate = new Date();
                startDate = new Date(today.setDate(today.getDate() - 7));
                previousEndDate = new Date(startDate);
                previousStartDate = new Date(previousEndDate.setDate(previousEndDate.getDate() - 7));
                break;

            case '30days':
                endDate = new Date();
                startDate = new Date(today.setDate(today.getDate() - 30));
                previousEndDate = new Date(startDate);
                previousStartDate = new Date(previousEndDate.setDate(previousEndDate.getDate() - 30));
                break;

            case '1year':
                endDate = new Date();
                startDate = new Date(today.setFullYear(today.getFullYear() - 1));
                previousEndDate = new Date(startDate);
                previousStartDate = new Date(previousEndDate.setFullYear(previousEndDate.getFullYear() - 1));
                break;

            case 'alltime':
                startDate = new Date(0); // Unix epoch start
                endDate = new Date();
                previousStartDate = null;
                previousEndDate = null;
                break;

            default:
                throw new Error('Invalid stats value');
        }

        return { startDate, endDate, previousStartDate, previousEndDate };
    };

    const calculatePercentageChange = (current, previous) => {
        if (previous === 0) return { change: 100, percentage: '+' }; // Handle division by zero
        const change = ((current - previous) / previous) * 100;
        return {
            change: parseFloat(change.toFixed(2)),
            percentage: change >= 0 ? '+' : '-',
        };
    };

    try {
        const { startDate, endDate, previousStartDate, previousEndDate } = getFilterDates(stats);

        const selectedPeriodData = await StudentModel.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: null,
                    totalStudents: { $sum: 1 },
                    activeStudents: { $sum: { $cond: [{ $eq: ["$verified", true] }, 1, 0] } },
                    inactiveStudents: { $sum: { $cond: [{ $eq: ["$verified", false] }, 1, 0] } },
                    blacklistStudents: { $sum: { $cond: [{ $eq: ["$blocked", true] }, 1, 0] } },
                },
            },
        ]);

        let previousPeriodData = [];
        if (previousStartDate && previousEndDate) {
            previousPeriodData = await StudentModel.aggregate([
                { $match: { createdAt: { $gte: previousStartDate, $lte: previousEndDate } } },
                {
                    $group: {
                        _id: null,
                        totalStudents: { $sum: 1 },
                        activeStudents: { $sum: { $cond: [{ $eq: ["$verified", true] }, 1, 0] } },
                        inactiveStudents: { $sum: { $cond: [{ $eq: ["$verified", false] }, 1, 0] } },
                        blacklistStudents: { $sum: { $cond: [{ $eq: ["$blocked", true] }, 1, 0] } },
                    },
                },
            ]);
        }

        // Ensure data structure
        const currentData = selectedPeriodData[0] || { totalStudents: 0, activeStudents: 0, inactiveStudents: 0, blacklistStudents: 0 };
        const previousData = previousPeriodData[0] || { totalStudents: 0, activeStudents: 0, inactiveStudents: 0, blacklistStudents: 0 };

        // Calculate percentage changes with indicators
        const statsComparison = [
            {
                current: currentData.totalStudents,
                previous: previousData.totalStudents,
                id: 'totalstudent',
                name: 'Total Student',
                ...calculatePercentageChange(currentData.totalStudents, previousData.totalStudents),
            },
            {
                current: currentData.activeStudents,
                previous: previousData.activeStudents,
                id: 'totalactivestudent',
                name: 'Total Active Student',
                ...calculatePercentageChange(currentData.activeStudents, previousData.activeStudents),
            },
            {
                current: currentData.inactiveStudents,
                previous: previousData.inactiveStudents,
                id: 'totalinactivestudent',
                name: 'Total Inactive Student',
                ...calculatePercentageChange(currentData.inactiveStudents, previousData.inactiveStudents),
            },
            {
                current: currentData.blacklistStudents,
                previous: previousData.blacklistStudents,
                id: 'totalblackliststudent',
                name: 'Total Blacklist Student',
                ...calculatePercentageChange(currentData.blacklistStudents, previousData.blacklistStudents),
            },
        ];

        res.status(200).json({ success: true, data: statsComparison });
    } catch (error) {
        console.error('UNABLE TO GET STUDENT STATS', error);
        res.status(500).json({ success: false, data: 'Unable to get student stats' });
    }
}
