import { GoogleGenerativeAI } from '@google/generative-ai';
import AiChatModel from '../models/AiChat.js';
import { v4 as uuidv4 } from 'uuid';
import UserModel from '../models/User.js';

const edtechafricAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const zara = edtechafricAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });

/**
 * 
export async function aiChat(req, res) {
    const { message } = req.body

    let userToken = req.cookies.edtechafric;
    let chatId = req.cookies.chatsessionid;
    let user

    console.log(userToken, chatId)

    if (!userToken) {
        chatId = uuidv4(); 
        res.cookie('chatsessionid', chatId, { maxAge: 900000, httpOnly: true });
    }

    if(userToken){
        user = await new Promise((resolve, reject) => {
            jsonwebtoken.verify(userToken, process.env.JWT_SECRET, (err, decoded) => {
              if (err) {
                return reject(err);
              }
              resolve(decoded);
            });
          });
    }

    console.log('USER', user)

    let isUser
    if(user){
        const { id } = user
        isUser = await UserModel.findById(id);
    } else {
        chatId = uuidv4(); 
        res.cookie('chatsessionid', chatId, { maxAge: 900000, httpOnly: true });
    }

    if(!isUser){
        chatId = uuidv4(); 
        res.cookie('chatsessionid', chatId, { maxAge: 900000, httpOnly: true });
    }
    const { password, ...userData} = isUser?._doc

    try {
        const findUserChat = await AiChatModel.findOne({ userId: _id });

        if (!findUserChat) {
            await WhatsappChatModel.create({ userId: Date.now() });
        }

        const chat = zara.startChat({
            history: findUserChat.history,
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const firstPrompt = `
            You are Zara an AI Powered assistance for a platform: Edtech Afric. Edtech Afric is an online education platform where untrained teachers can come in and learn on how to be better teachers at their job. you are
            to answer users questions the will ask as regards this platform and work. also users will be able to ask you details about a cousre and also questions you will help them answer it. If a user wants to know more about a course ask them to provide you the course code. 
            Also you will be an assistant to couser instructors to if they need your help to in setting up cousre you would know a instructor from the account type of the user.
            you are to help the user to search for courses the want to the should give you what the want to search for.


            Let teh user know who you are and what you can do
            this is the user details: ${userData} 
        `

        const secondPrompt = `
            based on your very first prompt given to you in the chat histroy to work with it, the current user details in object form is: ${userData ? userData : 'A New User and ask for their name to chat with'} and customer username is ${userData.firstName ? userData?.firstName : userData?.userName ? userData.userName : 'A New User and ask for their name to chat with'} continue workig with the first prompt as guide also with the current updated data. the new customer message is: ${message}
            always remember to keep track of the conversation and analyze the chat to fill the corresponding json object appropriately as stated in the first prompt
        `

        const result = await chat.sendMessage(findUserChat.history.length > 0 ? secondPrompt : firstPrompt );
        const response = await result.response;
        const text = response.text();
        console.log('MESSAGE FROM GEMINI:', text);

        // Update chat history
        findUserChat.history = chat.params.history;
        await findUserChat.save();

        // Extract JSON string if it exists
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.indexOf("}");
        let trimmedMsg;

        if (jsonStart !== -1 && jsonEnd !== -1) {
            try {
                let jsonString = text.substring(jsonStart, jsonEnd + 1);
                trimmedMsg = text.substring(jsonStart, jsonEnd + 1);

                console.log('JSON STRING OBJECT', jsonString)
                //convert to proper json
                jsonString = jsonString
                .replace(/(\w+):/g, '"$1":')        
                .replace(/'/g, '"'); 
                console.log('PROPER JSON', jsonString)
                const jsonObject = JSON.parse(jsonString);
                
                // Remove JSON array from the final message
                const finalMessage = text.replace(trimmedMsg, '').trim();

                if (finalMessage) {
                    return res.status(200).json({ success: true, data: { msg: finalMessage } })
                }
            } catch (error) {
                console.error('Failed to parse JSON AI Chat:', error);
                return res.status(200).json({ success: true, data: { msg: text } })
            }
        } else {
            // If no JSON string is found, send the original text
            return res.status(200).json({ success: true, data: { msg: text } })
        }
    } catch (error) {
        console.log('AI UNABLE TO RESPOND', error)
        res.status(500).json({ success: false, data: 'AI unable to respond' })
    }
}
 */

