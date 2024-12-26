import {  OAuth2Client } from "google-auth-library"
import { registerMail } from "../middleware/sendEmail.js";
import { generateOtp, generateUniqueCode } from "../middleware/utils.js";
import OtpModel from "../models/Otp.js";
import InstructorModel from "../models/Instructors.js";
import sendEmail from "../middleware/mailer.js";
import Mailgen from "mailgen";
import crypto from 'crypto'

const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
        name: 'Edu Africa',
        link: `${process.env.APP_LINK}`
    }
})

export async function verifyInstructorDetails(req, res) {
    const { name, displayName, password, confirmPassword, phoneNumber, email } = req.body
    if(!email){
        return res.status(400).json({ success: false, data: 'Please provide your email address' });
    }
    if (!password) {
        return res.status(400).json({ success: false, data: 'Please provide a password' });
    }
    if (!confirmPassword) {
        return res.status(400).json({ success: false, data: 'Confirm Password is required' });
    }
    if (!phoneNumber) {
        return res.status(400).json({ success: false, data: 'Phone Number is required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, data: 'Passwords must be at least 6 characters long' });
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(!emailRegex.test(email)){
        return res.status(401).json({ success: false, data: 'Invalid Email Address' })
    }

    const specialChars = /[!@#$%^&*()_+{}[\]\\|;:'",.<>?]/;
    if (!specialChars.test(password)) {
        return res.status(400).json({ success: false, data: 'Passwords must contain at least one special character' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, data: 'Password and Confirm password do not match' });
    }
    try {
        const existingEmail = await InstructorModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ success: false, data: 'Email already exists. Please use another email' });
        }
        const existingPhoneNumber = await InstructorModel.findOne({ phoneNumber });
        if (existingPhoneNumber) {
            return res.status(400).json({ success: false, data: 'Phone Number already exists. Please use another email' });
        }

        res.status(200).json({ success: true, data: 'details verified successful' })
    } catch (error) {
        console.log('UNABLE TO VERIFY INSTRUCTORS DETAILS', error)
        res.status(500).json({ success: false, data: 'Unable to verify details' })
    }
}

//REGISTER INSTRUCTOR
export async function registerUser(req, res) {
    console.log('object', req.body)
    const { name, displayName, password, confirmPassword, phoneNumber, email, preferredLanguage, country, allowNotifications } = req.body
    console.log('objectdd', email)
    if(!email){
        return res.status(400).json({ success: false, data: 'Please provide your email address' });
    }
    if (!displayName) {
        return res.status(400).json({ success: false, data: 'Please provide your display name' });
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
    if (!phoneNumber) {
        return res.status(400).json({ success: false, data: 'Phone Number is required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ success: false, data: 'Passwords must be at least 6 characters long' });
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(!emailRegex.test(email)){
        return res.status(401).json({ success: false, data: 'Invalid Email Address' })
    }

    const specialChars = /[!@#$%^&*()_+{}[\]\\|;:'",.<>?]/;
    if (!specialChars.test(password)) {
        return res.status(400).json({ success: false, data: 'Passwords must contain at least one special character' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, data: 'Password and Confirm password do not match' });
    }
    try {
        const existingEmail = await InstructorModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ success: false, data: 'Email already exists. Please use another email' });
        }
        const existingPhoneNumber = await InstructorModel.findOne({ phoneNumber });
        if (existingPhoneNumber) {
            return res.status(400).json({ success: false, data: 'Phone Number already exists. Please use another phone number' });
        }

        const generatedInstructorCode = await generateUniqueCode(6)
        console.log('INSTRUCTOR CODE>>', `EA${generatedInstructorCode}`)

        const user = await InstructorModel.create({ 
            name, displayName, password, confirmPassword, email, preferredLanguage, phoneNumber, country, allowNotifications, instructorID: `EA${generatedInstructorCode}`
        });
        console.log('USER CREATED');

        const otpCode = await generateOtp(user._id, 'instructor')
        console.log('OTP', otpCode)

        try {
            await registerMail({
                username: `${user.name}`,
                userEmail: user.email,
                subject: 'EDTRCH AFRIC SIGNUP SUCCESSFUL',
                intro: 'Verify your Edtech Afric email address',
                instructions: 'Instructor Account Signed Up Successfully. Enter Otp to verify your Email Address. Note Otp is Valid for One (1) Hour.',
                outro: `If you did not Sign Up, please ignore this email and report.
                `,
                otp: otpCode,
            });

            return res.status(200).json({ success: true, data: `Signup successful check otp code sent to ${user.email} to activate account.` });
        } catch (error) {
            console.log('ERROR SENDING VERIFY OTP EMAIL', error);
        }

        res.status(201).json({ success: true, data: 'Account created' })
        
    } catch (error) {
        console.log('UNABLE TO REGISTER USER', error)
        res.status(500).json({ success: false, data: 'Failed to create account' })
    }
}

//LOGIN INSTRUCTOR
export async function login(req, res) {
    const { email, password } = req.body 
    if(!email || !password){
        return res.status(401).json({ success: false, data: 'Please provide an email and password'})
    }

    try {
        const user = await InstructorModel.findOne({ email: email }).select('+password')
    
        if(!user){
            return res.status(401).json({ success: false, data: 'Invalid User'})
        }

        const isMatch = await user.matchInstructorPasswords(password);

        if(!isMatch){
            return res.status(401).json({ success: false, data: 'Invalid credentials'})
        }

        if(!user.verified){
            let otpExist = await OtpModel.findOne({ userId: user._id})
            if(!otpExist){
                const otpCode = await generateOtp(user._id, 'instructor')
                console.log('OTP CODE', otpCode)

                try {
                    await registerMail({
                        username: `${user.name}`,
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
        const token = user.getInstructorSignedToken();
        const expiryDate = new Date(Date.now() + 10 * 60 * 60 * 1000)
        const { resetPasswordToken, resetPasswordExpire, password: hashedPassword, ...userData } = user._doc
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
        const user = await InstructorModel.findOne({ email });

        if(!user){
            return res.status(404).json({ success: false, data: 'Email Does Not Exist'})
        }

        const resetToken = user.getInstructorResetPasswordToken()

        await user.save()
        //const resetUrl = `http://google.com`
        //const resetUrl = `<a href=“eduafrica-mobile://reset-password/${resetToken}”></a>`
        const resetUrl = `Eduafrica_App://mobile://set_new_paasword?${resetToken}`
        console.log('RESET TOKEN', resetToken, 'LINK',resetUrl)
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

//INSTRUCTOR RESET PASSWORD
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
    

        const user = await InstructorModel.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now()}
        })

        if(!user){
            return  res.status(400).json({ success: false, data: 'Invalid Reset Token'})
        }

        const isMatch = await user.matchInstructorPasswords(password);
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
        console.log('ERROR RESETING INSTRUCTORS PASSWORD', error)
        res.status(500).json({ success: false, data: 'Something went wrong. Unable to process reset password request' })
    }
}

//INSTRUCTOR UPDATE PROFILE
export async function updateProfile(req, res){
    const { name, displayName, country, preferredLanguage, allowNotifications } = req.body
    try {
        const updateUser = await InstructorModel.findByIdAndUpdate(
            _id,
            {
                $set: {
                    name,
                    displayName,
                    country,
                    preferredLanguage,
                    allowNotifications,
                }
            },
            { new: true }
        )

        res.status(200).json({ success: true, data: 'Profile Updated Successful' })
    } catch (error) {
        console.log('UNABLE TO UPDATE INSTRUCTOR PROFILE', error)
        res.status(500).json({ success: false, data: 'Unable to update instructor profile' })
    }
}

//GET ALL INSTRUCTORS
export async function getAllInstructor(req, res) {
    try {
        let allInstructors
        allInstructors = await InstructorModel.find().select('-password')

        if(allInstructors?.length < 0){
            allInstructors = []
        }

        const data = allInstructors.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        
        res.status(200).json({ success: true, data: data })
    } catch (error) {
        console.log('UNABLE TO GET ALL INSTRUCTORS', error)
        res.status(500).json({ success: false, data: 'Unable to get all Instructors' })
    }
}

//GET A INSTRUCTOR
export async function getInstructor(req, res) {
    const { _id } = req.params
    if(!_id){
        return res.status(400).json({ success: false, data: 'Instructor ID is required' })
    }
    try {
        const getInstructor = await InstructorModel.findById({ _id: _id }).select('-password')

        res.status(200).json({ success: true, data: getInstructor })
    } catch (error) {
        console.log('UNABLE TO GET INSTRUCTOR', error)
        res.status(500).json({ success: false, data: 'Uanble to get instructor' })
    }
}

//TOGGLE BLOCK INSTRUCTOR
export async function toggleblock(req, res) {
    const { id } = req.body
    try {
        const getUser = await InstructorModel.findById({ _id: id })
        
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

// GET INSTRUCTOR STATS
export async function getInstructorStats(req, res) {
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

        const selectedPeriodData = await InstructorModel.aggregate([
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
            previousPeriodData = await InstructorModel.aggregate([
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
                id: 'totalinstructor',
                name: 'Total Instructors',
                ...calculatePercentageChange(currentData.totalStudents, previousData.totalStudents),
            },
            {
                current: currentData.activeStudents,
                previous: previousData.activeStudents,
                id: 'totalactiveinstructor',
                name: 'Total Active Instructors',
                ...calculatePercentageChange(currentData.activeStudents, previousData.activeStudents),
            },
            {
                current: currentData.inactiveStudents,
                previous: previousData.inactiveStudents,
                id: 'totalinactiveinstructor',
                name: 'Total Inactive Instructors',
                ...calculatePercentageChange(currentData.inactiveStudents, previousData.inactiveStudents),
            },
            {
                current: currentData.blacklistStudents,
                previous: previousData.blacklistStudents,
                id: 'totalblacklistinstructor',
                name: 'Total Blacklist Instructors',
                ...calculatePercentageChange(currentData.blacklistStudents, previousData.blacklistStudents),
            },
        ];

        res.status(200).json({ success: true, data: statsComparison });
    } catch (error) {
        console.error('UNABLE TO GET INSTRUCTOR STATS', error);
        res.status(500).json({ success: false, data: 'Unable to get instructor stats' });
    }
}