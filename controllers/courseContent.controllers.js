import CourseContentModel from "../models/CourseContent.js"

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