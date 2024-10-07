import {  OAuth2Client } from "google-auth-library"
import { registerMail } from "../middleware/sendEmail.js";
import { generateOtp } from "../middleware/generateOtp.js";
import OtpModel from "../models/Otp.js";
import UserModel from "../models/User.js";


//REGISTER USER
export async function registerUser(req, res) {
    const { firstName, lastName, password, confirmPassword, email, accountType, fromOrganisation } = req.body
    if (!email || !password || !firstName ||!lastName || !confirmPassword || !accountType) {
        return res.status(400).json({ success: false, data: 'Please provide all required fields' });
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
        const existingEmail = await UserModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ success: false, data: 'Email already exists. Please use another email' });
        }

        const user = await Studentmodel.create({ firstName, lastName, password, confirmPassword, email, fromOrganisation, accountType });
        console.log('USER CREATED');

        const otpCode = generateOtp(user._id)
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
                verifyUrl: verifyUrl,
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

//VERIFY OTP
export async function verifyOtp(req, res) {
    const { otp } = req.body
    if(!otp){
        return res.status(400).json({ success: false, data: 'OTP is Required' })
    }
    try {
        const getOtp = await OtpModel.findOne({ code: otp })
        if(!getOtp){
            return res.status(404).json({ success: false, data: 'Invalid code' })
        }

        const getUser = await UserModel.findOne({ _id: getOtp.userId })
        
        getUser.verified = true
        await getUser.save()

        const deleteOtp = await OtpModel.findByIdAndDelete({ _id: getOtp._id })

        res.status(200).json({ success: true, data: 'Account Email Verified' })
    } catch (error) {
        console.log('UNABLE TO VERIFY OTP', error)
        res.status(500).json({ success: false, data: 'Unable to verify OTP' })
    }
}

//LOGIN USER
export async function login(req, res) {
    const { email, password, accountType } = req.body 
    if(!email || !password){
        return res.status(401).json({ success: false, data: 'Please provide an email and password'})
    }

    try {
        const user = await UserModel.findOne({ email: email }).select('+password')
    
        if(!user){
            return res.status(401).json({ success: false, data: 'Invalid User'})
        }

        const isMatch = await user.matchPasswords(password);

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
        const token = user.getSignedToken();
        const expiryDate = new Date(Date.now() + 10 * 60 * 60 * 1000)
        const { resetPasswordToken, resetPasswordExpire, password: hashedPassword, ...userData } = user._doc
        res.cookie('edtechafric', token, { httpOnly: true, expires: expiryDate, sameSite: 'None', secure: true } ).status(201).json({ success: true, token: token, isVerified: true, data: {success: true, data: userData }})
        
    } catch (error) {
        console.log(`UNABLE TO LOGIN USER WITH EMAIL: (${email})`, error)
        res.status(500).json({ success: false, data: 'Failed to login user' })
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