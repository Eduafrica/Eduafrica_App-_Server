import mongoose from "mongoose";
import crypto from 'crypto'
import bcryptjs from 'bcryptjs'
import jsonwebtoken from 'jsonwebtoken'


const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    password: {
        type: String
    },
    email: {
        type: String,
        required: [ true,  'Email address is required' ],
        unique: [ true, 'Email address already exist' ]
    },
    accountType: {
        type: String,
        default: 'organization'
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
},
{minimize: false},
{timestamps: true}
)

organizationSchema.pre('save', async function(next){
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

organizationSchema.methods.matchStudentPasswords = async function(password){
    return await bcryptjs.compare(password, this.password)
}

organizationSchema.methods.getStudentSignedToken = function(){
    return jsonwebtoken.sign({ id: this._id, accountType: this.accountType}, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE})
}

organizationSchema.methods.getStudentResetPasswordToken = function(){
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    this.resetPasswordExpire = Date.now() + 10 * (60 * 1000)

    return resetToken
}


const organizationModel =  mongoose.model('organization', organizationSchema);
export default organizationModel