import CourseModel from "../models/Course.js"
import CourseContentModel from "../models/CourseContent.js"

//UPLOAD A COURSE CONTENT
export async function uploadCourseContent(req, res) {
    const { courseID, sectionTitle, overview, courseNote, assestLink, assestType, assignment } = req.body
    console.log('object', req.body)
    try {
        if(!sectionTitle){
            return res.status(400).json({ success: false, data: 'Section Title is required' })
        }
        if(!overview){
            return res.status(400).json({ success: false, data: 'Overview of course section is required' })
        }
        if(!courseNote){
            return res.status(400).json({ success: false, data: 'Section Course note is required' })
        }

        const getCourse = await CourseModel.findOne({ slugCode: courseID })
        if(!getCourse){
            return res.status(404).json({ success: false, data: 'No Course with this ID found' })
        }

        const getCourseContent = await CourseContentModel.findOne({ slugCode: courseID })

        if(!getCourseContent){
            const newCourseContent = await CourseContentModel.create({
                courseId: getCourse?._id, slugCode: courseID
            })

            const data = {
                sectionTitle, overview, courseNote, assestLink, assestType, assignment
            }

            newCourseContent.sections.push(data)
            await newCourseContent.save()

            return res.status(201).json({ success: true, data: 'Course content created' })
        }

        const data = {
            sectionTitle, overview, courseNote, assestLink, assestType, assignment
        }

        getCourseContent.sections.push(data)
        await getCourseContent.save()

        return res.status(201).json({ success: true, data: 'Course content created' })
    } catch (error) {
        console.log('UNABLE TO UPLAOD COURSE CONTENT', error)
        res.status(500).json({ success: false, data: 'Unable to upload course content' })
    }
}

//FETCH A COURSE FOR ADMIN
export async function getCourseContentForAdmin(req, res) {
    const { id } = req.params
    console.log('course content', id)
    try {
        if(!id){
            return res.status(400).json({ success: false, data: 'Provide a course ID' })
        }

        const getCourseContent = await CourseContentModel.findOne({ courseId: id })

        if(!getCourseContent){
            return res.status(404).json({ success: false, msg: 'This Course does not have a course content' })
        }

        const contents = getCourseContent.sections

        res.status(200).json({ success: true, data: contents })
    } catch (error) {
        console.log('UNABLE TO GET COURSE CONTENT FOR ADMIN USER', error)
        res.status(500).json({ success: false, data: 'Unable to get course content for admin user' })
    }
}