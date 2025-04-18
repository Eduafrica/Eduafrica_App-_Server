import Mailgen from "mailgen";
import sendEmail from "../middleware/mailer.js";
import { registerMail } from "../middleware/sendEmail.js";
import AdminModel from "../models/Admin.js";
import NotificationModel from "../models/Notifications.js";
import crypto from 'crypto'
import { generateOtp, generateUniqueCode } from "../middleware/utils.js";
import OtpModel from "../models/Otp.js";
import SiteSettingModel from "../models/SiteSettings.js";
import { console } from "inspector";
import InstructorModel from "../models/Instructors.js";
import organizationModel from "../models/Organization.js";
import StudentModel from "../models/Student.js";

const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
        name: 'Edu Africa',
        link: `${process.env.APP_LINK}`
    }
})

//CREATE A NEW ADMIN USER
export async function createAdmin(req, res) {
    const { firstName, lastName, email, password } = req.body
    if(!firstName || !lastName || !email || !password){
        return res.status(400).json({ success: true, data: 'All Fields are required' })
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, data: 'Passwords must be at least 6 characters long' });
    }

    const specialChars = /[!@#$%^&*()_+{}[\]\\|;:'",.<>?]/;
    if (!specialChars.test(password)) {
        return res.status(400).json({ success: false, data: 'Passwords must contain at least one special character' });
    }

    try {
        const userExist = await AdminModel.findOne({ email })
        if(userExist){
            return res.status(409).json({ success: false, data: 'Email already exist' })
        }

        const generatedAdminCode = await generateUniqueCode(6)
        console.log('STAFF CODE>>', `EA${generatedAdminCode}`)


        const newAdmin = await AdminModel.create({
            firstName, lastName, email, password, staffID: `EA${generatedAdminCode}`
        })

        const otpCode = await generateOtp(newAdmin._id, 'admin')
        console.log('OTP', otpCode)

        const newNotification = await NotificationModel.create({
            message: `New Admin user register`,
            actionBy: newAdmin._id,
            name: `${firstName} ${lastName}`
        })

        try {
            await registerMail({
                username: `${newAdmin?.firstName} ${newAdmin?.lastName}`,
                userEmail: newAdmin.email,
                subject: 'EDTECH AFRIC ADMIN ACCOUNT CREATED SUCCESS',
                intro: 'Your Edu Afric admin account has been created successfull',
                instructions: `Verify your account with this OTP. OTP is valid for one (1) Hour.`,
                outro: `If you have further question contact Admin for support`,
                otp: otpCode,
                textName: 'OTP'
            });

            return res.status(200).json({ success: true, data: `${firstName} ${lastName} account has been successfully created` });
        } catch (error) {
            console.log('ERROR SENDING VERIFY OTP EMAIL', error);
        }

        res.status(201).json({ success: true, data: `${firstName} ${lastName} has been successfully made an admin` })
    } catch (error) {
        console.log('UNABLE TO CREATE ADMIN ACCOUNT', error)
        res.status(500).json({ success: false, data: 'Unable to create Admin user' })
    }
    
}

//APPROVE ADMIN
export async function approveAdmin(req, res) {
    console.log('DTTA',req.body)
    const { id, role } = req.body
    //const { email, role = 'Admin' } = req.body
    try {
        //const getAdmin = await AdminModel.findOne({ email })
        const getAdmin = await AdminModel.findOne({ _id: id })

        if(!getAdmin){
            return res.status(400).json({ success: false, data: 'Admin user with this ID does not exist' })
        }

        getAdmin.blocked = false
        getAdmin.approved = true
        getAdmin.role = role
        await getAdmin.save()

        const newNotification = await NotificationModel.create({
            message: `${getAdmin?.firstName} ${getAdmin?.lastName} has been approved by ${req.admin.firstName} as a new admin member with role of: ${role}`,
            actionBy: req.admin._id,
            name: `${req.admin.firstName} ${req.admin.lastName}`
        })

        try {
            await registerMail({
                username: `${getAdmin?.firstName} ${getAdmin?.lastName}`,
                userEmail: getAdmin.email,
                subject: 'EDTECH AFRIC ADMIN ACCOUNT APPROVED SUCCESS',
                intro: 'Your Edu Afric admin account has been approved successfull',
                instructions: `Vist ${process.env.ADMIN_URL} to Login into your account to get started`,
                outro: `If you have further question contact Admin for support`,
                otp: getAdmin.email,
                textName: 'Email'
            });

            return res.status(200).json({ success: true, data: `${getAdmin?.firstName} ${getAdmin?.lastName} has been successfully made an admin` });
        } catch (error) {
            console.log('ERROR SENDING APPROVAL OTP EMAIL', error);
        }


        res.status(201).json({ success: true, data: 'Admin user approved and updated successful' })
    } catch (error) {
        console.log('UNABLE TO APPROVE ADMIN USER', error)
        res.status(500).json({ success: false, data: 'Unable to approve admin user' })
    }
}

