import InstructorQuestionAndAnswerModel from "../models/InstructorQuestionAndAnswer.js";

//NEW OR ADD TO THE FAQ ARRAY
export async function newFaq(req, res) {
    const instructorID = req.user.instructorID || req.user.organisationID;
    const { question, answer } = req.body;

    if (!instructorID) {
        res.status(403).json({ success: false, data: 'Unauthorized' })
        return
    }

    try {
        let faqEntry = await InstructorQuestionAndAnswerModel.findOne({ instructorId: instructorID });

        if (!faqEntry) {
            // Create a new FAQ entry if it doesn't exist
            faqEntry = new InstructorQuestionAndAnswerModel({
                instructorId: instructorID,
                faq: [{ question, answer }]
            });
        } else {
            // Add to existing FAQ array
            faqEntry.faq.push({ question, answer });
        }

        await faqEntry.save();
        res.status(201).json({ success: true, data: 'FAQ added successfully', faq: faqEntry })
    } catch (error) {
        console.error('Error adding FAQ:', error);
        res.status(500).json({ success: false, data: 'Server error while adding FAQ.' })
    }
}

//UPDATE FAQ EITHER QUESTION OR ANSWER
export async function updateFaq(req, res) {
    const instructorID = req.user.instructorID || req.user.organisationID;
    const { question, answer, faqId } = req.body;
    if (!faqId) {
        res.status(404).json({ success: false, data: 'FAQ Id is required'})
        return
    }
    try {
        const faqEntry = await InstructorQuestionAndAnswerModel.findOne({ instructorId: instructorID });

        if (!faqEntry) {
            res.status(404).json({ success: false, data: 'FAQ entry not found'})
            return
        }

        const faqItem = faqEntry.faq.id(faqId); // Find the specific FAQ by ID
        if (!faqItem) {
            res.status(404).json({ success: false, data: 'FAQ not found'})
            return
        }

        if (question) faqItem.question = question;
        if (answer) faqItem.answer = answer;

        await faqEntry.save();
        res.status(200).json({ success: true, data: 'FAQ updated successfully', faq: faqEntry })
    } catch (error) {
        console.error('Error updating FAQ:', error);
        res.status(500).json({ success:  false, data: 'Server error while updating FAQ.' })
    }
}

//DELETE FAQ
export async function deleteFaq(req, res) {
    const instructorID = req.user.instructorID || req.user.organisationID;
    const { faqId } = req.body;

    try {
        const faqEntry = await InstructorQuestionAndAnswerModel.findOne({ instructorId: instructorID });

        if (!faqEntry) {
            res.status(404).json({ success: false, data: 'FAQ entry not found'})
            return
        }

        // Remove FAQ item by ID
        faqEntry.faq = faqEntry.faq.filter(faq => faq._id.toString() !== faqId);

        await faqEntry.save();
        res.status(200).json({ success: true, data: 'FAQ deleted successfully', faq: faqEntry })
    } catch (error) {
        console.error('Error deleting FAQ:', error);
        res.status(500).json({ success: false, data: 'Error while deleting FAQ.' })
    }
}

//GET FAQ
export async function getFaq(req, res) {
    const { instructorID } = req.params

    try {
        const faqEntry = await InstructorQuestionAndAnswerModel.findOne({ instructorId: instructorID });

        if (!faqEntry) {
            res.status(404).json({ success: false, data: 'No FAQ found for this user'})
            return
        }

        res.status(200).json({ success: true, data: faqEntry.faq})
    } catch (error) {
        console.error('Error retrieving FAQ:', error);
        res.status(200).json({ success: false, data: 'Error while retrieving FAQ.'})
    }
}

//GET A FAQ
export async function getAFaq(req, res) {
    const { instructorID, faqId } = req.params;

    try {
        const faqEntry = await InstructorQuestionAndAnswerModel.findOne({ instructorId: instructorID });

        if (!faqEntry) {
            res.status(404).json({ success: false, data: 'No Faq found for this user' })
            return
        }

        const faqItem = faqEntry.faq.id(faqId);
        if (!faqItem) {
            res.status(404).json({ success: false, data: 'FAQ not found' })
            return
        }

        res.status(200).json({ success: true, data: faqItem })
    } catch (error) {
        console.error('Error retrieving FAQ:', error);
        res.status(500).json({ success: false, data: 'Error while retrieving FAQ.' })
    }
}