import CourseModel from "../models/Course.js"
import CourseChatModel from "../models/CourseChats.js"
import CourseContentModel from "../models/CourseContent.js"

//new chat
export async function courseGroupChat({ data, socket, res }) {
    const { courseSlug, message } = data
    const { studentID, organisationID, instructorID, name, profileImg } = socket.user
    console.log('SOCKET CHAT DATA', data)
    try {
        let getCourse 
        getCourse = await CourseChatModel.findOne({ courseSlug })
        if(!getCourse){
            getCourse = await CourseChatModel.create({ courseSlug, chats: [] })
        }

        const getCourseContent = await CourseContentModel.findOne({ slugCode: courseSlug })
        if(!getCourseContent){
            const message = 'Course not found'
            if(res) return res.status(404).json({ success: false, data: message })
            if(socket) return socket.emit('courseGroupChat', { success: false, data: message })
        }

        //check if message contains bad words
        const badWords = [
        'bitch', 'fuck', 'shit', 'asshole', 'bastard', 'dick', 'cunt', 'damn', 'whore', 
        'slut', 'crap', 'fucker', 'motherfucker', 'prick', 'wanker', 'screw', 'twat'
        ];

        // Convert both bad words and message to lowercase for case-insensitive comparison
        const messageArray = message.toLowerCase().split(' ');
        const badWordsSet = new Set(badWords.map(word => word.toLowerCase()));

        // Check if any bad word is found
        const foundBadWords = messageArray.filter(word => badWordsSet.has(word));
        if (foundBadWords.length > 0) {
        const errorMessage = 'Message contains bad words';
        if (res) return res.status(400).json({ success: false, data: errorMessage });
        if (socket) return socket.emit('courseGroupChat', { success: false, data: errorMessage });
        }


        //check if student is registered for course
        if(studentID){
            const getStudent = await CourseContentModel.findOne({ courseId: courseSlug, students: { $in: [studentID] } })
            if(!getStudent){
                const message = 'You are not registered for this course'
                if(res) return res.status(400).json({ success: false, data: message })
                if(socket) return socket.emit('courseGroupChat', { success: false, data: message })
            }
        }

        //check if instructor or organization is the owner of the course
        if(instructorID || organisationID){
            const getCourse = await CourseModel.findOne({ slugCode: courseSlug, instructorId: instructorID || organisationID })
            if(!getCourse){
                const message = 'You are not the owner of this course'
                if(res) return res.status(400).json({ success: false, data: message })
                if(socket) return socket.emit('courseGroupChat', { success: false, data: message })
            }
        }
    
        //save message
        getCourse.chats.push({ 
            message, 
            studentId: studentID, 
            instructorId: instructorID || organisationID || '',
            studentName: studentID ? name : '',
            instructorName: studentID ? '' : name,
            profileImg: profileImg,
        })
        await getCourse.save()
        console.log('getCourse.chats', getCourse.chats)

        if(res) return res.status(200).json({ success: true, data: getCourse.chats })
        if(socket) return socket.emit('courseGroupChat', { success: true, data: getCourse.chats })
    } catch (error) {
        const message = 'Unable to send message'
        if(res) return res.status(500).json({ success: false, data: message })
        if(socket) return socket.emit('courseGroupChat', { success: false, data: message })
    }
}