//ADMIN LOGIN
export async function login(req, res) {
    const { name, password } = req.body
    if(!name || !password){
        return res.status(404).json({ success: false, data: 'Provide an email or StaffId and password' })
    }
    console.log('EMAIL', name, 'Password', password)
    try {
        const isEmail = name.includes('@');

            const user = isEmail 
        ? await AdminModel.findOne({ email: name }) 
        : await AdminModel.findOne({ staffID: name });

        console.log('USER', user)

        if(!user){
            return res.status(401).json({ success: false, data: 'Invalid User'})
        }

        if(!user.verified){
            console.log('object', user._id.toString())
            let otpExist = await OtpModel.findOne({ userId: user._id.toString() })
            if(!otpExist){
                const otpCode = await generateOtp(user._id, 'admin')
                console.log('OTP CODE', otpCode)
    
                try {
                    await registerMail({
                        username: `${user?.firstName} ${user?.lastName}`,
                        userEmail: user.email,
                        subject: 'EDTRCH AFRIC ADMIN ACCOUNT CREATED SUCCESS',
                        intro: 'Your Edu Afric admin account has been created successfull',
                        instructions: `Verify your account with this OTP. OTP is valid for one (1) Hour.`,
                        outro: `If you have further question contact Admin for support`,
                        otp: otpCode,
                        textName: 'OTP'
                    });
        
                    return res.status(200).json({ success: false, isVerified: false, data: `Signup successful check otp code sent to ${user.email} to activate account` });
                } catch (error) {
                    console.log('ERROR SENDING VERIFY OTP EMAIL', error);
                }
            }   else {
                return res.status(200).json({ success: false, isVerified: false, data: 'Account Not Verified. An Email Has been sent to You Please Verify Account'})
            }
        }

        if(!user.approved){
            return res.status(401).json({ success: false, data: 'Account is yet to be approved'})
        }
        if(user.blocked){
            return res.status(401).json({ success: false, data: 'Account has been blocked'})
        }

        const isMatch = await user.matchAdminPassword(password);

        if(!isMatch){
            return res.status(401).json({ success: false, data: 'Invalid credentials'})
        }

        //SEND TOKEN
        const token = user.getAdminSignedToken();
        const expiryDate = new Date(Date.now() + 10 * 60 * 60 * 1000)
        const { resetPasswordToken, resetPasswordExpire, password: hashedPassword, _id, ...userData } = user._doc
        res.cookie('edtechafricauth', token, { httpOnly: true, expires: expiryDate, sameSite: 'None', secure: true } ).status(200).json({ success: true, token: token, data: {success: true, data: userData }})
                

    } catch (error) {
        console.log('UNABLE TO LOGIN ADMIN USER', error)
        res.status(500).json({ success: false, data: 'Unable to login to account' })
    }
}

//FORGOT PASSOWRD
export async function forgotPassword(req, res) {
    const { name } = req.body
    if(!name){
        return res.status(404).json({ success: false, data: 'Provide your registered email address or staff ID'})
    }
    try {
        const isEmail = name.includes('@');
        console.log('object', name, isEmail)

            const user = isEmail 
        ? await AdminModel.findOne({ email: name }) 
        : await AdminModel.findOne({ staffID: name });

        if(!user){
            return res.status(404).json({ success: false, data: 'Email Does Not Exist'})
        }

        const resetToken = user.getAdminResetPasswordToken()

        await user.save()
        const resetUrl = `${process.env.ADMIN_URL}/reset-password/${resetToken}`
        console.log('RESET TOKEN', resetUrl)

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

                        If you did not request a password reset, please ignore this email and login to your account to change your password.
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
                res.status(200).json({success: true, msg: 'Reset password link sent to email address', data: user?.user })
                
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
        console.log('ERROR GENERATING ADMIN PASSWORD RESET LINK', error)
        res.status(500).json({ success: false, data: 'Something went wrong' })
    }
}

//RESET PASSWORD
export async function resetPassword(req, res) {
    const { password, confirmPassword } = req.body
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex')

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

    try {

        const user = await AdminModel.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now()}
        })

        if(!user){
            return  res.status(400).json({ success: false, data: 'Invalid Reset Token'})
        }

        const isMatch = await user.matchAdminPassword(password);
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
        console.log('ERROR RESETING ADMIN PASSWORD', error)
        res.status(500).json({ success: false, data: 'Something went wrong. Unable to process reset password request' })
    }
}

