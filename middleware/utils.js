import CourseModel from "../models/Course.js";
import OtpModel from "../models/Otp.js";

export async function generateOtp(userId, accountType) {
    const generateOtp = () => {
        // Generate a random 6-digit number
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
        return otp;
    };

    let otp;
    let exists = true;

    while (exists) {
        otp = generateOtp();
        exists = await OtpModel.findOne({ code: otp });
    }

    const otpCode = await new OtpModel({
        userId: userId,
        code: otp,
        accountType: accountType
    }).save();

    return otp; 
}

export async function generateUniqueCode(length) {
    const courseSlug = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let slugCode = ''; 

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            slugCode += characters[randomIndex]; 
        }

        return slugCode;
    };

    let slugCode;
    let exists = true;

    while (exists) {
        slugCode = courseSlug();
        const existingCourse = await CourseModel.findOne({ slugCode: slugCode });
        exists = existingCourse !== null; 
    }

    return slugCode;
}

// Function to calculate average ratings of course
export function calculateAverageCourseRating(courses) {
    // Check if courses is an array
    if (Array.isArray(courses)) {
        // Return an array with average ratings for each course
        return courses.map(course => {
            if (course.ratings && course.ratings.length > 0) {
                const totalRating = course.ratings.reduce((sum, rating) => sum + (rating.rateNumber || 0), 0);
                const averageRating = totalRating / course.ratings.length;
                return {
                    ...course._doc,
                    averageRating: Math.round((averageRating + Number.EPSILON) * 10) / 10 // Rounded to 1 decimal place
                };
            } else {
                return {
                    ...course._doc,
                    averageRating: 0 // No ratings yet
                };
            }
        });
    } else if (typeof courses === 'object' && courses !== null) {
        // Handle a single course object
        if (courses.ratings && courses.ratings.length > 0) {
            const totalRating = courses.ratings.reduce((sum, rating) => sum + (rating.rateNumber || 0), 0);
            const averageRating = totalRating / courses.ratings.length;
            return {
                ...courses._doc,
                averageRating: Math.round((averageRating + Number.EPSILON) * 10) / 10 // Rounded to 1 decimal place
            };
        } else {
            return {
                ...courses._doc,
                averageRating: 0 // No ratings yet
            };
        }
    } else {
        throw new Error('Invalid input: Expected an array or an object');
    }
}

//Check for empty filleds
export function checkRequiredFields(fields, reqBody, res) {
    for (const field of fields) {
      if (!reqBody[field]) {
        return res.status(500).json({ success: false, message: `The field "${field}" is required and cannot be empty.` });
      }
    }
}