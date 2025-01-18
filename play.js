/**
 * 
const syllabus = [
    {
        period: "Week 1",
        mileStone: [
            { progress: "Completed Chapter 1" },
            { progress: "Started Chapter 2" }
        ]
    },
    {
        period: "Week 2",
        mileStone: [
            { progress: "Completed Chapter 2" }
        ]
    }
]

 */

const syllabus = [
  {
    period: "Week 1", 
    milestone: [
      {progress: "topic 1"},
      {progress: "topic 1"},
    ]
  }
]

function validateSyllabus(syllabus) {
    if (!Array.isArray(syllabus)) {
      return { valid: false, message: 'Syllabus must be an array' };
    }
  
    for (let period of syllabus) {
      if (typeof period !== 'object' || !period.period || typeof period.period !== 'string') {
        return { valid: false, message: 'Each syllabus item must have a "period" of type string' };
      }
      
      if (!Array.isArray(period.mileStone)) {
        return { valid: false, message: 'mileStone must be an array' };
      }
  
      for (let mileStoneItem of period.mileStone) {
        if (typeof mileStoneItem !== 'object' || !mileStoneItem.progress || typeof mileStoneItem.progress !== 'string') {
          return { valid: false, message: 'Each mileStone must have a "progress" of type string' };
        }
      }
    }
  
    return { valid: true, message: 'Syllabus is valid' };
  }

  if(syllabus){
    const validationResult = validateSyllabus(syllabus);
    if (!validationResult.valid) {
        console.error('ERROR', validationResult.message);
        //return res.status(400).json({ success: false, data: validationResult.message });
    }
    console.error('SUCCESS', validationResult.message);
}