//UPDATE PROFILE
export async function editProfile(req, res) {
    const { firstName, lastName, phoneNumber, country, profileImg, bio, email } = req.body
    try {
        if(req.body.staffID){
            return res.status(403).json({ success: false, data: 'Staff ID cannot be updated' })
        }
        const updateUser = await AdminModel.findByIdAndUpdate(
            req.admin._id,
            {
                $set: {
                    firstName,
                    lastName,
                    phoneNumber,
                    country,
                    profileImg,
                    bio,
                    email
                }
            },
            { new: true }
        )
        //console.log(updateUser)
        const { password, resetPasswordExpire, resetPasswordToken, _id, ...userData } = updateUser._doc
        res.status(200).json({ success: true, msg: 'Profile Updated Successful', data: {success: true, data: userData } })
    } catch (error) {
        console.log('UNABLE TO UPDATE ADMIN USER PROFILE', error)
        res.status(500).json({ success: false, data: 'Unable to update profile' })
    }
}

//ADMIN UPDATE STAFF PROFILE
export async function adminEditStaff(req, res) {
    const { id, role, } = req.body
    try {
        if(req.body.staffID){
            return res.status(403).json({ success: false, data: 'Staff ID cannot be updated' })
        }
        const updateUser = await AdminModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    role
                }
            },
            { new: true }
        )
        //console.log(updateUser)
        const { password, resetPasswordExpire, resetPasswordToken, _id, ...userData } = updateUser._doc
        res.status(200).json({ success: true, msg: 'Profile Updated Successful', data: {success: true, data: userData } })
    } catch (error) {
        console.log('UNABLE TO UPDATE ADMIN USER PROFILE', error)
        res.status(500).json({ success: false, data: 'Unable to update profile' })
    }
}

