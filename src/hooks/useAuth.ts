// hooks/useAuth.ts
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

export const useAuth = () => {
    const { isAuthenticated, isLoading } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            // Redirecionar para login se não estiver autenticado
            // (exceto para páginas públicas)
            const publicPages = ['/login', '/register', '/forgot-password', '/reset-password'];
            const isPublicPage = publicPages.some(page => location.pathname.startsWith(page));

            if (!isPublicPage) {
                navigate('/login', { state: { from: location } });
            }
        }
    }, [isAuthenticated, isLoading, navigate, location]);

    return { isAuthenticated, isLoading };
};