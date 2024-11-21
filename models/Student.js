import mongoose from "mongoose";
import crypto from 'crypto'
import bcryptjs from 'bcryptjs'
import jsonwebtoken from 'jsonwebtoken'

const StudentSchema = new mongoose.Schema({
    displayName: {
        type: String
    },
    name: {
        type: String
    },
    password: {
        type: String
    },
    email: {
        type: String,
        required: [ true,  'Email address is required' ],
        unique: [ true, 'Email address already exist' ]
    },
    phoneNumber: {
        type: String,
    },
    profileImg: {
        type: String,
    },
    totalTransaction: {
        type: Number
    },
    accountType: {
        type: String,
        default: 'student'
    },
    allowNotifications: {
        type: Boolean,
        default: false,
    },
    intrestedCourses: {
        type: Array,
    },
    preferredLanguage: {
        type: String,
        default: 'English'
    },
    country: {
        type: String,
    },
    studentID: {
        type: String,
        required: [true, 'Student ID is required'],
        unique: [ true, 'Student With this ID already exist']
    },
    aboutMe: {
        type: String
    },
    course: {
        type: Array
    },
    learningReminder: [{
        day: { type: String, required: true },
        time: { type: String, required: true }, 
    }],
    fromOrganisation: {
        type: Boolean,
    },
    verified: {
        type: Boolean,
        default: false
    },
    blocked: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
},
{timestamps: true}
)

StudentSchema.pre('save', async function(next){
    if(!this.isModified('password')) {
        return next();
    };
  
    try {
        const salt = await bcryptjs.genSalt(10);
        this.password = await bcryptjs.hash(this.password, salt)
        next()
    } catch (error) {
        next(error)
    }
})

StudentSchema.methods.matchStudentPasswords = async function(password){
    return await bcryptjs.compare(password, this.password)
}

StudentSchema.methods.getStudentSignedToken = function(){
    return jsonwebtoken.sign({ id: this._id, verified: this.verified, userType: this.accountType }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE})
}

StudentSchema.methods.getStudentResetPasswordToken = function(){
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    this.resetPasswordExpire = Date.now() + 10 * (60 * 1000)

    return resetToken
}


const StudentModel =  mongoose.model('student', StudentSchema);
export default StudentModel