// services/auth.service.ts
import { apiClient } from './api';
import { ApiResponse, User, LoginCredentials, RegisterData } from '@/types';

class DebugService {
    static logRequest(endpoint: string, data: any) {
        console.group(`🌐 API Request: ${endpoint}`);
        console.log('📤 Data:', data);
        console.groupEnd();
    }

    static logResponse(endpoint: string, response: any) {
        console.group(`✅ API Response: ${endpoint}`);
        console.log('📥 Response:', response);
        console.groupEnd();
    }

    static logError(endpoint: string, error: any) {
        console.group(`❌ API Error: ${endpoint}`);
        console.error('💥 Error:', error);
        console.error('🔍 Response:', error.response);
        console.error('📊 Status:', error.response?.status);
        console.error('📝 Data:', error.response?.data);
        console.groupEnd();
    }
}

// 🔥 ESTRATÉGIA: Salvar avatar_url como FLAG, não como base64
function sanitizeUserForStorage(user: any) {
    if (!user) return user;

    const clone = { ...user };

    // Se avatar é base64 gigante, substituir por marcador
    if (typeof clone.avatar_url === 'string' && clone.avatar_url.startsWith('data:')) {
        if (clone.avatar_url.length > 150_000) {
            // ✅ Salvar FLAG ao invés do base64
            clone.avatar_url = '__FETCH_FROM_API__';
            clone.__has_avatar = true;
        }
    }

    return clone;
}

function safeSetStorage(key: string, value: string) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e: any) {
        if (String(e?.name).includes('Quota') || String(e?.message).toLowerCase().includes('quota')) {
            console.warn('⚠️ localStorage quota exceeded, using fallback');
            // Tentar salvar sem o user
            if (key === 'token') {
                try {
                    localStorage.removeItem('user');
                    localStorage.setItem(key, value);
                    return true;
                } catch {
                    return false;
                }
            }
        }
        return false;
    }
}

