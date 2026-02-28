// src/services/posts.service.ts
import { apiClient } from "@/services/api";

export type PostAuthor = {
    id: string;
    username: string;
    avatar_url?: string;
    highest_role?: string;
    priority?: number;
};

export type PostItem = {
    id: string;
    author_id?: string | null;
    content: string;
    image_url?: string | null;
    is_hidden: boolean;
    like_count: number;
    comment_count: number;
    created_at: string;
    updated_at: string;

    // se teu backend já junta user
    author?: PostAuthor;

    // se teu backend devolve se o user já deu like
    is_liked?: boolean;
};

type ListPostsResponse = {
    success: boolean;
    posts: PostItem[];
    next_offset?: number;
};

type CreatePostResponse = {
    success: boolean;
    post?: PostItem;
    id?: string;
};

type UploadResponse = {
    success: boolean;
    url?: string;        // "/uploads/xxx.gif"
    file_url?: string;   // se teu backend usar outro nome
    path?: string;
};

export type CommentAuthor = {
    id?: string;
    username?: string;
    avatar_url?: string;
    highest_role?: string;
    priority?: number;
};

export type CommentItem = {
    id: string;
    post_id?: string;
    content: string;
    created_at: string;

    // alguns backends devolvem estes campos "flat"
    username?: string;
    avatar_url?: string;
    highest_role?: string;
    priority?: number;

    // alguns devolvem nested
    author?: CommentAuthor;

    // id do dono (pode vir como user_id ou author_id)
    user_id?: string;
    author_id?: string;
};

type ListCommentsResponse = {
    success: boolean;
    comments: CommentItem[];
};

const fileToBase64NoPrefix = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.onload = () => {
            const res = reader.result;
            if (typeof res !== "string") return reject(new Error("Invalid file result"));
            const parts = res.split(",");
            if (parts.length !== 2) return reject(new Error("Invalid base64 data"));
            resolve(parts[1]); // ✅ base64 puro (sem prefix)
        };
        reader.readAsDataURL(file);
    });

export const postsService = {
    list: (limit = 20, offset = 0) =>
        apiClient.get(`/posts?limit=${limit}&offset=${offset}`),

    create: (payload: { content: string; image_url?: string | null }) =>
        apiClient.post(`/posts`, payload),

    like: (postId: string) => apiClient.post(`/posts/${postId}/like`),
    unlike: (postId: string) => apiClient.delete(`/posts/${postId}/like`),

    hide: (postId: string) => apiClient.patch(`/posts/${postId}/hide`),
    unhide: (postId: string) => apiClient.patch(`/posts/${postId}/unhide`),
    deletePost: (postId: string) => apiClient.delete(`/posts/${postId}`),

    listComments: (postId: string) => apiClient.get(`/posts/${postId}/comments`),
    createComment: (postId: string, content: string) =>
        apiClient.post(`/posts/${postId}/comments`, { content }),
    deleteComment: (commentId: string) => apiClient.delete(`/post-comments/${commentId}`),


    // ✅ NOVO: upload Base64 (retorna URL)
    async uploadMedia(file: File) {
        const base64 = await fileToBase64NoPrefix(file);

        const res: any = await apiClient.post("/media/upload/base64", {
            image: base64,
            type: "post",
        });

        // teu backend retorna url TOP-LEVEL
        const url = res?.url || res?.data?.url || res?.media?.url;
        if (!url) throw new Error("Upload did not return an URL");
        return url as string; // "/uploads/....gif"
    },
};