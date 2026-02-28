import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { canAccessFaction, hasFactionAccess, getUserVisibleFactions } from '@/utils/factionPermissions';
import { apiClient } from '@/services/api';

export const useFactionAccess = () => {
    const { user } = useAuthStore();
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserRoles = async () => {
            if (!user?.id) {
                setLoading(false);
                return;
            }

            try {
                // Buscar roles do endpoint correto
                const response = await apiClient.get(`/users/${user.id}/roles`);

                if (response.success && response.roles) {
                    // Extrair display_name das roles
                    const roles = response.roles.map((role: any) => role.display_name);
                    console.log('✅ Roles encontradas:', roles);
                    setUserRoles(roles);
                } else {
                    console.log('⚠️ Nenhuma role encontrada');
                    setUserRoles([]);
                }
            } catch (error) {
                console.error('❌ Erro ao buscar roles:', error);
                setUserRoles([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUserRoles();
    }, [user]);

    const canViewFaction = (factionName: string) => {
        return canAccessFaction(userRoles, factionName);
    };

    const hasAnyFactionAccess = hasFactionAccess(userRoles);
    const visibleFactions = getUserVisibleFactions(userRoles);

    console.log('🔍 Debug useFactionAccess:', {
        userRoles,
        hasAnyFactionAccess,
        visibleFactions,
        loading
    });

    return {
        canViewFaction,
        hasAnyFactionAccess,
        visibleFactions,
        userRoles,
        loading
    };
};