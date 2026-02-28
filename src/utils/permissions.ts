type User = {
    roles?: string[];                 // (token antigo / opcional)
    role_priority?: number;           // teu user atual
    highest_role?: string;
    discord_roles?: DiscordRole[];    // teu user atual
    is_staff_member?: boolean;
};
type DiscordRole = {
    id: string;
    is_staff?: boolean;
    priority?: number;
    display_name?: string;
};

type UserLike = {
    id: string;
    discord_roles?: DiscordRole[];
    role_priority?: number;
};

export const CONTENT_CREATOR_ROLE_ID = 'ea06c1e8-be06-497b-b397-c9d11cbbeb44';

export const isStaff = (user?: UserLike | null) => {
    const roles = user?.discord_roles || [];
    return roles.some(r => r.is_staff === true);
};

export const isContentCreator = (user?: UserLike | null) => {
    const roles = user?.discord_roles || [];
    return roles.some(r => r.id === CONTENT_CREATOR_ROLE_ID);
};

export const canCreateCommunityContent = (user?: UserLike | null) => {
    return isStaff(user) || isContentCreator(user);
};

// opcional (se quiseres permitir autor apagar o próprio post):
export const canDeleteCommunityContent = (user?: UserLike | null, authorId?: string) => {
    if (!user) return false;
    if (isStaff(user)) return true;      // staff apaga tudo
    return user.id === authorId;         // autor apaga o seu (opcional)
};


const STAFF_CREATE_MIN_PRIORITY = 850;

export const getHighestPriority = (user?: User | null) => {
    if (!user) return 0;

    // 1) se tiver role_priority no user (teu caso)
    if (typeof user.role_priority === 'number') return user.role_priority;

    // 2) se tiver discord_roles
    const maxFromDiscordRoles =
        (user.discord_roles || [])
            .map(r => Number(r.priority || 0))
            .reduce((a, b) => Math.max(a, b), 0);

    if (maxFromDiscordRoles > 0) return maxFromDiscordRoles;

    // 3) fallback por roles string (se existir)
    const roles = user.roles || [];
    if (roles.includes('Founder')) return 1000;
    if (roles.includes('Server Manager')) return 990;
    if (roles.includes('Management Team')) return 950;
    if (roles.includes('Head of Staff')) return 850;

    return 0;
};

export const hasRoleName = (user?: User | null, name?: string) => {
    if (!user || !name) return false;

    // roles[] (string)
    if (user.roles?.includes(name)) return true;

    // highest_role
    if (user.highest_role === name) return true;

    // discord_roles
    if (user.discord_roles?.some(r => r.display_name === name)) return true;

    return false;
};

export const isStaffByRole = (user?: User | null) => {
    if (!user) return false;

    // flag
    if (user.is_staff_member) return true;

    // discord_roles
    if (user.discord_roles?.some(r => r.is_staff)) return true;

    // fallback por prioridade
    return getHighestPriority(user) >= STAFF_CREATE_MIN_PRIORITY;
};

export const canCreateNewsOrUpdates = (user?: User | null) => {
    return getHighestPriority(user) >= STAFF_CREATE_MIN_PRIORITY;
};