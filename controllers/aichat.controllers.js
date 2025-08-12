import { GoogleGenerativeAI } from '@google/generative-ai';
import AiChatModel from '../models/AiChat.js';
import { v4 as uuidv4 } from 'uuid';
import StudentModel from '../models/Student.js';
import UserChatsWithAiModel from '../models/UserChatsWithAi.js';
import CourseCategoryModel from '../models/CourseCategories.js';

const edtechafricAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const zara = edtechafricAI.getGenerativeModel({ model: 'gemini-2.5-flash' });


export async function aiChat(req, res) {
    const { user, name, role, chatId, userId } = req.chatId
    console.log('CHAT ID', req.chatId)
    //const { } = req.user
    const { message } = req.body

    if(!message){
        return ({ success: false, data: 'Invalid message length' })
    }


    try {
        let findUserChat
        let messageChatData
        findUserChat = await AiChatModel.findOne({ userId: userId });
        messageChatData = await UserChatsWithAiModel.findOne({ userId: userId });
        const categoriesList = (await CourseCategoryModel.find().select('category -_id').lean())
            .map(item => item.category);

        if (!findUserChat) {
            const aiChatData = {
                userId: userId,
                history: []
            };
        
            // If the user is false, set a 2-hour expiration
            if (!user) {
                aiChatData.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
            }
            findUserChat = await AiChatModel.create(aiChatData);
        }
        if (!messageChatData) {
            const aiUserMessges = {
                userId: userId,
                chats: [] 
            };
        
            // If the user is false, set a 2-hour expiration
            if (!user) {
                aiUserMessges.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
            }
            messageChatData = await UserChatsWithAiModel.create(aiUserMessges);
        }

        const chat = zara.startChat({
            history: findUserChat.history,
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const firstPrompt = `
            You are Zara an AI Powered assistance for a platform: Edtech Africa. Edtech Africa is an online education platform where untrained teachers can come in and learn on how to be better teachers at their job. you are
            to answer users questions the will ask as regards this platform and work. also users will be able to ask you details about a cousre and also questions you will help them answer it. If a user wants to know more about a course ask them to provide you the course code. 
            Also you will be an assistant to couser instructors to if they need your help to in setting up cousre you would know a instructor from the account type of the user.
            you are to help the user to search for courses the want to the should give you what the want to search for.


            Let the user know who you are and what you can do
            this is the user details: ${user ? req.user : 'It is a new user'} 
            course categories: ${categoriesList} give it to the user in a readable form if only requested by the user
        `

        const secondPrompt = `
            based on your very first prompt given to you in the chat histroy to work with it, the current user details in object form is: ${user ? req.user : 'A New User and ask for their name to chat with'} and customer username is ${user ? req?.user.name  : 'A New User and ask for their name to chat with'} continue workig with the first prompt as guide also with the current updated data. the new customer message is: ${message}
            always remember to keep track of the conversation and analyze the chat to fill the corresponding json object appropriately as stated in the first prompt
            course categories: ${categoriesList} give it to the user in a readable form if only requested by the user
        `

        const result = await chat.sendMessage(findUserChat.history.length > 0 ? secondPrompt : firstPrompt );
        const response = await result.response;
        const text = response.text();
        console.log('MESSAGE FROM GEMINI:', text);

        // Update chat history
        const userOject = { role: 'user', parts: [ { text: message } ] }
        findUserChat.history.push(userOject);
        await findUserChat.save();

        const modelObject = { parts: [ { text: text } ], role: 'model' }
        findUserChat.history.push(modelObject);
        await findUserChat.save();

        //console.log('DATA', findUserChat.history )

        // Extract JSON string if it exists
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.indexOf("}");
        let trimmedMsg;

        if (jsonStart !== -1 && jsonEnd !== -1) {
            try {
                let jsonString = text.substring(jsonStart, jsonEnd + 1);
                trimmedMsg = text.substring(jsonStart, jsonEnd + 1);
                
                                // Remove comments from JSON string
                                jsonString = jsonString.replace(/\/\/.*$/gm, '').trim()

                console.log('JSON STRING OBJECT', jsonString)
                //convert to proper json
                jsonString = jsonString
                .replace(/(\w+):/g, '"$1":')        
                .replace(/'/g, '"'); 
                console.log('PROPER JSON', jsonString)
                const jsonObject = JSON.parse(jsonString);
                console.log('FULL JSON', jsonObject)

                
                // Remove JSON array from the final message
                let finalMessage
                //finalMessage = text.replace(trimmedMsg, '').trim();

                finalMessage = text.replace(/(\*\*Here's the updated user data:\*\*[\s\S]*?```[\s\S]*?```)/, '').trim();

                if (finalMessage) {
                    const userMsg = { role: 'user' , chat: message }
                    messageChatData.chats.push(userMsg);
                    await messageChatData.save();

                    const aiMsg = { role: 'model', chat: finalMessage }
                    messageChatData.chats.push(aiMsg);
                    await messageChatData.save();

                    return ({ success: true, data: { msg: messageChatData.chats } })
                }
            } catch (error) {
                console.error('Failed to parse JSON AI Chat:', error);
                const userMsg = { role: 'user', chat: message }
                messageChatData.chats.push(userMsg);
                await messageChatData.save();

                const aiMsg = { role: 'model', chat: text }
                messageChatData.chats.push(aiMsg);
                await messageChatData.save();
                return ({ success: true, data: { msg: messageChatData.chats } })
            }
        } else {
            // If no JSON string is found, send the original text
            const userMsg = { role: 'user' , chat: message }
            messageChatData.chats.push(userMsg);
            await messageChatData.save();

            const aiMsg = { role: 'model', chat: text }
            messageChatData.chats.push(aiMsg);
            await messageChatData.save();
            return ({ success: true, data: { msg: messageChatData.chats } })
        }
    } catch (error) {
        console.log('AI UNABLE TO RESPOND', error)
        return ({ success: false, data: 'AI unable to respond' })
    }
}