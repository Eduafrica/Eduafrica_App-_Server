import CourseModel from "../models/Course.js"
import CourseContentModel from "../models/CourseContent.js"

//UPLOAD A COURSE CONTENT
export async function uploadCourseContent(req, res) {
    try {
        const { courseID, sectionTitle, overview, courseNote, assestLink, assestType, assignment } = req.body;
        const { _id } = req.user;

        if (!courseID) return res.status(400).json({ success: false, data: 'Course ID is required' });
        if (!sectionTitle) return res.status(400).json({ success: false, data: 'Section Title is required' });
        if (!overview) return res.status(400).json({ success: false, data: 'Overview of course section is required' });
        if (!courseNote) return res.status(400).json({ success: false, data: 'Section Course note is required' });

        if (assestLink && !assestType) {
            return res.status(400).json({ success: false, data: 'Provide a corresponding asset type for media asset' });
        }
        if (assestLink && !["video", "audio", "image", "pdf"].includes(assestType)) {
            return res.status(400).json({ success: false, data: "Invalid asset type. Allowed: 'video', 'audio', 'image', 'pdf'" });
        }

        const getCourse = await CourseModel.findOne({ slugCode: courseID });
        if (!getCourse) return res.status(404).json({ success: false, data: 'No Course with this ID found' });

        if (_id.toString() !== getCourse.instructorId.toString()) {
            return res.status(403).json({ success: false, data: 'Not Authorized: Access Denied' });
        }

        // Convert courseNote to string if it's an array/object
        let processedNote = courseNote;
        if (typeof courseNote === "object") {
            try {
                processedNote = JSON.stringify(courseNote);
            } catch (err) {
                return res.status(400).json({ success: false, data: "Invalid courseNote format" });
            }
        }

        const getCourseContent = await CourseContentModel.findOne({ slugCode: courseID });
        const data = {
            sectionTitle, overview, courseNote: processedNote, assestLink, assestType, assignment
        };

        if (!getCourseContent) {
            const newCourseContent = await CourseContentModel.create({
                courseId: getCourse?._id, slugCode: courseID, sections: [data]
            });
            return res.status(201).json({ success: true, data: 'Course content created', content: newCourseContent });
        }

        getCourseContent.sections.push(data);
        await getCourseContent.save();

        return res.status(201).json({ success: true, data: 'Course content added', content: getCourseContent });

    } catch (error) {
        console.error('UNABLE TO UPLOAD COURSE CONTENT', error);
        res.status(500).json({ success: false, data: 'Unable to upload course content' });
    }
}

// EDIT COURSE CONTENT
export async function updateCourseContent(req, res) {
    try {
        const { courseID, chapterId, sectionTitle, overview, courseNote, assestLink, assestType, assignment } = req.body;
        const { _id } = req.user;

        if (assestLink && !assestType) {
            return res.status(400).json({ success: false, data: 'Provide a corresponding asset type for media asset' });
        }
        if (assestLink && !["video", "audio", "image", "pdf"].includes(assestType)) {
            return res.status(400).json({ success: false, data: "Invalid asset type. Allowed: 'video', 'audio', 'image', 'pdf'" });
        }

        const getCourse = await CourseModel.findOne({ slugCode: courseID });
        if (!getCourse) return res.status(404).json({ success: false, data: 'No course with this ID found' });

        if (_id.toString() !== getCourse.instructorId.toString()) {
            return res.status(403).json({ success: false, data: 'Not Authorized: Access Denied' });
        }

        const getCourseContent = await CourseContentModel.findOne({ slugCode: courseID });
        if (!getCourseContent) {
            return res.status(404).json({ success: false, data: 'Course content with this ID does not exist' });
        }

        // Convert courseNote to string if it's an array/object
        let processedNote = courseNote;
        if (typeof courseNote === "object") {
            try {
                processedNote = JSON.stringify(courseNote);
            } catch (err) {
                return res.status(400).json({ success: false, data: "Invalid courseNote format" });
            }
        }

        const updatedContent = await CourseContentModel.findOneAndUpdate(
            { slugCode: courseID, "sections._id": chapterId },
            {
                $set: {
                    "sections.$.sectionTitle": sectionTitle,
                    "sections.$.overview": overview,
                    "sections.$.courseNote": processedNote,
                    "sections.$.assestLink": assestLink,
                    "sections.$.assestType": assestType,
                    "sections.$.assignment": assignment,
                },
            },
            { new: true }
        );

        if (!updatedContent) {
            return res.status(404).json({ success: false, data: 'Section with this ID not found' });
        }

        return res.status(200).json({ success: true, data: updatedContent });
    } catch (error) {
        console.error('UNABLE TO UPDATE COURSE CONTENT', error);
        res.status(500).json({ success: false, data: 'Unable to update course content' });
    }
}

