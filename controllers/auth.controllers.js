import InstructorModel from "../models/Instructors.js"
import organizationModel from "../models/Organization.js"
import OtpModel from "../models/Otp.js"
import StudentModel from "../models/Student.js"

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

        let getUser 
        if (getOtp.accountType === 'student') {
            getUser = await StudentModel.findById({ _id: getOtp.userId });
          } else if (getOtp.accountType === 'instructor') {
            getUser = await InstructorModel.findById({ _id: getOtp.userId });
          } else if (getOtp.accountType === 'organization') {
            getUser = await organizationModel.findById({ _id: getOtp.userId });
          }
        getUser.verified = true
        await getUser.save()

        const deleteOtp = await OtpModel.findByIdAndDelete({ _id: getOtp._id })

        res.status(200).json({ success: true, data: 'Account Email Verified' })
    } catch (error) {
        console.log('UNABLE TO VERIFY OTP', error)
        res.status(500).json({ success: false, data: 'Unable to verify OTP' })
    }
}