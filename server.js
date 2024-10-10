import express from "express";
import { config } from 'dotenv';
config();
import cookieParser from 'cookie-parser'
import cors from 'cors'

//IMPORT ROUTES
import authRoute from './routes/auth.routes.js'
import aiChatRoute from './routes/aichat.routes.js'
import courseRoute from './routes/course.routes.js'


const app = express();

app.use(cookieParser())
app.use(express.json())


// CORS setup
const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.SERVER_URL,
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS', 'ORIGIN>',origin));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

// Apply CORS middleware
app.use(cors(corsOptions));


//DOCs
import swaggerUI from 'swagger-ui-express';
import YAML from 'yamljs';
const swaggerJSDocs = YAML.load('./api.yaml');

// Swagger setup
app.use('/api-doc', swaggerUI.serve, swaggerUI.setup(swaggerJSDocs));


// Import DB connection
import './connection/db.js';

// Routes
app.get('/', (req, res) => {
    res.status(200).json('Home GET Request');
});

//ROUTES
app.use('/api/auth', authRoute)
app.use('/api/aiChat', aiChatRoute)
app.use('/api/course', courseRoute)




// Start server
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});