//FETCH A COURSE FOR ADMIN
export async function getCourseContentForAdmin(req, res) {
    const { id } = req.params
    //console.log('course content', id)
    try {
        if(!id){
            return res.status(400).json({ success: false, data: 'Provide a course ID' })
        }

        const getCourseContent = await CourseContentModel.findOne({ courseId: id })

        if(!getCourseContent){
            return res.status(404).json({ success: false, msg: 'This Course does not have a course content' })
        }

        const contents = getCourseContent

        res.status(200).json({ success: true, data: contents })
    } catch (error) {
        console.log('UNABLE TO GET COURSE CONTENT FOR ADMIN USER', error)
        res.status(500).json({ success: false, data: 'Unable to get course content for admin user' })
    }
}

//FETCH A COURSE FOR COURSE OWNER(INSTRUCTOR || ORGANIZATION)
export async function getCourseContentForInstructor(req, res) {
    const { id } = req.params
    const { _id } = req.user
    //console.log('course content', id)
    try {
        if(!id){
            return res.status(400).json({ success: false, data: 'Provide a course ID' })
        }

        const getCourseContent = await CourseContentModel.findOne({ courseId: id })

        if(!getCourseContent){
            return res.status(404).json({ success: false, msg: 'This Course does not have a course content' })
        }

        const getCourse = await CourseModel.findOne({ _id: getCourseContent.courseId })
        if(_id.toString() !== getCourse.instructorId.toString() ){
            return res.status(403).json({ success: false, data: 'Not Authorized: Access Denied' })
        }

        const contents = getCourseContent

        res.status(200).json({ success: true, data: contents })
    } catch (error) {
        console.log('UNABLE TO GET COURSE CONTENT FOR COURSE OWNER ', error)
        res.status(500).json({ success: false, data: 'Unable to get course content' })
    }
}

//GET A COURSE CONTENT OFFERED AND BOUGHT BY STUDENT
export async function getAStudentCourseContent(req, res) {
    const { _id } = req.params;
    const { _id: userId, course: userCourses } = req.user;

    // Validate input
    if (!_id) {
        return res.status(400).json({ success: false, data: "Course ID is required" });
    }

    try {
        // Fetch the course by its ID
        const getCourse = await CourseContentModel.findOne({ courseId: _id });

        if (!getCourse) {
            return res.status(404).json({ success: false, data: "Course content not found" });
        }

        // Check if the userId is in the students array of the course
        if (!getCourse.students.includes(userId)) {
            return res.status(403).json({ success: false, data: "Access denied. You are not enrolled in this course" });
        }

        // Check if the course ID is in the user's course array
        if (!userCourses.includes(getCourse?.slugCode.toString())) {
            return res.status(403).json({ success: false, data: "Access denied. This course is not part of your enrolled courses" });
        }

        // Return the course data if all checks pass
        return res.status(200).json({
            success: true,
            data: getCourse,
        });
    } catch (error) {
        console.error("UNABLE TO GET STUDENT COURSE CONTENT", error);
        return res.status(500).json({ success: false, data: "Unable to get course content" });
    }
}