export const authService = {
    // Login
    async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
        DebugService.logRequest('POST /auth/login', { ...credentials, password: '***' });

        try {
            const response = await apiClient.post('/auth/login', credentials);
            DebugService.logResponse('POST /auth/login', response);

            if (response.token) {
                safeSetStorage('token', response.token);

                const safeUser = sanitizeUserForStorage(response.user);
                safeSetStorage('user', JSON.stringify(safeUser));
            }

            return response;
        } catch (error: any) {
            DebugService.logError('POST /auth/login', error);
            throw error;
        }
    },

    // Register
    async register(data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
        DebugService.logRequest('POST /auth/register', { ...data, password: '***' });

        try {
            const response = await apiClient.post('/auth/register', data);
            DebugService.logResponse('POST /auth/register', response);

            if (response.token) {
                safeSetStorage('token', response.token);

                const safeUser = sanitizeUserForStorage(response.user);
                safeSetStorage('user', JSON.stringify(safeUser));
            }

            return response;
        } catch (error: any) {
            DebugService.logError('POST /auth/register', error);
            throw error;
        }
    },

    // Logout
    async logout(): Promise<ApiResponse<void>> {
        const response = await apiClient.post('/auth/logout');

        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('user');

        return response;
    },

    // 🔥 Get current user - VERSÃO CORRIGIDA
    // 🔥 Get current user - VERSÃO FIX (pega user certo)
    async getCurrentUser(): Promise<ApiResponse<User>> {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) throw new Error('No token found');

        DebugService.logRequest('GET /auth/me', { token: '***' });

        try {
            const response: any = await apiClient.get('/auth/me');
            DebugService.logResponse('GET /auth/me', response);

            // ✅ extrair user corretamente em QUALQUER formato
            const userData: User | undefined =
                response?.user ||
                response?.data?.user ||
                response?.data ||
                response?.userData;

            if (!userData) {
                throw new Error('Invalid /auth/me response (missing user)');
            }

            // ✅ salvar versão sanitizada
            const safeUser = sanitizeUserForStorage(userData);
            safeSetStorage('user', JSON.stringify(safeUser));

            // ✅ retornar sempre no formato esperado
            return {
                success: true,
                data: userData,
                user: userData,
            };
        } catch (error: any) {
            DebugService.logError('GET /auth/me', error);

            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
            throw error;
        }
    },

    // 🔥 Update profile - VERSÃO CORRIGIDA
    async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
        DebugService.logRequest('PUT /auth/me', data);

        try {
            const response = await apiClient.put('/auth/me', data);
            DebugService.logResponse('PUT /auth/me', response);

            // Extrair user da resposta
            let userData: User;

            if (response.data?.user) {
                userData = response.data.user;
            } else if (response.user) {
                userData = response.user;
            } else if (response.data) {
                userData = response.data;
            } else {
                throw new Error('Invalid response format');
            }

            // ✅ Salvar versão sanitizada no localStorage
            const safeUser = sanitizeUserForStorage(userData);
            safeSetStorage('user', JSON.stringify(safeUser));

            // ✅ Retornar dados COMPLETOS para o frontend usar
            return {
                success: response.success !== false,
                data: userData, // ← DADOS COMPLETOS
                message: response.message
            };
        } catch (error: any) {
            DebugService.logError('PUT /auth/me', error);
            throw error;
        }
    },

    // Change password
    async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
        return apiClient.put('/auth/change-password', {
            current_password: currentPassword,
            new_password: newPassword
        });
    },

    // 🔥 Upload avatar - VERSÃO CORRIGIDA
    async uploadAvatar(base64Data: string): Promise<ApiResponse<{ data_url: string; url?: string }>> {
        DebugService.logRequest('POST /media/upload/base64', { size: base64Data.length });

        try {
            // Extrair base64 puro
            let pureBase64 = base64Data;
            if (base64Data.includes(',')) {
                const parts = base64Data.split(',');
                pureBase64 = parts[1];
            }

            const response = await apiClient.post('/media/upload/base64', {
                image: pureBase64,
                type: 'avatar'
            });

            DebugService.logResponse('POST /media/upload/base64', response);

            return {
                success: response.success || response.data?.success,
                data: {
                    data_url: response.data_url || response.data?.data_url,
                    url: response.url || response.data?.url || response.data_url || response.data?.data_url
                },
                message: response.message || response.data?.message
            };
        } catch (error: any) {
            DebugService.logError('POST /media/upload/base64', error);
            throw error;
        }
    },

    // Helper: Convert File to Base64
    async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    // Discord OAuth
    async connectDiscord(action: string): Promise<{ url: string }> {
        return apiClient.get(`/discord/connect?action=${action}`);
    },

    async getDiscordStatus(): Promise<ApiResponse<any>> {
        return apiClient.get('/discord/status');
    },

    async syncDiscord(): Promise<ApiResponse<void>> {
        return apiClient.post('/discord/sync');
    },

    async disconnectDiscord(): Promise<ApiResponse<void>> {
        return apiClient.delete('/discord/disconnect');
    },

    // Check auth
    async checkAuth(): Promise<boolean> {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return false;

        try {
            await this.getCurrentUser();
            return true;
        } catch {
            return false;
        }
    },
    // ✅ Verify email
    async verifyEmail(token: string): Promise<ApiResponse<void>> {
        DebugService.logRequest('GET /auth/verify-email', { token: '***' });
        return apiClient.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
    },

// ✅ Resend verification
    async resendVerification(email: string): Promise<ApiResponse<void>> {
        DebugService.logRequest('POST /auth/resend-verification', { email });
        return apiClient.post('/auth/resend-verification', { email });
    },

// ✅ Forgot password
    async forgotPassword(email: string): Promise<ApiResponse<void>> {
        DebugService.logRequest('POST /auth/forgot-password', { email });
        return apiClient.post('/auth/forgot-password', { email });
    },

// ✅ Reset password
    async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
        DebugService.logRequest('POST /auth/reset-password', { token: '***' });
        return apiClient.post('/auth/reset-password', {
            token,
            new_password: newPassword,
        });
    }
};