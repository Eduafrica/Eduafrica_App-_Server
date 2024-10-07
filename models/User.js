import mongoose from "mongoose";
import crypto from 'crypto'
import bcryptjs from 'bcryptjs'
import jsonwebtoken from 'jsonwebtoken'

const UserSchema = new mongoose.Schema({
    userName: {
        type: String
    },
    firstName: {
        type: String
    },
    lastName: {
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
        unique: [ true, 'Phone number is already exist' ]
    },
    profileImg: {
        type: String,
    },
    totalTransaction: {
        type: Number
    },
    fromOrganisation: {
        type: Boolean,
        default: false
    },
    organisationName: {
        type: String
    },
    organisationId: {
        type: String
    },
    accountType: {
        type: String,
        default: 'student'
    },
    aboutMe: {
        type: String
    },
    verified: {
        type: Boolean,
        default: false
    },
    blocked: {
        type: Boolean,
        default: false
    }
},
{minimize: false},
{timestamps: true}
)

UserSchema.pre('save', async function(next){
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

UserSchema.methods.matchStudentPasswords = async function(password){
    return await bcryptjs.compare(password, this.password)
}

UserSchema.methods.getStudentSignedToken = function(){
    return jsonwebtoken.sign({ id: this._id, accountType: this.accountType}, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE})
}

UserSchema.methods.getStudentResetPasswordToken = function(){
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    this.resetPasswordExpire = Date.now() + 10 * (60 * 1000)

    return resetToken
}


const UserModel =  mongoose.model('user', UserSchema);
export default UserModel