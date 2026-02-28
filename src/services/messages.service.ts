// services/messages.service.ts
import { apiClient } from './api';

export const messagesService = {
    // Buscar conversas
    getConversations: async () => {
        return apiClient.get('/messages');
    },

    // Buscar mensagens de uma conversa
    getMessages: async (conversationId: string) => {
        return apiClient.get(`/messages/${conversationId}`);
    },

    // Enviar mensagem
    sendMessage: async (data: {
        conversation_id?: string;
        to_user_id?: string;
        content: string;
    }) => {
        return apiClient.post('/messages/send', data);
    },

    // Verificar se já existe conversa
    checkExistingConversation: async (toUserId: string) => {
        return apiClient.get(`/messages/check/${toUserId}`);
    },

    // Marcar como lida
    markAsRead: async (conversationId: string) => {
        return apiClient.put(`/messages/${conversationId}/read`);
    },

    // Buscar usuários para nova conversa
    searchUsersForChat: async (query: string) => {
        return apiClient.get(`/users/search/chat?q=${query}`);
    }
};