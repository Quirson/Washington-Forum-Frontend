// services/api.ts - CORRIGIDO
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.washingtongaming.tech/api/v1';
export const API_ORIGIN = API_BASE_URL.replace('/api/v1', ''); // => https://api.washingtongaming.tech

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response: AxiosResponse) => {
                // Se a resposta tem data.success, retorna apenas data
                if (response.data && typeof response.data === 'object' && 'success' in response.data) {
                    return response.data;
                }
                return response.data || response;
            },
            (error) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.get(url, config);
        return response as T;
    }
    async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.patch(url, data, config);
        return response as T;
    }

    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.post(url, data, config);
        return response as T;
    }

    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.put(url, data, config);
        return response as T;
    }

    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.delete(url, config);
        return response as T;
    }
}

export const apiClient = new ApiClient();