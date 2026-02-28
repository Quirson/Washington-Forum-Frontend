import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, UserCheck, Building2, Grid, List } from 'lucide-react';
import { apiClient } from '@/services/api';
import { Header } from '@/components/layout/Header';

export const MembersPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const { data: membersData, isLoading } = useQuery({
        queryKey: ['all-members', searchQuery, sortBy],
        queryFn: async () => {
            let url = `/users?limit=200&sort=${sortBy}`;
            if (searchQuery) url += `&search=${searchQuery}`;

            const response = await apiClient.get(url);
            return response;
        },
    });

    const members = membersData?.users || [];
    const totalMembers = membersData?.total || 0;
    const onlineCount = members.filter((m: any) => m.is_online).length;
    const factionCount = new Set(members.map((m: any) => m.samp_faction).filter(Boolean)).size;

    const getRoleColor = (priority: number = 1) => {
        if (priority >= 1000) return '#FF0000';
        if (priority >= 900) return '#FF8C00';
        if (priority >= 450) return '#00FF7F';
        if (priority >= 300) return '#7CFC00';
        if (priority >= 200) return '#20B2AA';
        if (priority >= 80) return '#FF1493';
        if (priority >= 15) return '#00FF00';
        return '#808080';
    };

    const filteredMembers = searchQuery
        ? members.filter((m: any) =>
            m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.samp_name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : members;

    return (
        <>
            <Header />

            <div style={{
                minHeight: '100vh',
                background: 'var(--background-primary)',
                paddingTop: '140px',
                paddingBottom: '3rem'
            }}>
                <div className="container-custom">
                    {/* Breadcrumb */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                    }}>
                        <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                            Home
                        </Link>
                        <span style={{ color: 'var(--text-secondary)' }}>›</span>
                        <span style={{ color: 'var(--text-primary)' }}>Members</span>
                    </div>

                    {/* Header */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '1rem',
                            marginBottom: '1rem'
                        }}>
                            <div>
                                <h1 style={{
                                    fontSize: '1.75rem',
                                    fontFamily: 'Orbitron, sans-serif',
                                    fontWeight: '700',
                                    color: 'white',
                                    marginBottom: '0.25rem'
                                }}>
                                    Members Directory
                                </h1>
                                <p style={{
                                    fontSize: '0.9rem',
                                    color: 'var(--text-secondary)',
                                    maxWidth: '600px'
                                }}>
                                    Browse all registered community members
                                </p>
                            </div>

                            {/* Stats Minimalistas */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Users size={14} />
                                    <span>{totalMembers} Members</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <UserCheck size={14} />
                                    <span>{onlineCount} Online</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Building2 size={14} />
                                    <span>{factionCount} Factions</span>
                                </div>
                            </div>
                        </div>

                        {/* Search and Filters Row */}
                        <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'center',
                            flexWrap: 'wrap'
                        }}>
                            {/* Search Bar */}
                            <div style={{ flex: '1 1 300px', maxWidth: '400px' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} style={{
                                        position: 'absolute',
                                        left: '0.875rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--text-secondary)'
                                    }} />
                                    <input
                                        type="text"
                                        placeholder="Search members..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.625rem 0.875rem 0.625rem 2.5rem',
                                            fontSize: '0.9rem',
                                            background: '#1a1a1f',
                                            border: '1px solid #2a2a32',
                                            borderRadius: '6px',
                                            color: 'white'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Sort Dropdown */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                style={{
                                    padding: '0.625rem 0.875rem',
                                    fontSize: '0.9rem',
                                    background: '#1a1a1f',
                                    border: '1px solid #2a2a32',
                                    borderRadius: '6px',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="recent">Recently Active</option>
                                <option value="posts">Most Posts</option>
                                <option value="followers">Most Followers</option>
                            </select>

                            {/* View Toggle */}
                            <div style={{
                                display: 'flex',
                                gap: '0.25rem',
                                background: '#1a1a1f',
                                padding: '0.25rem',
                                borderRadius: '6px',
                                border: '1px solid #2a2a32'
                            }}>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    style={{
                                        padding: '0.5rem',
                                        background: viewMode === 'grid' ? '#0ea5e9' : 'transparent',
                                        color: viewMode === 'grid' ? 'white' : 'var(--text-secondary)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Grid size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    style={{
                                        padding: '0.5rem',
                                        background: viewMode === 'list' ? '#0ea5e9' : 'transparent',
                                        color: viewMode === 'list' ? 'white' : 'var(--text-secondary)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <List size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Loading */}
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                            <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        /* Empty State */
                        <div style={{
                            padding: '2rem',
                            textAlign: 'center',
                            background: '#1a1a1f',
                            border: '1px solid #2a2a32',
                            borderRadius: '8px',
                            marginTop: '2rem'
                        }}>
                            <Users size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                            <h3 style={{
                                fontSize: '1rem',
                                marginBottom: '0.5rem',
                                color: 'var(--text-primary)',
                                fontWeight: '600'
                            }}>
                                No members found
                            </h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Try adjusting your search
                            </p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        /* Grid View - Cartões Mínimos igual Staff */
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                            gap: '0.875rem'
                        }}>
                            {filteredMembers.map((member: any) => {
                                const roleColor = getRoleColor(member.role_priority || 1);

                                return (
                                    <Link
                                        key={member.id}
                                        to={`/profile/${member.id}`}
                                        style={{ textDecoration: 'none', color: 'inherit' }}
                                    >
                                        <div style={{
                                            padding: '1rem',
                                            background: '#1a1a1f',
                                            borderRadius: '8px',
                                            border: '1px solid #2a2a32',
                                            transition: 'all 0.2s ease',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.5rem'
                                        }}>
                                            {/* Avatar e Nome */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem'
                                            }}>
                                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                                    <img
                                                        src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.username}&size=100&background=${roleColor.replace('#', '')}&color=fff`}
                                                        alt={member.username}
                                                        style={{
                                                            width: '48px',
                                                            height: '48px',
                                                            borderRadius: '50%',
                                                            objectFit: 'cover',
                                                            border: `2px solid ${roleColor}`
                                                        }}
                                                    />
                                                    {member.is_online && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            bottom: '0',
                                                            right: '0',
                                                            width: '10px',
                                                            height: '10px',
                                                            background: '#10b981',
                                                            borderRadius: '50%',
                                                            border: '2px solid #1a1a1f'
                                                        }}></div>
                                                    )}
                                                </div>

                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <h3 style={{
                                                        fontSize: '1rem',
                                                        fontWeight: '600',
                                                        color: 'white',
                                                        marginBottom: '0.125rem',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {member.username}
                                                    </h3>
                                                    {member.samp_name && (
                                                        <div style={{
                                                            fontSize: '0.8rem',
                                                            color: '#a0a0a8',
                                                            fontWeight: '400',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {member.samp_name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Stats Row */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(3, 1fr)',
                                                gap: '0.5rem',
                                                paddingTop: '0.5rem',
                                                borderTop: '1px solid #25252d'
                                            }}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{
                                                        fontSize: '0.95rem',
                                                        fontWeight: '700',
                                                        color: '#0ea5e9',
                                                        fontFamily: 'Orbitron, sans-serif'
                                                    }}>
                                                        {member.total_posts || 0}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.65rem',
                                                        color: '#6b7280',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        Posts
                                                    </div>
                                                </div>

                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{
                                                        fontSize: '0.95rem',
                                                        fontWeight: '700',
                                                        color: '#10b981',
                                                        fontFamily: 'Orbitron, sans-serif'
                                                    }}>
                                                        {member.total_followers || 0}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.65rem',
                                                        color: '#6b7280',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        Followers
                                                    </div>
                                                </div>

                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{
                                                        fontSize: '0.95rem',
                                                        fontWeight: '700',
                                                        color: '#f59e0b',
                                                        fontFamily: 'Orbitron, sans-serif'
                                                    }}>
                                                        {member.total_likes || 0}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.65rem',
                                                        color: '#6b7280',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        Likes
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Faction Info */}
                                            {member.samp_faction && (
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: '#a0a0a8',
                                                    padding: '0.25rem 0.5rem',
                                                    background: '#25252d',
                                                    borderRadius: '4px',
                                                    borderLeft: `3px solid ${roleColor}40`,
                                                    marginTop: '0.25rem'
                                                }}>
                                                    <div style={{ fontWeight: '500' }}>
                                                        {member.samp_faction}
                                                    </div>
                                                    {member.samp_rank && (
                                                        <div style={{
                                                            fontSize: '0.7rem',
                                                            color: '#8a8a94',
                                                            marginTop: '0.125rem'
                                                        }}>
                                                            {member.samp_rank}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        /* List View */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {filteredMembers.map((member: any) => {
                                const roleColor = getRoleColor(member.role_priority || 1);

                                return (
                                    <Link
                                        key={member.id}
                                        to={`/profile/${member.id}`}
                                        style={{ textDecoration: 'none', color: 'inherit' }}
                                    >
                                        <div style={{
                                            padding: '1rem',
                                            background: '#1a1a1f',
                                            borderRadius: '8px',
                                            border: '1px solid #2a2a32',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem'
                                        }}>
                                            {/* Avatar */}
                                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                                <img
                                                    src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.username}&size=100`}
                                                    alt={member.username}
                                                    style={{
                                                        width: '48px',
                                                        height: '48px',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover',
                                                        border: `2px solid ${roleColor}`
                                                    }}
                                                />
                                                {member.is_online && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: '0',
                                                        right: '0',
                                                        width: '10px',
                                                        height: '10px',
                                                        background: '#10b981',
                                                        borderRadius: '50%',
                                                        border: '2px solid #1a1a1f'
                                                    }}></div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h3 style={{
                                                    fontSize: '1rem',
                                                    fontWeight: '600',
                                                    color: 'white',
                                                    marginBottom: '0.25rem'
                                                }}>
                                                    {member.username}
                                                </h3>
                                                <div style={{
                                                    fontSize: '0.85rem',
                                                    color: '#a0a0a8'
                                                }}>
                                                    {member.samp_name || 'No SA-MP character'}
                                                    {member.samp_faction && ` • ${member.samp_faction}`}
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div style={{
                                                display: 'flex',
                                                gap: '1.5rem',
                                                fontSize: '0.85rem'
                                            }}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{
                                                        fontSize: '1.1rem',
                                                        fontWeight: '700',
                                                        color: '#0ea5e9',
                                                        fontFamily: 'Orbitron, sans-serif'
                                                    }}>
                                                        {member.total_posts || 0}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                                        Posts
                                                    </div>
                                                </div>

                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{
                                                        fontSize: '1.1rem',
                                                        fontWeight: '700',
                                                        color: '#10b981',
                                                        fontFamily: 'Orbitron, sans-serif'
                                                    }}>
                                                        {member.total_followers || 0}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                                        Followers
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Estilos de hover */}
            <style>{`
                a > div:hover {
                    background: #202028 !important;
                    border-color: #3a3a44 !important;
                    transform: translateY(-1px);
                }
                
                input:focus, select:focus {
                    outline: none;
                    border-color: var(--accent-blue) !important;
                }
            `}</style>
        </>
    );
};