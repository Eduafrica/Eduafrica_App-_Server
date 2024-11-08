import express from "express";
import { config } from 'dotenv';
import http from 'http'; 
import { Server } from 'socket.io';
config();

import cookieParser from 'cookie-parser';
import cors from 'cors';

//IMPORT ROUTES
import authRoute from './routes/auth.routes.js';
import studentRoute from './routes/studentAuth.routes.js';
import instructorRoute from './routes/studentAuth.routes.js';
import organizationRoute from './routes/organizationAuth.routes.js';
import aiChatRoute from './routes/aichat.routes.js';
import courseRoute from './routes/course.routes.js';

const app = express();
const server = http.createServer(app); 
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL, 
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cookieParser());
app.use(express.json());

// CORS setup
const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.SERVER_URL,
    '*',
];
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

// Setup socket.io connection
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Listen for incoming messages on aiChat
    socket.on('aiChat', async (data) => {
        try {
            const { user, message } = data;
            const response = await aiChat(data); 
            socket.emit('aiChatResponse', response);
        } catch (error) {
            socket.emit('error', { message: 'AI unable to respond' });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start server with socket
const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});