//UPDATE PASSWORD
export async function updatePassword(req, res){
    const { currentPassword, password, confirmPassword } = req.body
    if (password.length < 6) {
        return res.status(400).json({ success: false, data: 'Passwords must be at least 6 characters long' });
    }

    if(password !== confirmPassword){
        return res.status(400).json({ success: false, data: 'New password and confirm password do not match' })
    }

    const specialChars = /[!@#$%^&*()_+{}[\]\\|;:'",.<>?]/;
    if (!specialChars.test(password)) {
        return res.status(400).json({ success: false, data: 'Passwords must contain at least one special character' });
    }

    try {
        const getUser = await AdminModel.findById({ _id: req.admin._id })

        const isMatch = await getUser.matchAdminPassword(currentPassword);

        if(!isMatch){
            return res.status(401).json({ success: false, data: 'Invalid current password'})
        }

        if(currentPassword === password){
            return res.status(401).json({ success: false, data: 'New password cannot be the same with current password'})
        }

        getUser.password = password
        await getUser.save()

        res.status(201).json({ success: true, data: `Password Updated Successful` })
    } catch (error) {
        console.log('UNABEL TO UPDATE PASSWORD', error)
        res.status(500).json({ success: false, data: 'Unable to update password' })
    }
}

//BLOCK ADMIN USER
export async function blockAccount(req, res) {
    const { _id } = req.body
    try {
        if(!_id){
            return res.status(400).json({ success: false, data: 'Provide an ID' })
        }
        const getUser = await AdminModel.findById({ _id: _id })
        if(!getUser){
            return res.status(404).json({ success: false, data: 'Admin with this ID does not exist' })
        }

        getUser.blocked = true
        await getUser.save()

        const newNotification = await NotificationModel.create({
            message: `${getUser?.firstName} ${getUser.lastName} account has been blocked by Admin`,
            actionBy: req.admin._id,
            name: `${req.admin.firstName} ${req.admin.lastName}`
        })

        return res.status(200).json({ success: true, data: `${getUser?.firstName} ${getUser?.lastName} has been blocked` })
    } catch (error) {
        console.log('UNABLE TO BLOCK USER ACCOUNT', error)
        res.status(500).json({success: false, data: 'Unable to block user'})
    }
}

//UNBLOCK ADMIN USER
export async function unBlockAccount(req, res) {
    const { _id } = req.body
    try {
        if(!_id){
            return res.status(400).json({ success: false, data: 'Provide an ID' })
        }
        const getUser = await AdminModel.findById({ _id: _id })
        if(!getUser){
            return res.status(404).json({ success: false, data: 'Admin with this ID does not exist' })
        }

        getUser.blocked = false
        await getUser.save()

        const newNotification = await NotificationModel.create({
            message: `${getUser?.firstName} ${getUser.lastName} account has been unblocked by Admin`,
            actionBy: req.admin._id,
            name: `${req.admin.firstName} ${req.admin.lastName}`
        })

        return res.status(200).json({ success: true, data: `${getUser?.firstName} ${getUser?.lastName} has been unblocked` })
    } catch (error) {
        console.log('UNABLE TO UNBLOCK USER ACCOUNT', error)
        res.status(500).json({success: false, data: 'Unable to unblocked user'})
    }
}

//DELETE ADMIN USER
export async function deleteAccount(req, res) {
    const { _id } = req.body
    try {
        let adminName 
        const user = await AdminModel.findById({ _id: _id })
        adminName = `${user.firstName} ${user.lastName}`
        const getUser = await AdminModel.findByIdAndDelete({ _id: _id })

        const newNotification = await NotificationModel.create({
            message: `${adminName} account has been deleted by Admin`,
            actionBy: req.admin._id,
            name: `${req.admin.firstName} ${req.admin.lastName}`
        })

        return res.status(200).json({ success: false, data: `Account Deleted` })
    } catch (error) {
        console.log('UNABLE TO DELETE USER ACCOUNT', error)
        res.status(500).json({success: false, data: 'Unable to delete user'})
    }
}

//GET ALL ADMIN
export async function getAllAdmin(req, res) {
    try {
        const getAllUsers = await AdminModel.find().select('-password')

        res.status(200).json({ success: true, data: getAllUsers })
    } catch (error) {
        console.log('UNABLE TO GET ALL TO ADMIN USERS', error)
        res.status(500).json({ success: false, data: 'Unable to get all users' })
    }
}

//GET AN ADMIN
export async function getAdmin(req, res) {
    const { _id } = req.params
    try {
        if(!_id){
            return res.status(400).json({ success: false, data: 'Provide an ID' })
        }
        const getUser = await AdminModel.findOne({ _id: _id }).select('-password')
        if(!getUser){
            return res.status(404).json({ success: false, data: 'No user with this ID found' })
        }
        res.status(200).json({ success: true, data: getUser })
    } catch (error) {
        console.log('UNABLE TO GET ALL TO ADMIN USERS', error)
        res.status(500).json({ success: false, data: 'Unable to get all users' })
    }
}

//ADMIN LOGOUT
export async function signout(req, res){
    res.clearCookie('edtechafricauth').status(200).json({success: true, data: 'Signout success'})
}

//SITE SETTINGS
export async function siteSetting(req, res) {
    const { siteImage, siteName, siteLink, siteEmail, siteCountry, salesPercentage } = req.body
    console.log('object site settings', req.body)
    try {
        const getSettings = await SiteSettingModel.findOne()

        if(getSettings){
            const updateSettings = await SiteSettingModel.findByIdAndUpdate(
                getSettings._id,
                {
                    $set: {
                        siteImage, siteName, siteLink, siteEmail, siteCountry, salesPercentage
                    }
                },
                { new: true }
            )

            return res.status(201).json({ success: true, data: 'Site settings is updated successful'}) 
        }

        const newSettings = await SiteSettingModel.create({
            siteImage, siteName, siteLink, siteEmail, siteCountry, salesPercentage
        })

        res.status(201).json({ success: true, data: 'Site settings is updated successful'})
    } catch (error) {
        console.log('UNABLE TO UPDATE SITE SETTINGS', error)
        res.status(500).json({ success: false, data: 'Unable to update site settings'})
    }
}

//GET SITE SETTINGS
export async function getSiteSettings(req, res) {
    try {
        const getSettings = await SiteSettingModel.findOne()

        res.status(200).json({ success: true, data: getSettings })
    } catch (error) {
        console.log('UNABLE TO GET ALL SITES SETTINGS', error)
        res.status(500).json({ success: false, data: 'Unable to get sites settings' })
    }
}

/**DANGER */
/**
 * 

export async function clear(req, res){
    try {
        //await AdminModel.deleteMany()
        //await InstructorModel.deleteMany()
        //await organizationModel.deleteMany()
        //await StudentModel.deleteMany()
        const user = await AdminModel.findOne({ email: 'ayyubagiri@educonnectafrica.com' })
        user.blocked = false
        user.approved = true
        user.role = role
        console.log('Pa')
        await user.save()
        res.status(200).json({ success: true, data: "Cleared"})
    } catch (error) {
        console.log('ERROR OCCURED', error)
        res.status(500).json({ success: false, data: error})
    }
}
*/