import { API_ORIGIN } from '@/services/api';

export const resolveMediaUrl = (url?: string) => {
    if (!url) return '';
    // se já for absoluta (http/https/data:)
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;

    // se vier do backend como /uploads/...
    if (url.startsWith('/uploads/')) return `${API_ORIGIN}${url}`;

    // fallback
    return url;
};
