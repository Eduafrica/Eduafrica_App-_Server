import { config } from 'dotenv';
config();
import { GoogleGenerativeAI } from '@google/generative-ai';

async function getModels() {
    const edtechafricAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
    const p = .
    const models = await edtechafricAI.models.list();    
    console.log('MODEL', models)
}

getModels()