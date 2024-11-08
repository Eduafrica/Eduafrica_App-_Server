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

//REGISTER INSTRUCTOR
export async function registerUser(req, res) {
    const { name, displayName, password, confirmPassword, email, preferredLanguage, country } = req.body
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

    if (password.length < 6) {
        return res.status(400).json({ success: false, data: 'Passwords must be at least 6 characters long' });
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

        const generatedInstructorCode = await generateUniqueCode(6)
        console.log('INSTRUCTOR CODE>>', `EA${generatedInstructorCode}`)

        const user = await InstructorModel.create({ 
            name, displayName, password, confirmPassword, email, preferredLanguage, country, instructorID: `EA${generatedInstructorCode}`
        });
        console.log('USER CREATED');

        const otpCode = await generateOtp(user._id)
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
                verifyUrl: verifyUrl,
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
                const otpCode = await generateOtp(user._id)
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
                        verifyUrl: verifyUrl,
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
        const user = await InstructorModel.findOne({ email });

        if(!user){
            return res.status(404).json({ success: false, data: 'Email Does Not Exist'})
        }

        const resetToken = user.getInstructorResetPasswordToken()

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

//STUDENT UPDATE PROFILE
export async function updateProfile(req, res){
    const { name, displayName, country, intrestedCourses, preferredLanguage, allowNotifications } = req.body
    try {
        const updateUser = await StudentModel.findByIdAndUpdate(
            _id,
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
