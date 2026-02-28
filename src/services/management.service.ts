// src/services/management.service.ts
import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

const API_BASE = "https://api.washingtongaming.tech/api/v1";

function authHeaders() {
    const token = useAuthStore.getState().token; // ✅ pega do zustand
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export type MgUser = {
    id: string;
    username: string;
    email: string;
    avatar_url: string;
    samp_name: string;
    last_ip: string;
    is_banned: boolean;
    ban_reason: string;
    banned_until: string | null;
    is_staff_member: boolean;
    join_date: string;
    last_seen: string;
    highest_role: string;
    role_priority: number;
    role_color: string;
};

export type RoleItem = {
    id: string;
    name: string;
    display: string;
    priority: number;
    color: string;
    is_staff: boolean;
};

export const managementService = {
    async listUsers(params: { search?: string; limit?: number; offset?: number; staffOnly?: boolean }) {
        const { search = "", limit = 50, offset = 0, staffOnly = false } = params;
        const res = await axios.get(`${API_BASE}/management/users`, {
            params: { search, limit, offset, staffOnly: staffOnly ? 1 : 0 },
            headers: authHeaders(),
            withCredentials: true,
        });
        return res.data as { success: boolean; count: number; users: MgUser[] };
    },

    async getUserRoles(userId: string) {
        const res = await axios.get(`${API_BASE}/management/users/${userId}/roles`, {
            headers: authHeaders(),
            withCredentials: true,
        });
        return res.data as { success: boolean; roles: RoleItem[]; highest: RoleItem | null };
    },

    async getAllRoles() {
        const res = await axios.get(`${API_BASE}/management/roles`, {
            headers: authHeaders(),
            withCredentials: true,
        });
        return res.data as { success: boolean; roles: RoleItem[] };
    },

    async patchUserRoles(userId: string, payload: { add?: string[]; remove?: string[] }) {
        const res = await axios.patch(`${API_BASE}/management/users/${userId}/roles`, payload, {
            headers: { "Content-Type": "application/json", ...authHeaders() },
            withCredentials: true,
        });
        return res.data as { success: boolean; message?: string; error?: string };
    },

    async banUser(userId: string, payload: { reason: string; days: number }) {
        const res = await axios.patch(`${API_BASE}/management/users/${userId}/ban`, payload, {
            headers: { "Content-Type": "application/json", ...authHeaders() },
            withCredentials: true,
        });
        return res.data as { success: boolean; message?: string; error?: string };
    },

    async unbanUser(userId: string) {
        const res = await axios.patch(`${API_BASE}/management/users/${userId}/unban`, {}, {
            headers: authHeaders(),
            withCredentials: true,
        });
        return res.data as { success: boolean; message?: string; error?: string };
    },

    async deleteUser(userId: string) {
        const res = await axios.delete(`${API_BASE}/management/users/${userId}`, {
            headers: authHeaders(),
            withCredentials: true,
        });
        return res.data as { success: boolean; message?: string; error?: string };
    },
};
