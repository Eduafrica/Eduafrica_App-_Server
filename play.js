/**SOCKET IO CLIENT */
import io from 'socket.io-client';

const socket = io(process.env.SERVER_URL);

socket.emit('aiChat', { user, message });

socket.on('aiChatResponse', (response) => {
    console.log('AI Response:', response);
});