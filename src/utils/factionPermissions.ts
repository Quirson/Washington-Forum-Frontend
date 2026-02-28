// Lista de roles que podem ver TUDO (todas as factions)
const FULL_ACCESS_ROLES = [
    // Staff de alto nível
    'Founder',
    'Server Manager',
    'Management Team',
    'Head of Staff',
    'Assistant Head of Staff',
    'Supervisor',
    'Faction Organizer',
    'Ticket Manager',
    'Discord Helper'
];

// Roles que podem ver apenas factions LEGAIS
const LEGAL_ACCESS_ROLES = [
    'Legal Leader',
    'Human Resources',
    'Internal and External Affairs'
];

// Mapeamento de roles Discord para nomes de factions
const ROLE_TO_FACTION_MAP: Record<string, string> = {
    // Factions Legais
    'White House': 'White House',
    'FBI': 'FBI',
    'SAPD': 'SAPD',
    'Army': 'Army',
    'Radio Center': 'Radio Center',

    // Factions Ilegais
    'Grove': 'Grove',
    'Ballas': 'Ballas',
    'Vagos': 'Vagos',
    'Azteca': 'Aztecas',
    'Aztecas': 'Aztecas',
    'Rifa': 'Rifa',
    'The Yakuza': 'The Yakuza',
    'Russian Mafia': 'Russian Mafia',
    'Terrorist': 'Terrorist'
};

// Verificar se usuário tem acesso a uma faction específica
export const canAccessFaction = (userRoles: string[], factionName: string): boolean => {
    // Se tem acesso total (Founder, Staff, etc.)
    if (userRoles.some(role => FULL_ACCESS_ROLES.includes(role))) {
        return true;
    }

    // Verificar se tem role específica da faction
    for (const [roleName, mappedFaction] of Object.entries(ROLE_TO_FACTION_MAP)) {
        if (userRoles.includes(roleName) && mappedFaction === factionName) {
            return true;
        }
    }

    // Legal Leader vê apenas a faction dele (FBI no caso)
    if (userRoles.includes('Legal Leader')) {
        // Se o usuário também tem role FBI, só vê FBI
        // Se não tiver role específica, não vê nada
        return false; // Legal Leader sem role específica = não vê nada
    }

    // Illegal Leader vê apenas a faction dele
    if (userRoles.includes('Illegal Leader')) {
        return false; // Illegal Leader sem role específica = não vê nada
    }

    return false;
};

// Obter todas as factions que o usuário pode ver
export const getUserVisibleFactions = (userRoles: string[]): string[] => {
    const visibleFactions: string[] = [];

    // Se tem acesso total, retorna todas
    if (userRoles.some(role => FULL_ACCESS_ROLES.includes(role))) {
        return Object.values(ROLE_TO_FACTION_MAP).filter((v, i, a) => a.indexOf(v) === i);
    }

    // Adicionar factions baseadas em roles específicas
    userRoles.forEach(role => {
        const faction = ROLE_TO_FACTION_MAP[role];
        if (faction && !visibleFactions.includes(faction)) {
            visibleFactions.push(faction);
        }
    });

    return visibleFactions;
};

// Verificar se usuário pode ver alguma faction
export const hasFactionAccess = (userRoles: string[]): boolean => {
    return getUserVisibleFactions(userRoles).length > 0;
};