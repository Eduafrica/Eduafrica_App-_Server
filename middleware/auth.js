import jsonwebtoken from 'jsonwebtoken'
import StudentModel from '../models/Student.js';
import InstructorModel from '../models/Instructors.js';
import organizationModel from '../models/Organization.js';
import AdminModel from '../models/Admin.js';

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

  //Allowed user roles:
export const UserRole = (allowedRoles) => {
  return (req, res, next) => {
    const { user } = req;

    if (!user || !user.accountType || !allowedRoles.includes(user.accountType)) {
      return res.status(403).json({ success: false, data: 'Access Denied: Insufficient Permissions' });
    }

    next();
  };
};

// Middleware to check and create a chatId
export const ChatId = async (req, res, next) => {
  const cookies = req.cookies || {}; 
  const token = cookies.edtechafric;
  const chatToken = cookies.edtechChatID;
  let isUser = null;
  console.log('object chates', chatToken);

  try {
    if (token) {
      const user = await new Promise((resolve, reject) => {
        jsonwebtoken.verify(token, process.env.JWT_SECRET, (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded);
        });
      });

      req.user = user;
      const { id, userType } = user;

      if (userType === 'student') {
        isUser = await StudentModel.findById(id);
      } else if (userType === 'instructor') {
        isUser = await InstructorModel.findById(id);
      } else if (userType === 'organization') {
        isUser = await organizationModel.findById(id);
      }
    }

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
      req.chatId = { user: false, chatId: Date.now().toString() };
    }

    const chatTokenPayload = req.chatId;
    const signedChatToken = jsonwebtoken.sign(chatTokenPayload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
    const expiryDate = new Date(Date.now() + 10 * 60 * 60 * 1000);

    // Check if `res.cookie` exists for HTTP requests
    if (res && res.cookie) {
      res.cookie('edtechChatID', signedChatToken, {
        httpOnly: true,
        expires: expiryDate,
        sameSite: 'None',
        secure: true,
      });
    } else if (req.socket) {
      // Emit the signed chat token to the client via Socket.IO
      req.socket.emit('setChatToken', { chatToken: signedChatToken, expires: expiryDate });
    }

    next();
  } catch (error) {
    console.log('UNABLE TO PASS AI CHAT TOKEN', error);

    if (res && res.status) {
      res.status(500).json({ success: false, data: `Unable to connect with ${process.env.AI_NAME}` });
    } else if (req.socket) {
      req.socket.emit('chatError', { success: false, message: `Unable to connect with ${process.env.AI_NAME}` });
    }
  }
};

//authorize admin request request
export const AdminProtect = async (req, res, next) => {
  const token = req.cookies.edtechafricauth;
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

    isUser = await AdminModel.findById(id);

    if (!isUser) {
      return res.status(404).json({ success: false, data: 'Invalid user' });
    }
    if (isUser.blocked === true) {
      return res.status(404).json({ success: false, data: 'User Account has been blocked' });
    }
    if (isUser.approved === false) {
      return res.status(404).json({ success: false, data: 'NOT AUTHORIZED' });
    }
    if (isUser.verified === false) {
      return res.status(404).json({ success: false, data: 'Account is yet to be verified' });
    }

    req.admin = isUser

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

//Allowed admin roles:
export const AdminRole = (allowedRoles) => {
  return (req, res, next) => {
    const { admin } = req;

    if (!admin || !admin.role || !allowedRoles.includes(admin.role)) {
      return res.status(403).json({ success: false, data: 'Access Denied: Insufficient Permissions' });
    }

    next();
  };
};

export const InstructorsOrAdminProtect = async (req, res, next) => {
  const userToken = req.cookies.edtechafric; // Token for instructors
  const adminToken = req.cookies.edtechafricauth; // Token for admins

  if (!userToken && !adminToken) {
    return res.status(401).json({ success: false, data: 'Not Allowed. Please login as an instructor or admin.' });
  }

  try {
    let user = null;

    // Verify user token for instructors
    if (userToken) {
      user = await new Promise((resolve, reject) => {
        jsonwebtoken.verify(userToken, process.env.JWT_SECRET, (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded);
        });
      });

      if (user.userType === 'student') {
        return res.status(403).json({ success: false, data: 'Access denied. Insuffient Permission.' });
      }

      let userAccount 

      if(user.userType === 'instructor'){
        userAccount = await InstructorModel.findById(user.id);
      }
      if(user.userType === 'organization'){
        userAccount = await organizationModel.findById(user.id);
      }

      //const instructor = await InstructorModel.findById(user.id);
      if (!userAccount) return res.status(404).json({ success: false, data: 'Instructor not found.' });
      if (userAccount.blocked) return res.status(403).json({ success: false, data: 'Instructor account is blocked.' });

      req.user = userAccount; // Attach instructors account to request
      return next();
    }

    // Verify admin token
    if (adminToken) {
      user = await new Promise((resolve, reject) => {
        jsonwebtoken.verify(adminToken, process.env.JWT_SECRET, (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded);
        });
      });

      const admin = await AdminModel.findById(user.id);
      if (!admin) return res.status(404).json({ success: false, data: 'Admin not found.' });
      if (admin.blocked) return res.status(403).json({ success: false, data: 'Admin account is blocked.' });

      req.admin = admin; // Attach admin to request
      return next();
    }
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ success: false, data: 'Token expired. Please login again.' });
    }
    return res.status(403).json({ success: false, data: 'User forbidden. Please login.' });
  }
};
