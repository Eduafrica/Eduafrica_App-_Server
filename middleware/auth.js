import jsonwebtoken from 'jsonwebtoken'
import StudentModel from '../models/Student.js';
import InstructorModel from '../models/Instructors.js';
import organizationModel from '../models/Organization.js';

//authorize user request
export const Protect = async (req, res, next) => {
    const token = req.cookies.edtechafric;
    //console.log('PROTECT TOKEN>>', token)
  
    if (!token) {
      return res.status(401).json({ success: false, data: 'Not Allowed Please Login' });
    }
  
    try {
      const user = await new Promise((resolve, reject) => {
        jsonwebtoken.verify(token, process.env.JWT_SECRET, (err, decoded) => {
          if (err) {
            return reject(err);
          }
          resolve(decoded);
        });
      });
  
      req.user = user;
  
      const { id, userType } = user;
      let isUser
      
      if(userType === 'student'){
        isUser = await StudentModel.findById(id);
      }
      if(userType === 'instructor'){
        isUser = await InstructorModel.findById(id);
      }
      if(userType === 'organization'){
        isUser = await organizationModel.findById(id);
      }

      if (!isUser) {
        return res.status(404).json({ success: false, data: 'Invalid user' });
      }
      if (isUser.verified === false) {
        return res.status(404).json({ success: false, data: 'User Account is not verified' });
      }
      if (isUser.blocked === true) {
        return res.status(404).json({ success: false, data: 'User Account has been blocked' });
      }

      req.user = isUser
  
      //console.log('user', isUser)
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ success: false, data: 'Token expired, please login again' });
      } else {
        return res.status(403).json({ success: false, data: 'User Forbidden Please Login' });
      }
    }
  };

// Middleware to check and create a chatId
export const ChatId = async (req, res, next) => {
  const token = req.cookies.edtechafric;
  const chatToken = req.cookies.edtechChatID;
  let isUser = null;
  console.log('object chates', chatToken)

  try {
    if (token) {
      const user = await new Promise((resolve, reject) => {
        jsonwebtoken.verify(token, process.env.JWT_SECRET, (err, decoded) => {
          if (err) {
            return reject(err);
          }
          resolve(decoded);
        });
      });

      req.user = user;
      const { id, userType } = user;

      // Retrieve the user based on userType
      if (userType === 'student') {
        isUser = await StudentModel.findById(id);
      } else if (userType === 'instructor') {
        isUser = await InstructorModel.findById(id);
      } else if (userType === 'organization') {
        isUser = await organizationModel.findById(id);
      }
    }

    // Set chatId based on whether user is found
    if (isUser) {
      req.user = isUser;
      req.chatId = {
        user: true,
        name: isUser.name,
        role: isUser.userType,
        chatId: isUser._id,
        userId: isUser._id,
      };
    } else {
      req.chatId = { user: false, chatId: Date.now() }; // Temporary ID for unauthenticated users
    }

    // Send chatToken to the client
    const chatTokenPayload = req.chatId;
    const signedChatToken = jsonwebtoken.sign(chatTokenPayload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
    const expiryDate = new Date(Date.now() + 10 * 60 * 60 * 1000);
    
    res.cookie('edtechChatID', signedChatToken, {
      httpOnly: true,
      expires: expiryDate,
      sameSite: 'None',
      secure: true,
    });

    next();
  } catch (error) {
    console.log('UNABLE TO PASS AI CHAT TOKEN', error);
    res.status(500).json({ success: false, data: `Unable to connect with ${process.env.AI_NAME}` });
  }
};
