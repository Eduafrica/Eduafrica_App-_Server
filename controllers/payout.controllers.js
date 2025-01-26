import InstructorModel from "../models/Instructors.js"
import organizationModel from "../models/Organization.js"
import PayoutModel from "../models/Payout.js"

//NEW PAYOUT REQUEST
export async function newPayoutRequest(req, res) {
    const { amount, bankName, accountName, accountNumber } = req.body
    const { organisationID } = req.user
    const { instructorID } = req.user
    if(!amount){
        res.status(400).json({ success: false, data: 'Payout amount is required'})
        return
    }
    if(!bankName){
        res.status(400).json({ success: false, data: 'Bank name is required'})
        return
    }
    if(!accountName){
        res.status(400).json({ success: false, data: 'Account Name is required'})
        return
    }
    if(!accountNumber){
        res.status(400).json({ success: false, data: 'Account Number is required'})
        return
    }
    try {
        let getInstructor
        getInstructor = await InstructorModel.findOne(instructorID);
        if (!getInstructor) {
          // If not found, try fetching from organizationModel
          getInstructor = await organizationModel.findOne(organisationID);
        }
        if (!getInstructor) {
            return res.status(404).json({ success: false, data: `Instructor not found in either model for ID` });
        }

        if(Number(amount) > Number(getInstructor?.totalTransaction)){
            res.status(400).json({ success: false, data: 'Request Payout Amount is greater than account balance'})
            return
        }

        const newPayoutRequest = await PayoutModel.create({
            instructorId: getInstructor?._id,
            instructorSlugcode: getInstructor?.organisationID || getInstructor?.instructorID,
            bankName,
            accountName,
            accountNumber,
            amount
        })

        getInstructor -= Number(amount)
        await getInstructor.save()

        const { resetPasswordToken, resetPasswordExpire, password: hashedPassword, ...getInstructorData } = getInstructor._doc
        res.status(201).json({ success: true, data: 'Payout request Successful', instructor: getInstructorData })
    } catch (error) {
        console.log('UNABLE TO PROCESS PAYOUT REQUEST', error)
        res.status(500).json({ success: false, data: 'Unable to process payout requests' })
    }
}

//APPROVE PAYOUT REQUEST
export async function approvedPayoutRequest(req, res) {
    const { _id } = req.body
    try {
        const getPayoutRequest = await PayoutModel.findById({ _id: _id })
        if(!getPayoutRequest){
            res.status(404).json({ success: false, data: 'Payout request with this id not found'})
            return
        }
        getPayoutRequest.status = 'Approved'

        res.status(200).json({ success: true, data: 'Payout request approved'})
    } catch (error) {
        console.log('ANABLE TO APPROVE PAYOUT REQUEST', error)
        res.status(500).json({ success: false, data: 'Unable to approve payout request' })
    }
}

//REJECT PAYOUT REQUEST
export async function rejectPayoutRequest(req, res) {
    const { _id } = req.body

    try {
        const getPayoutRequest = await PayoutModel.findById({ _id: _id })
        if(!getPayoutRequest){
            res.status(404).json({ success: false, data: 'Payout request with this id not found'})
            return
        }
        getPayoutRequest.status = 'Rejected'

        res.status(200).json({ success: true, data: 'Payout request rejected'})
    } catch (error) {
        console.log('UNABLE TO REJECT PAYOUT REQUEST', error)
        res.status(500).json({ success: false, data: 'Unable to reject payout request' })
    }
}

//GET ALL PAYOUT REQUEST
export async function getPayoutRequest(req, res) {

    try {
        const payoutRequest = await PayoutModel.find()

        res.status(200).json({ success: true, data: payoutRequest})
    } catch (error) {
        console.log('UNABLE TO GET ALL PAYOUT REQUEST', error)
        res.status(500).json({ success: false, data: 'Unable to get all payout request' })
    }
}

//GET A PAYOUT REQUEST
export async function getAPayoutRequest(req, res) {
    const { _id } = req.params

    try {
        const getPayoutRequest = await PayoutModel.findById({ _id: _id })
        if(!getPayoutRequest){
            res.status(404).json({ success: false, data: 'Payout request with this id not found'})
            return
        }

        res.status(200).json({ success: true, data: getPayoutRequest})
    } catch (error) {
        console.log('UNABLE TO GET A PAYOUT REQUEST', error)
        res.status(500).json({ success: false, data: 'Unable to get a payout request' })
    }
}

//GET ALL PAYOUT REQUEST FOR INSTRUCTOR
export async function getInstructorPayoutRequest(req, res) {
    const { _id } = req.user
    try {
        const payoutRequest = await PayoutModel.find({ instructorId: _id })

        res.status(200).json({ success: true, data: payoutRequest})
    } catch (error) {
        console.log('UNABLE TO GET ALL PAYOUT REQUEST FOR INSTRUCTOR', error)
        res.status(500).json({ success: false, data: 'Unable to get all payout request' })
    }
}

//GET A PAYOUT REQUEST FOR INSTRUCTOR
export async function getAInstructorPayoutRequest(req, res) {
    const { _id } = req.params

    try {
        const getPayoutRequest = await PayoutModel.findById({ _id: _id })
        if(!getPayoutRequest){
            res.status(404).json({ success: false, data: 'Payout request with this id not found'})
            return
        }

        res.status(200).json({ success: true, data: getPayoutRequest})
    } catch (error) {
        console.log('UNABLE TO GET A PAYOUT REQUEST', error)
        res.status(500).json({ success: false, data: 'Unable to get a payout request' })
    }
}