// components/auth/ProtectedRoute.tsx
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: ReactNode;
    requireAuth?: boolean;
    requireRole?: string[];
    requireStaff?: boolean;
}

export const ProtectedRoute = ({
                                   children,
                                   requireAuth = true,
                                   requireRole,
                                   requireStaff
                               }: ProtectedRouteProps) => {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            if (isLoading) {
                return;
            }

            setIsChecking(false);
        };

        checkAuth();
    }, [isLoading, user, isAuthenticated]);

    if (isLoading || isChecking) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--background-primary)'
            }}>
                <Loader2 size={48} className="animate-spin" style={{ color: '#0ea5e9' }} />
            </div>
        );
    }

    // Se a página requer autenticação e o usuário não está autenticado
    if (requireAuth && !isAuthenticated) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Se a página não requer autenticação e o usuário está autenticado
    if (!requireAuth && isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Verificar roles específicas
    if (requireRole && user) {
        const hasRequiredRole = requireRole.some(role =>
            user.roles?.includes(role)
        );

        if (!hasRequiredRole) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    // Verificar se é staff
    if (requireStaff && user && !user.is_staff_member) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
};