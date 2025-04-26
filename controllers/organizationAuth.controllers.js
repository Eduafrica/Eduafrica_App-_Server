import { registerMail } from "../middleware/sendEmail.js";
import { generateOtp, generateUniqueCode } from "../middleware/utils.js";
import OtpModel from "../models/Otp.js";
import organizationModel from "../models/Organization.js";
import Mailgen from "mailgen";
import sendEmail from "../middleware/mailer.js";
import crypto from 'crypto'

const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
        name: 'Edu Africa',
        link: `${process.env.APP_LINK}`
    }
})

//VERIFY ORGANIZATION DETAILS
export async function verifyOrganizationDetails(req, res) {
    const { name, displayName, password, confirmPassword, phoneNumber, email, organisationName } = req.body
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
    if (!organisationName) {
        return res.status(400).json({ success: false, data: 'Organisation Name is required' });
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
        const existingEmail = await organizationModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ success: false, data: 'Email already exists. Please use another email' });
        }
        const existingPhoneNumber = await organizationModel.findOne({ phoneNumber });
        if (existingPhoneNumber) {
            return res.status(400).json({ success: false, data: 'Phone Number already exists. Please use another phone number' });
        }
        const existingOrganizationName = await organizationModel.findOne({ organisationName: typeof organisationName === 'string' ? organisationName.trim() : organisationName });
        if (existingOrganizationName) {
            return res.status(400).json({ success: false, data: 'Organization with this name already exist. Please use another organization name' });
        }

        res.status(200).json({ success: true, data: 'details verified successful' })
    } catch (error) {
        console.log('UNABLE TO VERIFY ORGANIZATION DETAILS', error)
        res.status(500).json({ success: false, data: 'Unable to verify details' })
    }
}

//REGISTER USER
export async function registerUser(req, res) {
    const { name, password, confirmPassword, email, organisationName, organisationUrl, displayName, phoneNumber, whatsappNumber, allowNotifications, preferredLanguage, country } = req.body
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
    if (!phoneNumber) {
        return res.status(400).json({ success: false, data: 'Phone Number is required' });
    }
    if (!whatsappNumber) {
        return res.status(400).json({ success: false, data: 'Whatsapp Phone Number is required' });
    }
    if (!organisationName) {
        return res.status(400).json({ success: false, data: 'Provide Organization' });
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
        const existingEmail = await organizationModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ success: false, data: 'Email already exists. Please use another email' });
        }
        const existingPhoneNumber = await organizationModel.findOne({ phoneNumber });
        if (existingPhoneNumber) {
            return res.status(400).json({ success: false, data: 'Phone Number already exists. Please use another email' });
        }
        const existingWhatsappNumber = await organizationModel.findOne({ whatsappNumber });
        if (existingWhatsappNumber) {
            return res.status(400).json({ success: false, data: 'Whatsapp Number already exists. Please use another email' });
        }

        const generatedOrganizationCode = await generateUniqueCode(6)
        console.log('ORGANIZATION CODE>>', `EA${generatedOrganizationCode}`)


        const user = await organizationModel.create({
            name,
            password,
            confirmPassword,
            email,
            organisationName: typeof organisationName === 'string' ? organisationName.trim() : organisationName,
            organisationUrl: typeof organisationUrl === 'string' ? organisationUrl.trim() : organisationUrl,
            displayName,
            phoneNumber,
            whatsappNumber,
            allowNotifications,
            preferredLanguage,
            country,
            organisationID: `EA${generatedOrganizationCode}`
        });
        
        console.log('USER CREATED');
        

        const otpCode = await generateOtp(user._id, 'organization')
        console.log('OTP', otpCode)

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

            return res.status(200).json({ success: true, data: `successful check otp code sent to ${getUser.email} to activate account` });
        } catch (error) {
            console.log('ERROR SENDING VERIFY OTP EMAIL', error);
        }

        res.status(201).json({ success: true, data: 'Account created' })
        
    } catch (error) {
        console.log('UNABLE TO REGISTER USER', error)
        res.status(500).json({ success: false, data: 'Failed to create account' })
    }
}

