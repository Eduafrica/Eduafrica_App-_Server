import OtpModel from "../models/Otp.js";

export async function generateOtp(userId) {
    const generateOtp = () => {
        // Generate a random 6-digit number
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
        return otp;
    };

    let otp;
    let exists = true;

    while (exists) {
        otp = generateOtp();
        exists = await OtpModel.findOne({ code: otp });
    }

    const otpCode = await new OtpModel({
        userId: userId,
        code: otp
    }).save();

    return otp; 
}