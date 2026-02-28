// store/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';


interface User {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
    highest_role?: string;
    role_priority?: number;
    is_staff_member?: boolean;
    discord_username?: string;

}

// limite seguro (chars) pra não estourar storage
const MAX_AVATAR_CHARS = 150_000; // ~150KB em texto

function stripHugeAvatar(user: User | null): User | null {
    if (!user) return user;
    const u: User = { ...user };

    if (typeof u.avatar_url === 'string' && u.avatar_url.startsWith('data:')) {
        if (u.avatar_url.length > MAX_AVATAR_CHARS) {
            // não persistir base64 gigante
            u.avatar_url = ''; // ou mantém vazio
        }
    }

    return u;
}

interface AuthStore {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // recebe do auth.service
    login: (user: User, token: string) => void;
    logout: () => void;
    setUser: (user: Partial<User> | null) => void;
    initialize: () => void;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,

            login: (user, token) => {
                // NÃO escrever manualmente no localStorage aqui
                // O persist vai salvar automaticamente o estado (sanitizado pelo partialize)
                set({
                    user,
                    token,
                    isAuthenticated: true,
                    isLoading: false
                });
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    isLoading: false
                });
            },

            setUser: (patch) => {
                const current = get().user;
                const next = patch ? { ...(current || ({} as User)), ...patch } : null;

                set({
                    user: next,
                    isAuthenticated: !!get().token && !!next,
                });
            },

            initialize: () => {
                // Como estamos usando persist, ele rehidrata sozinho.
                // Aqui só garantimos que isLoading vá pra false quando já tiver rehidratado
                set({ isLoading: false });
            }
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),

            // 🔥 AQUI está a cura:
            // persistir só o essencial + user SEM base64 gigante
            partialize: (state) => ({
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                user: stripHugeAvatar(state.user)
            })
        }
    )
);
