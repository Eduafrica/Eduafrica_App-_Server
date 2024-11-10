import Mailgen from "mailgen";
import sendEmail from "../middleware/mailer.js";
import { registerMail } from "../middleware/sendEmail.js";
import AdminModel from "../models/Admin.js";
import NotificationModel from "../models/Notifications.js";
import crypto from 'crypto'

const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
        name: 'Edu Africa',
        link: `${process.env.APP_LINK}`
    }
})

//CREATE A NEW ADMIN USER
export async function createAdmin(req, res) {
    const { firstName, lastName, email, password, phoneNumber, country, role } = req.body
    if(!firstName || !lastName || !email|| !password || !phoneNumber || !country || !role){
        return res.status(400).json({ success: true, data: 'All Fields are required' })
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, data: 'Passwords must be at least 8 characters long' });
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
        console.log('STUDENT CODE>>', `EA${generatedAdminCode}`)


        const newAdmin = await AdminModel.create({
            firstName, lastName, email, password, phoneNumber, country, role, staffID: `EA${generatedAdminCode}`
        })

        const newNotification = await NotificationModel.create({
            message: `New Admin user added`,
            actionBy: req.admin._id,
            name: `${req.admin.firstName} ${req.admin.lastName}`
        })

        try {
            await registerMail({
                username: `${newAdmin?.firstName} ${newAdmin?.lastName}`,
                userEmail: newAdmin.email,
                subject: 'EDTRCH AFRIC ADMIN ACCOUNT CREATED SUCCESS',
                intro: 'Your Edu Afric admin account has been created successfull',
                instructions: `Vist ${process.env.ADMIN_URL} to Login into your account to get started`,
                outro: `If you have further question contact Admin for support`,
                otp: newAdmin.email,
                textName: 'Email'
            });

            return res.status(200).json({ success: true, data: `${firstName} ${lastName} has been successfully made an admin` });
        } catch (error) {
            console.log('ERROR SENDING VERIFY OTP EMAIL', error);
        }

        res.status(201).json({ success: true, data: `${firstName} ${lastName} has been successfully made an admin` })
    } catch (error) {
        console.log('UNABLE TO CREATE ADMIN ACCOUNT', error)
        res.status(500).json({ success: false, data: 'Unable to create Admin user' })
    }
    
}

//ADMIN LOGIN
export async function login(req, res) {
    const { name, password } = req.body
    if(!name || !password){
        return res.status(404).json({ success: false, data: 'Provide an email or StaffId and password' })
    }
    try {
        const isEmail = name.includes('@');

            const user = isEmail 
        ? await AdminModel.findOne({ email: name }) 
        : await AdminModel.findOne({ staffID: name });

        if(!user){
            return res.status(401).json({ success: false, data: 'Invalid User'})
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
    const { email } = req.body
    if(!email){
        return res.status(404).json({ success: false, data: 'Provide your registered email address'})
    }
    try {
        const user = await AdminModel.findOne({ email });

        if(!user){
            return res.status(404).json({ success: false, data: 'Email Does Not Exist'})
        }

        const resetToken = user.getAdminResetPasswordToken()

        await user.save()
        const resetUrl = `${process.env.ADMIN_URL}/reset-password/${resetToken}`
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
        return res.status(400).json({ success: false, data: 'Passwords must be at least 8 characters long' });
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
    const { firstName, lastName, phoneNumber, country, profileImg } = req.body
    try {
        const updateUser = await AdminModel.findByIdAndUpdate(
            req.admin._id,
            {
                $set: {
                    firstName,
                    lastName,
                    phoneNumber,
                    country,
                    profileImg
                }
            },
            { new: true }
        )
        //console.log(updateUser)
        res.status(200).json({ success: true, data: 'Profile Updated Successful' })
    } catch (error) {
        console.log('UNABLE TO UPDATE ADMIN USER PROFILE', error)
        res.status(500).json({ success: false, data: 'Unable to update profile' })
    }
}

//BLOCK USER
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

//UNBLOCK USER
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

//DELETE USER
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
        const getAllUsers = await AdminModel.find()

        res.status(200).json({ success: true, data: getAllUsers })
    } catch (error) {
        console.log('UNABLE TO GET ALL TO ADMIN USERS', error)
        res.status(500).json({ success: false, data: 'Unable to get all users' })
    }
}

//GET AN ADMIN
export async function getAdmin(req, res) {
    const { _id } = req.body
    try {
        if(!_id){
            return res.status(400).json({ success: false, data: 'Provide an ID' })
        }
        const getUser = await AdminModel.findOne({ _id: _id })
        if(!getUser){
            return res.status(404).json({ success: false, data: 'No user with this ID found' })
        }
        res.status(200).json({ success: true, data: getUser })
    } catch (error) {
        console.log('UNABLE TO GET ALL TO ADMIN USERS', error)
        res.status(500).json({ success: false, data: 'Unable to get all users' })
    }
}