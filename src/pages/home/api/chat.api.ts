import { ref } from 'vue';
import { IMessage } from '@/entities/message.entity';
import { IMessageDTO } from '@/entities/messageDTO.entity';
import { IUser } from '@/entities/user.entity';

const parseMessageData = (message: { id: string; message: string; images: string[]; user_from: string; created_at: number }) => {
    const newMessage = {
        id: message.id,
        text_content: message.message,
        image_content: message.images ? message.images?.map(image => `https://chat-app-3yg1.onrender.com/api/image?id=${image}`) : [],
        sender: message.user_from,
        timestamp: message.created_at,
    };
    return newMessage;
};

export function useChatSocket(currentUserId: string) {
    let websocket: WebSocket | null = null;
    const messages = ref<IMessage[]>([]);
    const selectedUser = ref<IUser | null>(null);

    // Handle incoming WebSocket messages
    const initWebSocketHandlers = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            websocket = new WebSocket("wss://chat-app-3yg1.onrender.com/chat/ws");

            websocket.onopen = () => {
                console.log('WebSocket connection opened');
                resolve();  // Resolve the promise when the WebSocket is open
            };

            websocket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.chat_messages) {
                    const oldMessages: IMessage[] = message.chat_messages.map((msg: any) => parseMessageData(msg));
                    messages.value.push(...oldMessages);
                } else {
                    const newMessage = parseMessageData(message);
                    messages.value.push(newMessage);
                }
            };

            websocket.onclose = () => {
                console.log('WebSocket connection closed');
            };

            websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(error);  // Reject the promise in case of error
            };
        });
    };

    // Send message to the server
    const sendMessage = (newMessage: string, imageCodes: string[]) => {
        if (websocket?.readyState === WebSocket.OPEN) {
            const messageDTO: IMessageDTO = {
                message: newMessage,
                sender_id: currentUserId,
                images: imageCodes
            };
            websocket.send(JSON.stringify(messageDTO));
        }
    };

    // Select a user to start the conversation
    const selectUser = async (user: IUser) => {
        selectedUser.value = user;
        messages.value = [];  // Clear the current messages
        const chatMembers = {
            user1_id: currentUserId,
            user2_id: user.id,
        };

        // Wait for WebSocket connection to open, then send the chat initiation message
        await initWebSocketHandlers().then(() => {
            if (websocket?.readyState === WebSocket.OPEN) {
                websocket.send(JSON.stringify(chatMembers));
            }
        }).catch(error => {
            console.error('Error initializing WebSocket:', error);
        });
    };

    // Close WebSocket connection
    const closeConnection = () => {
        websocket?.close();
    };

    // Initialize WebSocket handlers when called
    initWebSocketHandlers();

    return {
        messages,
        selectedUser,
        sendMessage,
        selectUser,
        closeConnection,
    };
}

export const getImage = async (imageId: string, token: string): Promise<string> => {
        const response = await fetch(`https://chat-app-3yg1.onrender.com/api/image?id=${imageId}`, 
            {
                headers: {Authorization: `Bearer ${token}`}
            }
        );
 
        const blob = await response.blob();

        return URL.createObjectURL(blob)
    }
