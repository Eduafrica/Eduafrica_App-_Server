import {  OAuth2Client } from "google-auth-library"
import { registerMail } from "../middleware/sendEmail.js";
import { generateOtp, generateUniqueCode } from "../middleware/utils.js";
import OtpModel from "../models/Otp.js";
import StudentModel from "../models/Student.js";


//REGISTER USER
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
    try {
        const existingEmail = await StudentModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ success: false, data: 'Email already exists. Please use another email' });
        }

        const generatedStudentCode = await generateUniqueCode(6)
        console.log('STUDENT CODE>>', `EA${generatedStudentCode}`)

        const user = await StudentModel.create({ name, password, email, displayName, allowNotifications, intrestedCourses, preferredLanguage, country, studentID: `EA${generatedStudentCode}` });
        console.log('USER CREATED');

        const otpCode = await generateOtp(user._id)
        console.log('OTP', otpCode)

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

//LOGIN USER
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
                const otpCode = generateOtp(user._id)
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
    try {
        
    } catch (error) {
        console.log('UNABLE TO PROCESS FORGOT PASSWORD', error)
        res.status(500).json({ success: false, data: 'Something went wromg'})
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