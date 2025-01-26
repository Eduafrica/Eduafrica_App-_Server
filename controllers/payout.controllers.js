//NEW PAYOUT REQUEST
export async function newPayoutRequest(req, res) {
    const { amount, bankName, accountName, accountNumber } = req.body
    const { organisationID } = req.user
    const { instructorID } = req.user
    if(!amount){
        res.status(400).json({ success: false, data: 'Payout amount is required'})
        return
    }
    try {
        
    } catch (error) {
        console.log('UNABLE TO PROCESS PAYOUT REQUEST', error)
        res.status(500).json({ success: false, data: 'Unable to process payout requests' })
    }
}

//APPROVE PAYOUT REQUEST
export async function approvedPayoutRequest(req, res) {
    const { _id } = req.body
    try {
        
    } catch (error) {
        console.log('ANABLE TO APPROVE PAYOUT REQUEST', error)
        res.status(500).json({ success: false, data: 'Unable to approve payout request' })
    }
}

//REJECT PAYOUT REQUEST
export async function rejectPayoutRequest(req, res) {
    const { _id } = req.body

    try {
        
    } catch (error) {
        console.log('UNABLE TO REJECT PAYOUT REQUEST', error)
        res.status(500).json({ success: false, data: 'Unable to reject payout request' })
    }
}

//BET ALL PAYOUT REQUEST
export async function getPayoutRequest(req, res) {

    try {
        
    } catch (error) {
        console.log('UNABLE TO GET ALL PAYOUT REQUEST', error)
        res.status(500).json({ success: false, data: 'Unable to get all payout request' })
    }
}

//GET A PAYOUT REQUEST
export async function getAPayoutRequest(req, res) {
    const { _id } = req.params

    try {
        
    } catch (error) {
        console.log('UNABLE TO GET A PAYOUT REQUEST', error)
        res.status(500).json({ success: false, data: 'Unable to get a payout request' })
    }
}