export async function aiChat(req, res) {
    const { message } = req.body

    if(!message){
        return res.status(400).json({ success: false, data: 'Invalid message length' })
    }
    const _id = '1234567'

    const userData = {
        username: 'John',
        firstName: 'Jonathan',
        lastName: 'Alex',
        email: 'john@gmail.com',
        phoneNumber: '09012345678',
        totalTransaction: 20000,
        verified: true
    }


    try {
        let findUserChat
        findUserChat = await AiChatModel.findOne({ userId: _id });

        if (!findUserChat) {
            findUserChat = await AiChatModel.create({ userId: Date.now() });
        }

        const chat = zara.startChat({
            history: findUserChat.history,
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const firstPrompt = `
            You are Zara an AI Powered assistance for a platform: Edtech Afric. Edtech Afric is an online education platform where untrained teachers can come in and learn on how to be better teachers at their job. you are
            to answer users questions the will ask as regards this platform and work. also users will be able to ask you details about a cousre and also questions you will help them answer it. If a user wants to know more about a course ask them to provide you the course code. 
            Also you will be an assistant to couser instructors to if they need your help to in setting up cousre you would know a instructor from the account type of the user.
            you are to help the user to search for courses the want to the should give you what the want to search for.


            Let teh user know who you are and what you can do
            this is the user details: ${userData} 
        `

        const secondPrompt = `
            based on your very first prompt given to you in the chat histroy to work with it, the current user details in object form is: ${userData ? userData : 'A New User and ask for their name to chat with'} and customer username is ${userData.firstName ? userData?.firstName : userData?.userName ? userData.userName : 'A New User and ask for their name to chat with'} continue workig with the first prompt as guide also with the current updated data. the new customer message is: ${message}
            always remember to keep track of the conversation and analyze the chat to fill the corresponding json object appropriately as stated in the first prompt
        `

        const result = await chat.sendMessage(findUserChat.history.length > 0 ? secondPrompt : firstPrompt );
        const response = await result.response;
        const text = response.text();
        console.log('MESSAGE FROM GEMINI:', text);

        // Update chat history
        findUserChat.history = chat.params.history;
        await findUserChat.save();

        // Extract JSON string if it exists
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.indexOf("}");
        let trimmedMsg;

        if (jsonStart !== -1 && jsonEnd !== -1) {
            try {
                let jsonString = text.substring(jsonStart, jsonEnd + 1);
                trimmedMsg = text.substring(jsonStart, jsonEnd + 1);

                console.log('JSON STRING OBJECT', jsonString)
                //convert to proper json
                jsonString = jsonString
                .replace(/(\w+):/g, '"$1":')        
                .replace(/'/g, '"'); 
                console.log('PROPER JSON', jsonString)
                const jsonObject = JSON.parse(jsonString);
                
                // Remove JSON array from the final message
                const finalMessage = text.replace(trimmedMsg, '').trim();

                if (finalMessage) {
                    return res.status(200).json({ success: true, data: { msg: finalMessage } })
                }
            } catch (error) {
                console.error('Failed to parse JSON AI Chat:', error);
                return res.status(200).json({ success: true, data: { msg: text } })
            }
        } else {
            // If no JSON string is found, send the original text
            return res.status(200).json({ success: true, data: { msg: text } })
        }
    } catch (error) {
        console.log('AI UNABLE TO RESPOND', error)
        res.status(500).json({ success: false, data: 'AI unable to respond' })
    }
}