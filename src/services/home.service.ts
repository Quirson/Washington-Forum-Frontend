import { apiClient } from '@/services/api';

export type HomeSection = 'news' | 'updates' | 'content';

export interface HomeItem {
    id: string;
    title: string;
    content: string;
    image_url?: string;
    embed_url?: string;
    embed_provider?: string;
    is_pinned?: boolean;
    created_at: string;
    author: {
        id: string;
        username: string;
        avatar_url?: string;
        highest_role?: string;
        role_color?: string;
    };
}

export const homeService = {
    async list(section: HomeSection) {
        return apiClient.get(`/home/${section}`);
    },

    async create(section: HomeSection, payload: {
        title: string;
        content: string;
        image_url?: string;
        embed_url?: string;
        is_pinned?: boolean;
    }) {
        return apiClient.post(`/home/${section}`, payload);
    },

    async remove(section: HomeSection, id: string) {
        return apiClient.delete(`/home/${section}/${id}`);
    }
    
};