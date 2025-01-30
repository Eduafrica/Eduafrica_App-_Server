import mongoose from 'mongoose'

const InstructorQuestionAndAnswerSchema = new mongoose.Schema({
    instructorId: {
        type: String,
        required: [ true, ' Instructor Id is required'],
        unique: [ true, 'Instructor Id already exist']
    },
    faq: [{
        question: {
            type: String,
            required: [ true, 'Question is required' ]
        },
        answer: {
            type: String,
            required: [ true, 'Answer is required' ]
        }
    }]
})

const InstructorQuestionAndAnswerModel = mongoose.model('instructorQuestionAndAnswer', InstructorQuestionAndAnswerSchema)
export default InstructorQuestionAndAnswerModel