//RESEND OTP
export async function resendOtp(req, res) {
    const { email } = req.body
    if(!email) return res.status(400).json({ success: false, data: 'Email address is required' })
    
    try {
        const getUser = await organizationModel.findOne({ email })
        if(!getUser) return res.status(404).json({ succes: false, data: 'Email does not exist' })
        //if(getUser.verified) return res.status(200).json({ success: false, data: 'Account already verified' })

        const otpCode = await generateOtp(getUser._id, 'organization')
        console.log('RESEND OTP CODE', otpCode)

        try {
            await registerMail({
                username: `${getUser.name}`,
                userEmail: getUser.email,
                subject: 'EDTRCH AFRICA VERIFY OTP',
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

        res.status(201).json({ success: true, data: 'OTP sent to email address' })
        
    } catch (error) {
        console.log('UNABLE TO RESEND OTP', error)
        res.status(500).json({ success: false, data: 'Unable to resend otp'})
    }
}

//LOGIN USER
export async function login(req, res) {
    const { email, password } = req.body 
    if(!email || !password){
        return res.status(401).json({ success: false, data: 'Please provide an email and password'})
    }

    try {
        const user = await organizationModel.findOne({ email: email }).select('+password')
    
        if(!user){
            return res.status(401).json({ success: false, data: 'Invalid User'})
        }

        const isMatch = await user.matchOrganizationPasswords(password);

        if(!isMatch){
            return res.status(401).json({ success: false, data: 'Invalid credentials'})
        }

        if(!user.verified){
            let otpExist = await OtpModel.findOne({ userId: user._id })
            if(!otpExist){
                const otpCode = await generateOtp(user._id, 'organization')
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
        const token = user.getOrganizationSignedToken();
        const expiryDate = new Date(Date.now() + 10 * 60 * 60 * 1000)
        const { resetPasswordToken, resetPasswordExpire, password: hashedPassword, ...userData } = user._doc
        res.cookie('edtechafric', token, { httpOnly: true, expires: expiryDate, sameSite: 'None', secure: true } ).status(201).json({ success: true, token: token, isVerified: true, data: {success: true, data: userData }})
        
    } catch (error) {
        console.log(`UNABLE TO LOGIN USER WITH EMAIL: (${email})`, error)
        res.status(500).json({ success: false, data: 'Failed to login user' })
    }
}

//GOOGLE AUTH LOGIN
export async function googleSignin(req, res) {
    const { photo, userName, userEmail } =  req.body
    try {
        const getEmail = await organizationModel.findOne({ email: userEmail })

        let newUser
        if(getEmail){
            getEmail.verified = true
            await getEmail.save()
            //SEND TOKEN
            const token = getEmail.getOrganizationSignedToken();
            const expiryDate = new Date(Date.now() + 10 * 60 * 60 * 1000)
            const { resetPasswordToken, resetPasswordExpire, password: hashedPassword, ...userData } = getEmail._doc
            res.cookie('edtechafric', token, { httpOnly: true, expires: expiryDate, sameSite: 'None', secure: true } ).status(201).json({ success: true, token: token, isVerified: true, data: {success: true, data: userData }})
             
        } else{
            const generatedOrganizationCode = await generateUniqueCode(6)
            console.log('ORGANIZATION CODE>>', `EA${generatedOrganizationCode}`)
    
            newUser = await organizationModel.create({
                email: userEmail, profileImg: photo, name: userName, displayName: userName, organisationID: `EA${generatedOrganizationCode}`, password: generatedOrganizationCode, verified: true
            })

            //SEND TOKEN
            const token = newUser.getOrganizationSignedToken();
            const expiryDate = new Date(Date.now() + 10 * 60 * 60 * 1000)
            const { resetPasswordToken, resetPasswordExpire, password: hashedPassword, ...userData } = newUser._doc
            res.cookie('edtechafric', token, { httpOnly: true, expires: expiryDate, sameSite: 'None', secure: true } ).status(201).json({ success: true, token: token, isVerified: true, data: {success: true, data: userData }})
        
        }

    } catch (error) {
        console.log('UNABLE TO PROCEED WITH GOOGLE SIGNIN', error)
        res.status(500).json({ success: false, data: 'Unable to proceed with google signin'})
    }
}

//FORGOT PASSWORD
export async function forgotPassword(req, res) {
    const { email } = req.body
    if(!email){
        return res.status(404).json({ success: false, data: 'Provide your registered email address'})
    }
    try {
        const user = await organizationModel.findOne({ email });

        if(!user){
            return res.status(404).json({ success: false, data: 'Email Does Not Exist'})
        }

        const resetToken = user.getOrganizationResetPasswordToken()

        await user.save()
        //const resetUrl = `${process.env.APP_LINK}/reset-password/${resetToken}`
        //const resetUrl = `<a href=“eduafrica-mobile://reset-password/${resetToken}”></a>`
        //const resetUrl = `<a href="Eduafrica_App://mobile://set_new_paasword?${resetToken}"></a>`
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

//ORGANIZATION RESET PASSWORD
export async function resetPassword (req, res){
    const { password, confirmPassword } = req.body
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex')

    try {
        if (!password || !confirmPassword) {
            return res.status(400).json({ success: false, data: 'Password and confirm password are required' });
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
    

        const user = await organizationModel.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now()}
        })

        if(!user){
            return  res.status(400).json({ success: false, data: 'Invalid Reset Token'})
        }

        const isMatch = await user.matchOrganizationPasswords(password);
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

//GET ALL ORGANIZATION
export async function getAllOrganizations(req, res) {
    try {
        let allOrganization
        allOrganization = await organizationModel.find().select('-password')

        if(allOrganization?.length < 0){
            allOrganization = []
        }

        const data = allOrganization.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        
        res.status(200).json({ success: true, data: data })
    } catch (error) {
        console.log('UNABLE TO GET ALL ORGANIZATIONS', error)
        res.status(500).json({ success: false, data: 'Unable to get all Oragnization' })
    }
}

//GET A ORGANIZATION
export async function getOrganization(req, res) {
    const { _id } = req.params
    if(!_id){
        return res.status(400).json({ success: false, data: 'Oragnization ID is required' })
    }
    try {
        const getOrganization = await organizationModel.findById({ _id: _id }).select('-password')

        res.status(200).json({ success: true, data: getOrganization })
    } catch (error) {
        console.log('UNABLE TO GET ORGANIZATION', error)
        res.status(500).json({ success: false, data: 'Uanble to get Oragnization' })
    }
}

//GET A INSTRUCTOR PROFILE
export async function getOrganizationProfile(req, res) {
    const { _id } = req.user
    if(!_id){
        return res.status(400).json({ success: false, data: 'Organization ID is required' })
    }
    try {
        const getOrganization = await organizationModel.findById({ _id: _id }).select('-password')

        res.status(200).json({ success: true, data: getOrganization })
    } catch (error) {
        console.log('UNABLE TO GET ORGANIZATION PROFILE', error)
        res.status(500).json({ success: false, data: 'Uanble to get organization profile' })
    }
}

//APPROVE AN ORGANIZATION FROM ADMIN

//TOGGLE BLOCK ORGANIZATION
export async function toggleblock(req, res) {
    const { id } = req.body
    try {
        const getUser = await organizationModel.findById({ _id: id })
        
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
        console.log('UNABLE TO BLOCK ORGANIZATION ACCOUNT', error)
        res.status(500).json({ success: false, data: 'Failed to perform blocking action on organization account' })
    }
}

// GET ORGANIZATIOn STATS
export async function getOrganizationStats(req, res) {
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

        const selectedPeriodData = await organizationModel.aggregate([
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
            previousPeriodData = await organizationModel.aggregate([
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
                id: 'totalorganization',
                name: 'Total Organization',
                ...calculatePercentageChange(currentData.totalStudents, previousData.totalStudents),
            },
            {
                current: currentData.activeStudents,
                previous: previousData.activeStudents,
                id: 'totalactiveorganization',
                name: 'Total Active Organization',
                ...calculatePercentageChange(currentData.activeStudents, previousData.activeStudents),
            },
            {
                current: currentData.inactiveStudents,
                previous: previousData.inactiveStudents,
                id: 'totalinactiveorganization',
                name: 'Total Inactive Organization',
                ...calculatePercentageChange(currentData.inactiveStudents, previousData.inactiveStudents),
            },
            {
                current: currentData.blacklistStudents,
                previous: previousData.blacklistStudents,
                id: 'totalblacklistorganization',
                name: 'Total Blacklist Organization',
                ...calculatePercentageChange(currentData.blacklistStudents, previousData.blacklistStudents),
            },
        ];

        res.status(200).json({ success: true, data: statsComparison });
    } catch (error) {
        console.error('UNABLE TO GET STUDENT STATS', error);
        res.status(500).json({ success: false, data: 'Unable to get student stats' });
    }
}

//NEW INSTRUCTORS UNDER AN ORGNIZATION
export async function newInstructor(req, res) {
    const { name, email, profileImg, position } = req.body
    const { organisationID } = req.user
    try {
        const getOrganization = await organizationModel.findOne({ organisationID })

        const data = { name, email, profileImg, position }

        getOrganization.instructors.push(data)
        await getOrganization.save()

        res.status(201).json({ success: true, data: 'New Instructor added' })
    } catch (error) {
        console.log('UNABLE TO CREATE NEW INSTRUCTOR', error)
        res.status(500).json({ success: false, data: 'Unable to create a new instructor'})
    }
}

//UPDATE INSTRUCTOR IN AN ORGANIZATION
export async function updateInstructor(req, res) {
    const { _id, name, email, profileImg, position } = req.body
    const { organisationID } = req.user
    try {
        const getOrganization = await organizationModel.findOne({ organisationID })

        const instructor = getOrganization.instructors.find((instructor) => instructor._id.toString() === _id)

        if(name) instructor.name = name
        if(email) instructor.email = email
        if(profileImg) instructor.profileImg = profileImg
        if(position) instructor.position = position
        
        await getOrganization.save()

        res.status(200).json({ success: true, data: 'Instructor updated' })
    } catch (error) {
        console.log('UNABLE TO UPDATE INSTRUCTOR', error)
        res.status(500).json({ success: false, data: 'Unable to update instructor'})
    }
}

//DELETE INSTRUCTOR IN AN ORGANIZATION
export async function deleteInstructor(req, res) {
    const { _id } = req.body
    const { organisationID } = req.user
    try {
        const getOrganization = await organizationModel.findOne({ organisationID })

        const instructor = getOrganization.instructors.filter((instructor) => instructor._id === _id)
        if(!instructor){
            return res.status(404).json({ success: false, data: 'No Instructor found'})
        }

        await getOrganization.save()

        res.status(200).json({ success: true, data: 'Instructor data deleted' })
    } catch (error) {
        console.log('UNABLE TO DELETE INSTRUCTOR', error)
        res.status(500).json({ success: false, data: 'Unable to delete a instructor'})
    }
}

//GET INSTRUCTORS IN AN ORGANIZATIONS
export async function getInstructor(req, res) {
    const { organisationID } = req.params
    try {
        const getOrganization = await organizationModel.findOne({ organisationID })

        const instructor = getOrganization.instructors

        res.status(200).json({ success: true, data: instructor })
    } catch (error) {
        console.log('UNABLE TO GET INSTRUCTOR', error)
        res.status(500).json({ success: false, data: 'Unable to get instructor'})
    }
}

//GET A INSTRUCTOR IN AN ORGANIZATION
export async function getAInstructor(req, res) {
    const { organisationID, instructorID } = req.params
    try {
        const getOrganization = await organizationModel.findOne({ organisationID })

        const instructor = getOrganization.instructors.find((instructor) => instructor._id.toString() === instructorID)

        res.status(200).json({ success: true, data: instructor })
    } catch (error) {
        console.log('UNABLE TO GET INSTRUCTOR', error)
        res.status(500).json({ success: false, data: 'Unable to get instructor'})
    }
}