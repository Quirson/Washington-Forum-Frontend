import { apiClient } from './api';
import { ApiResponse, PaginatedResponse, Thread, Reply, Category } from '@/types';

export const forumService = {
    // Threads
    async getThreads(params?: {
        page?: number;
        limit?: number;
        sort?: string;
        categoryId?: string;
    }): Promise<PaginatedResponse<Thread>> {
        return apiClient.get('/forum/threads', { params });
    },

    async getThread(id: string): Promise<ApiResponse<Thread>> {
        return apiClient.get(`/forum/threads/${id}`);
    },

    async createThread(data: Partial<Thread>): Promise<ApiResponse<Thread>> {
        return apiClient.post('/forum/threads', data);
    },

    async updateThread(id: string, data: Partial<Thread>): Promise<ApiResponse<Thread>> {
        return apiClient.put(`/forum/threads/${id}`, data);
    },

    async deleteThread(id: string): Promise<ApiResponse<void>> {
        return apiClient.delete(`/forum/threads/${id}`);
    },

    async likeThread(id: string): Promise<ApiResponse<void>> {
        return apiClient.post(`/forum/threads/${id}/like`);
    },

    // Replies
    async getReplies(threadId: string, page?: number): Promise<PaginatedResponse<Reply>> {
        return apiClient.get(`/forum/threads/${threadId}/replies`, { params: { page } });
    },

    async createReply(threadId: string, data: Partial<Reply>): Promise<ApiResponse<Reply>> {
        return apiClient.post(`/forum/threads/${threadId}/replies`, data);
    },

    async updateReply(replyId: string, data: Partial<Reply>): Promise<ApiResponse<Reply>> {
        return apiClient.put(`/forum/replies/${replyId}`, data);
    },

    async deleteReply(replyId: string): Promise<ApiResponse<void>> {
        return apiClient.delete(`/forum/replies/${replyId}`);
    },

    async likeReply(replyId: string): Promise<ApiResponse<void>> {
        return apiClient.post(`/forum/replies/${replyId}/like`);
    },

    // Categories
    async getCategories(): Promise<ApiResponse<Category[]>> {
        return apiClient.get('/forum/categories');
    },

    async getCategory(id: string): Promise<ApiResponse<Category>> {
        return apiClient.get(`/forum/categories/${id}`);
    },

    // Search
    async searchThreads(query: string, filters?: any): Promise<PaginatedResponse<Thread>> {
        return apiClient.get('/forum/threads/search', { params: { q: query, ...filters } });
    },
};