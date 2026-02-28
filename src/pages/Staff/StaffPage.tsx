import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Shield, Users, Search, UserCheck, Building2 } from 'lucide-react';
import { apiClient } from '@/services/api';
import { Header } from '@/components/layout/Header';

export const StaffPage = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const { data: staffResponse, isLoading } = useQuery({
        queryKey: ['staff'],
        queryFn: async () => {
            const response = await apiClient.get('/staff');
            return response;
        },
    });

    const staffData = staffResponse || {};
    const staff = Array.isArray(staffData.staff) ? staffData.staff : [];
    const count = staffData.count || staff.length;
    const onlineCount = staff.filter(s => s.is_online).length;

    // Agrupar staff por departamento
    const groupStaffByDepartment = () => {
        const groups = {
            'Community Management': [] as any[],
            'Development':[] as any,
            'Administration': [] as any[],
            'Moderation': [] as any[],
            'Support': [] as any[],
            'Other': [] as any[]
        };

        staff.forEach(member => {
            const priority = member.role_priority || 100;

            if (priority >= 950) {
                groups['Community Management'].push(member);
            } else if (priority == 800 || priority == 790 || priority == 780) {
                    groups['Development'].push(member);
            } else if (priority >= 650) {
                groups['Administration'].push(member);
            } else if (priority >= 620) {
                groups['Moderation'].push(member);
            } else if (priority >= 600) {
                groups['Support'].push(member);
            } else {
                groups['Other'].push(member);
            }
        });

        // Remove grupos vazios
        Object.keys(groups).forEach(key => {
            if (groups[key as keyof typeof groups].length === 0) {
                delete groups[key as keyof typeof groups];
            }
        });

        return groups;
    };

    const staffGroups = groupStaffByDepartment();
    const departmentCount = Object.keys(staffGroups).length;

    // Função para obter emoji baseado na priority
    const getRoleIconSrc = (priority: number) => {
        if (priority >= 1000) return '/roles/crown.png';
        if (priority == 999) return '/roles/head.png';
        if (priority >= 990) return '/roles/manager.png';
        if (priority >= 950) return '/roles/shield.png';
        if (priority == 900) return '/roles/star.png';
        if (priority == 850) return '/roles/assistant.png';
        if (priority == 820) return '/roles/supervisor.png';
        if (priority == 800 || priority == 790 || priority == 780) return '/roles/head.png';
        if (priority == 730) return '/roles/senior.png';
        if (priority >= 650) return '/roles/administrator.png';
        if (priority >= 620) return '/roles/moderator.png';
        return '/roles/default.png';
    };

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
                        <span style={{ color: 'var(--text-primary)' }}>Staff</span>
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
                                    fontFamily: 'Segoe UI, sans-serif',
                                    fontWeight: '700',
                                    color: 'white',
                                    marginBottom: '0.25rem'
                                }}>
                                    Staff Directory
                                </h1>
                                <p style={{
                                    fontSize: '0.9rem',
                                    color: 'var(--text-secondary)',
                                    maxWidth: '600px'
                                }}>
                                    Meet the team that keeps Washington Gaming running
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
                                    <span>{count} Staff</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <UserCheck size={14} />
                                    <span>{onlineCount} Online</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Building2 size={14} />
                                    <span>{departmentCount} Depts</span>
                                </div>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div style={{ maxWidth: '400px' }}>
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
                                    placeholder="Search staff..."
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
                    </div>

                    {/* Loading */}
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                            <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
                        </div>
                    ) : (
                        /* Staff Groups */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {Object.entries(staffGroups).map(([department, members]) => (
                                <div key={department}>
                                    {/* Department Header */}
                                    <div style={{
                                        marginBottom: '1rem'
                                    }}>
                                        <h2 style={{
                                            fontSize: '1.1rem',
                                            fontFamily: 'Segoe UI, sans-serif',
                                            fontWeight: '600',
                                            color: 'white',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            {department}
                                            <span style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--text-secondary)',
                                                marginLeft: '0.75rem',
                                                fontWeight: '400'
                                            }}>
                                                ({members.length})
                                            </span>
                                        </h2>
                                    </div>

                                    {/* Staff Grid - Cartões Mínimos */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                        gap: '0.875rem'
                                    }}>
                                        {members.map((member) => (
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
                                                                src={member.avatar_url}
                                                                alt={member.username}
                                                                style={{
                                                                    width: '48px',
                                                                    height: '48px',
                                                                    borderRadius: '50%',
                                                                    objectFit: 'cover',
                                                                    border: `2px solid ${member.role_color}`
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
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                <img
                                                                    src={getRoleIconSrc(member.role_priority || 1)}
                                                                    alt=""
                                                                    style={{
                                                                        width: '1.4em',
                                                                        height: '1.5em',
                                                                        objectFit: 'contain',
                                                                        display: 'block',
                                                                        flexShrink: 0
                                                                    }}
                                                                />
                                                                <span style={{ lineHeight: 1 }}>
                                                                    {member.highest_role || 'Staff'}
                                                                 </span>
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
                                                            borderLeft: `3px solid ${member.role_color}40`
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
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && staff.length === 0 && (
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
                                No staff members available
                            </h3>
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
                
                input:focus {
                    outline: none;
                    border-color: var(--accent-blue) !important;
                }
            `}</style>
        </>
    );
};