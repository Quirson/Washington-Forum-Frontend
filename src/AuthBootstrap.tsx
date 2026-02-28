import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";

export function AuthBootstrap() {
    const { user, isAuthenticated, isLoading, setUser } = useAuthStore();

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) return;

        const needsFetch =
            !user ||
            user.avatar_url === "__FETCH_FROM_API__" ||
            user.role_priority == null ||
            user.highest_role == null;

        if (!needsFetch) return;

        authService.getCurrentUser().then((res) => {
            const u = (res.user || res.data) as any;
            setUser(u);
        }).catch(() => {});
    }, [isLoading, isAuthenticated, user?.avatar_url, user?.role_priority, user?.highest_role, setUser]);

    return null;
}