import express from "express";
import { config } from 'dotenv';
import http from 'http'; 
import { Server } from 'socket.io';
config();

import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';

//IMPORT ROUTES
import authRoute from './routes/auth.routes.js';
import studentRoute from './routes/studentAuth.routes.js';
import instructorRoute from './routes/instructorAuth.routes.js';
import organizationRoute from './routes/organizationAuth.routes.js';
import aiChatRoute from './routes/aichat.routes.js';
import courseRoute from './routes/course.routes.js';
import courseContentRoute from './routes/courseContent.routes.js';
import adminRoute from './routes/admin.routes.js';
import orderRoute from './routes/orders.routes.js';
import uploadRoute from './routes/upload.routes.js'; //TO upload files
import appUploadRoute from './routes/appUpload.routes.js'; //TO upload course files from app
import countryRoute from './routes/countries.routes.js';
import cmsRoute from './routes/cms.routes.js';
import couponRoute from './routes/couponCode.routes.js';
import pushNotificationRoute from './routes/pushNotification.routes.js';
import advertRoute from './routes/advert.routes.js';
import dashboardRoute from './routes/dashboard.routes.js';
import payoutRoute from './routes/payout.routes.js';



// CORS setup
const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.ADMIN_URL,
    process.env.SERVER_URL,
    '*',
];

const app = express();
const server = http.createServer(app); 
const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            console.log('URL ORIGIN', origin);
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS', 'ORIGIN>', origin));
            }
        },
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cookieParser());
app.use(express.json());

app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data

// Set up bodyParser to parse incoming requests
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const corsOptions = {
    origin: function (origin, callback) {
        console.log('URL ORIGIN', origin);
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS', 'ORIGIN>', origin));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
app.use(cors(corsOptions));

//DOCs
import swaggerUI from 'swagger-ui-express';
import YAML from 'yamljs';
const swaggerJSDocs = YAML.load('./api.yaml');
app.use('/api-doc', swaggerUI.serve, swaggerUI.setup(swaggerJSDocs));

// Import DB connection
import './connection/db.js';
import { aiChat } from "./controllers/aichat.controllers.js";
import { AuthenticateGeneralSocket, ChatId } from "./middleware/auth.js";

// Routes
app.get('/', (req, res) => {
    res.status(200).json('Home GET Request');
});
app.use('/api/auth', authRoute);
app.use('/api/student', studentRoute);
app.use('/api/instructor', instructorRoute);
app.use('/api/organization', organizationRoute);
app.use('/api/aiChat', aiChatRoute);
app.use('/api/course', courseRoute);
app.use('/api/courseContent', courseContentRoute);
app.use('/api/admin', adminRoute)
app.use('/api/orders', orderRoute)
app.use('/api/upload', uploadRoute)
app.use('/api/appUpload', appUploadRoute)
app.use('/api/country', countryRoute)
app.use('/api/cms', cmsRoute)
app.use('/api/coupon', couponRoute)
app.use('/api/pushNotification', pushNotificationRoute)
app.use('/api/advert', advertRoute)
app.use('/api/dashboard', dashboardRoute)
app.use('/api/payout', payoutRoute)








// Setup socket.io connection
io.use((socket, next) => {
    ChatId(socket.request, socket.request.res || {}, next);
  });
  
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
  
    socket.on('aiChat', async (data) => {
      try {
        const response = await aiChat({ chatId: socket.request.chatId, body: { message: data.message } });
        socket.emit('aiChatResponse', response.data);
      } catch (error) {
        socket.emit('aiChatResponse', { msg: 'AI unable to respond' });
      }
    });
  
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  //SOCKET FUNCTIONS IMPORTS
  import * as courseChatsController from './controllers/courseChat.js';

  // Namespaces
const generalNamespace = io.of('/general');

export const accountConnections = new Map()
// Apply socket-specific authentication middleware for General
generalNamespace.use(AuthenticateGeneralSocket);
generalNamespace.on('connection', (socket) => {
  console.log('General Socket Connected connected:', socket.id);
  const { instructorID } = socket.user
  const { organisationID } = socket.user
  const { staffID } = socket.user



  if(instructorID){
    accountConnections.set(instructorID, socket.id)
  }
  if(organisationID){
    accountConnections.set(organisationID, socket.id)
  }
  if(staffID){
    accountConnections.set(staffID, socket.id)
  }

  socket.on('courseGroupChat', (data) => courseChatsController.courseGroupChat({ data, socket }));

  socket.on('disconnect', () => {
    console.log('General Socket disconnected:', socket.id);
    if(instructorID){
        accountConnections.delete(instructorID)
    }
    if(organisationID){
        accountConnections.delete(organisationID)
    }
    if(staffID){
      accountConnections.delete(staffID)
  }
  });
});

//utils imports
import './controllers/scheduleCms.controllers.js'

// Start server with socket
const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});