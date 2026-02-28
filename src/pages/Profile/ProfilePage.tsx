import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    User, Calendar, Shield, MessageSquare, Award, Users, Edit,
    Clock, Heart, FileText, Gamepad2, Building2, UserPlus,
    UserCheck, Activity, BarChart3, Eye, TrendingUp, Mail
} from 'lucide-react';
import { apiClient } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export const ProfilePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();

    const [activeTab, setActiveTab] = useState('about');
    const [isFollowing, setIsFollowing] = useState(false);
    const [showAllRoles, setShowAllRoles] = useState(false);

    const { data: profileResponse, isLoading, error } = useQuery({
        queryKey: ['profile', id],
        queryFn: async () => {
            const response = await apiClient.get(`/users/${id}`);
            return response.data || response;
        },
        enabled: !!id,
    });

    const { data: threadsData } = useQuery({
        queryKey: ['user-threads', id],
        queryFn: async () => {
            const response = await apiClient.get(`/users/${id}/threads`);
            return response.data || [];
        },
        enabled: activeTab === 'activity',
    });

    const { data: followersData, isLoading: followersLoading } = useQuery({
        queryKey: ['user-followers', id],
        queryFn: async () => {
            try {
                const response = await apiClient.get(`/users/${id}/followers`);
                return {
                    success: response.success || false,
                    followers: response.followers || [],
                    count: response.count || 0,
                    total: response.total || 0
                };
            } catch (error) {
                return {
                    success: false,
                    followers: [],
                    count: 0,
                    total: 0
                };
            }
        },
        enabled: activeTab === 'followers',
    });

    const { data: followingData, isLoading: followingLoading } = useQuery({
        queryKey: ['user-following', id],
        queryFn: async () => {
            try {
                const response = await apiClient.get(`/users/${id}/following`);
                return {
                    success: response.success || false,
                    following: response.following || [],
                    count: response.count || 0,
                    total: response.total || 0
                };
            } catch (error) {
                return {
                    success: false,
                    following: [],
                    count: 0,
                    total: 0
                };
            }
        },
        enabled: activeTab === 'following',
    });

    const profile = profileResponse?.data || profileResponse?.user || profileResponse;
    const canEdit = currentUser?.id === id;

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Unknown';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return 'Unknown';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getMemberFor = () => {
        if (!profile?.join_date) return 'Recently';
        const days = Math.floor((Date.now() - new Date(profile.join_date).getTime()) / (1000 * 60 * 60 * 24));
        if (days >= 365) return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''}`;
        if (days >= 30) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''}`;
        return `${days} day${days > 1 ? 's' : ''}`;
    };

    const getRoleColor = (priority: number = 1) => {
        if (priority >= 1000) return '#FF0000';
        if (priority >= 990) return '#000080';
        if (priority >= 950) return '#FFA07A';
        if (priority >= 850) return '#FFFFFF';
        if (priority >= 800) return '#000000';
        if (priority >= 750) return '#D2691E';
        if (priority >= 700) return '#1E90FF';
        if (priority >= 650) return '#1E90FF';
        if (priority >= 600) return '#D2691E';
        if (priority >= 550) return '#32CD32';
        if (priority >= 500) return '#00FF00';
        if (priority >= 450) return '#8B008B';
        if (priority >= 440) return '#8B008B';
        if (priority >= 430) return '#8B008B';
        if (priority >= 411) return '#0000FF';
        if (priority >= 410) return '#00FFFF';
        if (priority >= 399) return '#00FFFF';
        if (priority >= 200) return '#000080';
        if (priority >= 100) return '#7FFFD4';

        return '#808080';
    };

    const handleFollow = async () => {
        try {
            if (isFollowing) {
                await apiClient.delete(`/users/${id}/follow`);
                toast.success('Unfollowed successfully');
                if (profile) {
                    profile.total_followers = Math.max(0, (profile.total_followers || 0) - 1);
                }
            } else {
                await apiClient.post(`/users/${id}/follow`);
                toast.success('Following successfully');
                if (profile) {
                    profile.total_followers = (profile.total_followers || 0) + 1;
                }
            }
            setIsFollowing(!isFollowing);
        } catch (error) {
            toast.error('Failed to update follow status');
        }
    };

    const handleAvatarSrc = (avatarUrl: string, username: string, roleColor: string = '#0ea5e9') => {
        if (!avatarUrl || avatarUrl.trim() === '') {
            const colorHex = roleColor.replace('#', '');
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&size=400&background=${colorHex || '0ea5e9'}&color=fff`;
        }

        if (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:')) {
            return avatarUrl;
        }

        if (avatarUrl.startsWith('/')) {
            return `https://api.washingtongaming.tech${avatarUrl}`;
        }

        const colorHex = roleColor.replace('#', '');
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&size=400&background=${colorHex || '0ea5e9'}&color=fff`;
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, username: string, roleColor: string = '#0ea5e9') => {
        const target = e.currentTarget;
        const colorHex = roleColor.replace('#', '');
        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&size=400&background=${colorHex || '0ea5e9'}&color=fff`;
        target.onerror = null;
    };

    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                paddingTop: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--background-primary)'
            }}>
                <div className="spinner" style={{ width: '64px', height: '64px' }}></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div style={{
                minHeight: '100vh',
                paddingTop: '110px',
                textAlign: 'center',
                padding: '3rem',
                background: 'var(--background-primary)'
            }}>
                <User size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.3 }} />
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>User not found</h2>
                <button onClick={() => navigate('/members')} className="btn-primary">
                    Browse Members
                </button>
            </div>
        );
    }

    const roleColor = getRoleColor(profile.role_priority);
    const memberFor = getMemberFor();

    return (
        <div className="profile-page-wrapper">
            <div className="container-custom">

                {/* Breadcrumb */}
                <nav className="profile-breadcrumb">
                    <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Home</Link>
                    <span>›</span>
                    <Link to="/members" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Members</Link>
                    <span>›</span>
                    <span style={{ color: 'white', fontWeight: '500' }}>{profile.username}</span>
                </nav>

                {/* Profile Header */}
                <div className="profile-header" style={{
                    background: `linear-gradient(135deg, ${roleColor}15 0%, var(--background-tertiary) 100%)`,
                    border: `2px solid ${roleColor}30`,
                }}>
                    {/* Decorative Background */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `radial-gradient(circle at 80% 20%, ${roleColor}08 0%, transparent 50%)`,
                        pointerEvents: 'none'
                    }}></div>

                    <div className="profile-header-content">

                        {/* Avatar */}
                        <div className="profile-avatar-wrapper">
                            <div className="profile-avatar" style={{
                                border: `4px solid ${roleColor}`,
                                boxShadow: `0 0 40px ${roleColor}60`
                            }}>
                                <img
                                    src={handleAvatarSrc(profile.avatar_url, profile.username, roleColor)}
                                    alt={profile.username}
                                    onError={(e) => handleImageError(e, profile.username, roleColor)}
                                />
                            </div>

                            {profile.is_online && (
                                <div className="profile-online-badge"></div>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="profile-info">
                            <div style={{ marginBottom: '1rem' }}>
                                <h1 className="profile-username">
                                    {profile.username}
                                </h1>

                                {profile.highest_role && (
                                    <div className="profile-role-badge" style={{
                                        background: `${roleColor}20`,
                                        border: `2px solid ${roleColor}`,
                                        color: roleColor,
                                    }}>
                                        {profile.highest_role}
                                    </div>
                                )}
                            </div>

                            {/* SA-MP Info */}
                            {(profile.samp_name || profile.samp_faction) && (
                                <div className="profile-samp-info">
                                    {profile.samp_name && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Gamepad2 size={18} style={{ color: roleColor }} />
                                            <span>{profile.samp_name}</span>
                                        </div>
                                    )}

                                    {profile.samp_faction && (
                                        <>
                                            <div className="profile-divider"></div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Building2 size={18} style={{ color: roleColor }} />
                                                <span>
                                                    {profile.samp_faction}
                                                    {profile.samp_rank && ` - ${profile.samp_rank}`}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Stats */}
                            <div className="profile-stats-grid">
                                {[
                                    { label: 'Posts', value: profile.total_posts || 0, color: '#0ea5e9' },
                                    { label: 'Likes', value: profile.total_likes || 0, color: '#ef4444' },
                                    { label: 'Followers', value: profile.total_followers || 0, color: '#10b981' },
                                    { label: 'Following', value: profile.total_following || 0, color: '#8b5cf6' }
                                ].map((stat, idx) => (
                                    <div key={idx} className="profile-stat-item">
                                        <div className="profile-stat-value" style={{ color: stat.color }}>
                                            {stat.value}
                                        </div>
                                        <div className="profile-stat-label">
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="profile-actions">
                                {!canEdit && (
                                    <button
                                        onClick={handleFollow}
                                        className="profile-action-btn"
                                        style={{
                                            background: isFollowing ? 'var(--background-tertiary)' : roleColor,
                                            border: isFollowing ? `1px solid ${roleColor}` : 'none',
                                        }}
                                    >
                                        {isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                )}

                                <button
                                    onClick={() => navigate(`/messages?new=${profile.id}`)}
                                    className="profile-action-btn profile-action-btn-secondary"
                                >
                                    <MessageSquare size={18} />
                                    Message
                                </button>

                                {canEdit && (
                                    <button
                                        onClick={() => navigate('/settings')}
                                        className="profile-action-btn"
                                        style={{ background: roleColor }}
                                    >
                                        <Edit size={18} />
                                        Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="profile-content-wrapper">

                    {/* Sidebar */}
                    <div className="profile-sidebar">

                        {/* About Card */}
                        <div className="card profile-card">
                            <h3 className="profile-card-title">
                                <User size={20} />
                                About
                            </h3>

                            <div className="profile-about-list">
                                <div className="profile-about-item">
                                    <Calendar size={16} style={{ color: roleColor }} />
                                    <div>
                                        <div className="profile-about-label">Joined</div>
                                        <div className="profile-about-value">
                                            {formatDate(profile.join_date)}
                                        </div>
                                    </div>
                                </div>

                                <div className="profile-about-item">
                                    <Clock size={16} style={{ color: roleColor }} />
                                    <div>
                                        <div className="profile-about-label">Last Seen</div>
                                        <div className="profile-about-value" style={{
                                            color: profile.is_online ? '#10b981' : 'white'
                                        }}>
                                            {profile.is_online ? 'Online Now' : formatDateTime(profile.last_seen)}
                                        </div>
                                    </div>
                                </div>

                                <div className="profile-about-item">
                                    <Award size={16} style={{ color: roleColor }} />
                                    <div>
                                        <div className="profile-about-label">Member For</div>
                                        <div className="profile-about-value">{memberFor}</div>
                                    </div>
                                </div>

                                {profile.discord_username && (
                                    <div className="profile-about-item">
                                        <MessageSquare size={16} style={{ color: roleColor }} />
                                        <div>
                                            <div className="profile-about-label">Discord</div>
                                            <div className="profile-about-value">
                                                {profile.discord_username}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats Card */}
                        <div className="card profile-card">
                            <h3 className="profile-card-title">
                                <BarChart3 size={20} />
                                Statistics
                            </h3>

                            <div className="profile-stats-list">
                                <div className="profile-stats-item">
                                    <span>Posts per Day</span>
                                    <span style={{ fontWeight: '600', color: roleColor }}>
                                        {profile.total_posts && profile.join_date
                                            ? (profile.total_posts / Math.max(Math.floor((Date.now() - new Date(profile.join_date).getTime()) / (1000 * 60 * 60 * 24)), 1)).toFixed(2)
                                            : '0.00'}
                                    </span>
                                </div>

                                <div className="profile-stats-item">
                                    <span>Likes per Post</span>
                                    <span style={{ fontWeight: '600', color: roleColor }}>
                                        {profile.total_posts > 0
                                            ? (profile.total_likes / profile.total_posts).toFixed(1)
                                            : '0.0'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Roles Card */}
                        {profile.discord_roles && profile.discord_roles.length > 0 && (
                            <div className="card profile-card">
                                <div className="profile-roles-header">
                                    <h3 className="profile-card-title">
                                        <Shield size={20} />
                                        Roles ({profile.discord_roles.length})
                                    </h3>

                                    {profile.discord_roles.length > 3 && (
                                        <button
                                            onClick={() => setShowAllRoles(!showAllRoles)}
                                            className="profile-show-more-btn"
                                            style={{ color: roleColor }}
                                        >
                                            {showAllRoles ? 'Show Less' : 'Show All'}
                                        </button>
                                    )}
                                </div>

                                <div className="profile-roles-list">
                                    {profile.discord_roles.map((role: any, idx: number) => (
                                        <div key={idx} className="profile-role-item" style={{
                                            background: `${role.color || roleColor}15`,
                                            border: `1px solid ${role.color || roleColor}30`,
                                        }}>
                                            <div style={{
                                                width: '10px', height: '10px', borderRadius: '50%',
                                                background: role.color || roleColor
                                            }} />
                                            <div className="profile-role-name" style={{ color: role.color || roleColor }}>
                                                {role.display_name || role.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className="profile-main-content">
                        {/* Tabs */}
                        <div className="profile-tabs">
                            {[
                                { id: 'about', label: 'About', icon: User },
                                { id: 'activity', label: 'Activity', icon: Activity },
                                { id: 'followers', label: `Followers (${profile.total_followers || 0})`, icon: Users },
                                { id: 'following', label: `Following (${profile.total_following || 0})`, icon: UserCheck }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`profile-tab ${activeTab === tab.id ? 'profile-tab-active' : ''}`}
                                    style={{
                                        borderBottomColor: activeTab === tab.id ? roleColor : 'transparent',
                                        color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                                    }}
                                >
                                    <tab.icon size={18} />
                                    <span className="profile-tab-label">{tab.label}</span>
                                    <span className="profile-tab-label-mobile">
                                        {tab.id === 'followers' ? profile.total_followers || 0 :
                                            tab.id === 'following' ? profile.total_following || 0 :
                                                tab.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'about' && (
                            <div className="card" style={{ padding: '2rem' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
                                    User Information
                                </h3>

                                <div className="profile-info-grid">
                                    <div>
                                        <div className="profile-info-label">Username</div>
                                        <div className="profile-info-value">{profile.username}</div>
                                    </div>

                                    <div>
                                        <div className="profile-info-label">Status</div>
                                        <div className="profile-info-value" style={{
                                            color: profile.is_online ? '#10b981' : 'var(--text-secondary)'
                                        }}>
                                            {profile.is_online ? 'Online' : 'Offline'}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="profile-info-label">Member Since</div>
                                        <div className="profile-info-value">{formatDate(profile.join_date)}</div>
                                    </div>

                                    <div>
                                        <div className="profile-info-label">Last Seen</div>
                                        <div className="profile-info-value">
                                            {profile.is_online ? 'Now' : formatDateTime(profile.last_seen)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div>
                                {threadsData && threadsData.length > 0 ? (
                                    <div className="profile-threads-list">
                                        {threadsData.map((thread: any) => (
                                            <Link
                                                key={thread.id}
                                                to={`/thread/${thread.slug || thread.id}`}
                                                className="card profile-thread-card"
                                            >
                                                <h3 className="profile-thread-title">{thread.title}</h3>
                                                <div className="profile-thread-meta">
                                                    <span>{formatDate(thread.created_at)}</span>
                                                    <span>{thread.reply_count || 0} replies</span>
                                                    <span>{thread.view_count || 0} views</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="card profile-empty-state">
                                        <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                        <p>No activity yet</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'followers' && (
                            <div>
                                {followersData?.success && followersData.followers && followersData.followers.length > 0 ? (
                                    <div className="profile-users-grid">
                                        {followersData.followers.map((follower: any) => (
                                            <Link
                                                key={follower.id}
                                                to={`/profile/${follower.id}`}
                                                className="profile-user-card"
                                            >
                                                <div className="profile-user-header">
                                                    <div className="profile-user-avatar-wrapper">
                                                        <img
                                                            src={handleAvatarSrc(follower.avatar_url, follower.username, follower.role_color)}
                                                            alt={follower.username}
                                                            className="profile-user-avatar"
                                                            style={{ border: `2px solid ${follower.role_color || roleColor}` }}
                                                            onError={(e) => handleImageError(e, follower.username, follower.role_color)}
                                                        />
                                                        {follower.is_online && (
                                                            <div className="profile-user-online"></div>
                                                        )}
                                                    </div>

                                                    <div className="profile-user-info">
                                                        <div className="profile-user-name">{follower.username}</div>
                                                        <div className="profile-user-role" style={{
                                                            color: follower.role_color || roleColor
                                                        }}>
                                                            {follower.highest_role || 'Member'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="profile-user-stats">
                                                    <div className="profile-user-stat">
                                                        <div className="profile-user-stat-value" style={{ color: '#0ea5e9' }}>
                                                            {follower.total_posts || 0}
                                                        </div>
                                                        <div className="profile-user-stat-label">Posts</div>
                                                    </div>
                                                    <div className="profile-user-stat">
                                                        <div className="profile-user-stat-value" style={{ color: '#10b981' }}>
                                                            {follower.total_followers || 0}
                                                        </div>
                                                        <div className="profile-user-stat-label">Followers</div>
                                                    </div>
                                                </div>

                                                <div className="profile-user-extra">
                                                    {follower.samp_name && (
                                                        <div className="profile-user-extra-item">
                                                            <Gamepad2 size={14} />
                                                            {follower.samp_name}
                                                        </div>
                                                    )}
                                                    {follower.samp_faction && (
                                                        <div className="profile-user-extra-item">
                                                            <Building2 size={14} />
                                                            {follower.samp_faction}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="profile-user-footer">
                                                    <div className="profile-user-timestamp">
                                                        Followed {follower.followed_ago}
                                                    </div>
                                                    {currentUser?.id !== follower.id && (
                                                        <button
                                                            onClick={async (e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                try {
                                                                    await apiClient.post(`/users/${follower.id}/follow`);
                                                                    toast.success(`Following ${follower.username}`);
                                                                } catch (error) {
                                                                    toast.error('Failed to follow');
                                                                }
                                                            }}
                                                            className="profile-user-follow-btn"
                                                        >
                                                            Follow Back
                                                        </button>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : followersLoading ? (
                                    <div className="card profile-empty-state">
                                        <div className="spinner" style={{
                                            width: '40px',
                                            height: '40px',
                                            borderColor: roleColor,
                                            borderTopColor: 'transparent'
                                        }}></div>
                                        <p>Loading followers...</p>
                                    </div>
                                ) : (
                                    <div className="card profile-empty-state">
                                        <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.3, color: roleColor }} />
                                        <h3>No Followers Yet</h3>
                                        <p>{profile.username} doesn't have any followers yet.</p>
                                        {currentUser?.id !== id && (
                                            <button
                                                onClick={handleFollow}
                                                className="btn-primary"
                                                style={{ background: roleColor, marginTop: '1rem' }}
                                            >
                                                <UserPlus size={16} style={{ marginRight: '0.5rem' }} />
                                                Be the First Follower
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'following' && (
                            <div>
                                {followingData?.success && followingData.following && followingData.following.length > 0 ? (
                                    <div className="profile-users-grid">
                                        {followingData.following.map((following: any) => (
                                            <Link
                                                key={following.id}
                                                to={`/profile/${following.id}`}
                                                className="profile-user-card"
                                            >
                                                <div className="profile-user-header">
                                                    <div className="profile-user-avatar-wrapper">
                                                        <img
                                                            src={handleAvatarSrc(following.avatar_url, following.username, following.role_color)}
                                                            alt={following.username}
                                                            className="profile-user-avatar"
                                                            style={{ border: `2px solid ${following.role_color || roleColor}` }}
                                                            onError={(e) => handleImageError(e, following.username, following.role_color)}
                                                        />
                                                        {following.is_online && (
                                                            <div className="profile-user-online"></div>
                                                        )}
                                                    </div>

                                                    <div className="profile-user-info">
                                                        <div className="profile-user-name">{following.username}</div>
                                                        <div className="profile-user-role" style={{
                                                            color: following.role_color || roleColor
                                                        }}>
                                                            {following.highest_role || 'Member'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="profile-user-stats">
                                                    <div className="profile-user-stat">
                                                        <div className="profile-user-stat-value" style={{ color: '#0ea5e9' }}>
                                                            {following.total_posts || 0}
                                                        </div>
                                                        <div className="profile-user-stat-label">Posts</div>
                                                    </div>
                                                    <div className="profile-user-stat">
                                                        <div className="profile-user-stat-value" style={{ color: '#10b981' }}>
                                                            {following.total_followers || 0}
                                                        </div>
                                                        <div className="profile-user-stat-label">Followers</div>
                                                    </div>
                                                </div>

                                                <div className="profile-user-extra">
                                                    {following.samp_name && (
                                                        <div className="profile-user-extra-item">
                                                            <Gamepad2 size={14} />
                                                            {following.samp_name}
                                                        </div>
                                                    )}
                                                    {following.samp_faction && (
                                                        <div className="profile-user-extra-item">
                                                            <Building2 size={14} />
                                                            {following.samp_faction}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="profile-user-footer">
                                                    <div className="profile-user-timestamp">
                                                        Following since {following.followed_ago || 'recently'}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : followingLoading ? (
                                    <div className="card profile-empty-state">
                                        <div className="spinner" style={{
                                            width: '40px',
                                            height: '40px',
                                            borderColor: roleColor,
                                            borderTopColor: 'transparent'
                                        }}></div>
                                        <p>Loading following...</p>
                                    </div>
                                ) : (
                                    <div className="card profile-empty-state">
                                        <UserCheck size={48} style={{ color: roleColor, opacity: 0.5, margin: '0 auto 1rem' }} />
                                        <h3>Not Following Anyone</h3>
                                        <p>{profile.username} is not following anyone yet.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 📱 MOBILE RESPONSIVE STYLES */}
            <style>{`
                /* ========== BASE STYLES (Desktop) ========== */
                .profile-page-wrapper {
                    min-height: 100vh;
                    background: var(--background-primary);
                    padding-top: 150px;
                    padding-bottom: 4rem;
                }

                .profile-breadcrumb {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 2rem;
                    fontSize: 0.875rem;
                    color: var(--text-secondary);
                }

                .profile-header {
                    border-radius: 16px;
                    padding: 2.5rem;
                    margin-bottom: 2rem;
                    position: relative;
                    overflow: hidden;
                }

                .profile-header-content {
                    display: flex;
                    align-items: flex-start;
                    gap: 2rem;
                    position: relative;
                    z-index: 1;
                }

                .profile-avatar-wrapper {
                    position: relative;
                    flex-shrink: 0;
                }

                .profile-avatar {
                    width: 160px;
                    height: 160px;
                    border-radius: 50%;
                    padding: 4px;
                    background: var(--background-primary);
                }

                .profile-avatar img {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .profile-online-badge {
                    position: absolute;
                    bottom: 12px;
                    right: 12px;
                    width: 24px;
                    height: 24px;
                    background: #10b981;
                    border-radius: 50%;
                    border: 4px solid var(--background-primary);
                    box-shadow: 0 0 20px #10b98180;
                }

                .profile-info {
                    flex: 1;
                }

                .profile-username {
                    font-size: 2.5rem;
                    font-weight: 800;
                    font-family: Orbitron, sans-serif;
                    color: white;
                    margin-bottom: 0.5rem;
                    line-height: 1.2;
                }

                .profile-role-badge {
                    display: inline-block;
                    padding: 0.5rem 1.25rem;
                    border-radius: 25px;
                    fontSize: 0.875rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .profile-samp-info {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    padding: 1rem 1.5rem;
                    background: rgba(0,0,0,0.2);
                    border-radius: 12px;
                    margin-bottom: 1.5rem;
                    font-size: 1rem;
                    color: white;
                    font-weight: 500;
                    flex-wrap: wrap;
                }

                .profile-divider {
                    width: 1px;
                    height: 20px;
                    background: var(--border-color);
                }

                .profile-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .profile-stat-item {
                    text-align: center;
                }

                .profile-stat-value {
                    font-size: 2rem;
                    font-weight: 800;
                    font-family: Orbitron, sans-serif;
                    line-height: 1;
                }

                .profile-stat-label {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    margin-top: 0.25rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .profile-actions {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }

                .profile-action-btn {
                    padding: 0.75rem 1.5rem;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    fontSize: 0.9375rem;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .profile-action-btn-secondary {
                    background: var(--background-tertiary);
                    border: 1px solid var(--border-color);
                }

                .profile-content-wrapper {
                    display: grid;
                    grid-template-columns: 320px 1fr;
                    gap: 2rem;
                }

                .profile-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .profile-card {
                    padding: 1.5rem;
                }

                .profile-card-title {
                    font-size: 1.125rem;
                    font-weight: 700;
                    margin-bottom: 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .profile-about-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .profile-about-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .profile-about-label {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }

                .profile-about-value {
                    font-size: 0.9375rem;
                    font-weight: 500;
                }

                .profile-stats-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .profile-stats-item {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }

                .profile-roles-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1.25rem;
                }

                .profile-show-more-btn {
                    background: none;
                    border: none;
                    font-size: 0.8125rem;
                    cursor: pointer;
                    font-weight: 600;
                }

                .profile-roles-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .profile-role-item {
                    padding: 0.75rem;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .profile-role-name {
                    font-size: 0.875rem;
                    font-weight: 600;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    flex: 1;
                }

                .profile-tabs {
                    display: flex;
                    border-bottom: 2px solid var(--border-color);
                    margin-bottom: 2rem;
                    gap: 0.5rem;
                }

                .profile-tab {
                    padding: 1rem 1.5rem;
                    background: none;
                    border: none;
                    border-bottom: 3px solid transparent;
                    cursor: pointer;
                    font-size: 0.9375rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: -2px;
                    transition: all 0.2s;
                    font-weight: 500;
                }

                .profile-tab-active {
                    font-weight: 600;
                }

                .profile-tab-label-mobile {
                    display: none;
                }

                .profile-info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 2rem;
                }

                .profile-info-label {
                    font-size: 0.8125rem;
                    color: var(--text-secondary);
                    margin-bottom: 0.375rem;
                }

                .profile-info-value {
                    font-size: 1rem;
                    font-weight: 600;
                }

                .profile-threads-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .profile-thread-card {
                    padding: 1.5rem;
                    text-decoration: none;
                    transition: all 0.2s;
                }

                .profile-thread-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin-bottom: 0.75rem;
                    color: white;
                }

                .profile-thread-meta {
                    display: flex;
                    gap: 1.5rem;
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }

                .profile-empty-state {
                    padding: 4rem;
                    text-align: center;
                }

                .profile-empty-state h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: white;
                }

                .profile-empty-state p {
                    color: var(--text-secondary);
                    max-width: 400px;
                    margin: 0 auto;
                }

                .profile-users-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.5rem;
                }

                .profile-user-card {
                    padding: 1.5rem;
                    background: var(--background-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    transition: all 0.3s;
                    text-decoration: none;
                    display: block;
                }

                .profile-user-card:hover {
                    background: var(--background-tertiary);
                    transform: translateY(-2px);
                }

                .profile-user-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .profile-user-avatar-wrapper {
                    position: relative;
                    flex-shrink: 0;
                }

                .profile-user-avatar {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .profile-user-online {
                    position: absolute;
                    bottom: 4px;
                    right: 4px;
                    width: 12px;
                    height: 12px;
                    background: #10b981;
                    border-radius: 50%;
                    border: 2px solid var(--background-secondary);
                }

                .profile-user-info {
                    flex: 1;
                }

                .profile-user-name {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: white;
                    margin-bottom: 0.25rem;
                }

                .profile-user-role {
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .profile-user-stats {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.75rem 0;
                    border-top: 1px solid var(--border-color);
                    border-bottom: 1px solid var(--border-color);
                }

                .profile-user-stat {
                    text-align: center;
                    flex: 1;
                }

                .profile-user-stat-value {
                    font-size: 1.25rem;
                    font-weight: 700;
                }

                .profile-user-stat-label {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }

                .profile-user-extra {
                    margin-top: 0.75rem;
                }

                .profile-user-extra-item {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.25rem;
                }

                .profile-user-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 0.75rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid var(--border-color);
                }

                .profile-user-timestamp {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }

                .profile-user-follow-btn {
                    padding: 0.375rem 0.75rem;
                    background: var(--background-tertiary);
                    color: white;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    font-size: 0.75rem;
                    cursor: pointer;
                    font-weight: 500;
                }

                .spinner {
                    border: 3px solid transparent;
                    border-top: 3px solid currentColor;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* ========== 📱 MOBILE RESPONSIVE ========== */
                @media (max-width: 768px) {
                    .profile-page-wrapper {
                        padding-top: 120px;
                        padding-bottom: 2rem;
                    }

                    .profile-breadcrumb {
                        font-size: 0.75rem;
                        margin-bottom: 1rem;
                    }

                    .profile-header {
                        padding: 1.5rem;
                        margin-bottom: 1.5rem;
                    }

                    .profile-header-content {
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                        gap: 1.5rem;
                    }

                    .profile-avatar {
                        width: 120px;
                        height: 120px;
                    }

                    .profile-online-badge {
                        width: 18px;
                        height: 18px;
                        bottom: 8px;
                        right: 8px;
                        border-width: 3px;
                    }

                    .profile-info {
                        width: 100%;
                    }

                    .profile-username {
                        font-size: 1.75rem;
                    }

                    .profile-role-badge {
                        font-size: 0.75rem;
                        padding: 0.375rem 1rem;
                    }

                    .profile-samp-info {
                        flex-direction: column;
                        gap: 0.75rem;
                        padding: 1rem;
                        font-size: 0.875rem;
                    }

                    .profile-divider {
                        display: none;
                    }

                    .profile-stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 1rem;
                        margin-bottom: 1rem;
                    }

                    .profile-stat-value {
                        font-size: 1.5rem;
                    }

                    .profile-stat-label {
                        font-size: 0.7rem;
                    }

                    .profile-actions {
                        width: 100%;
                        flex-direction: column;
                    }

                    .profile-action-btn {
                        width: 100%;
                        justify-content: center;
                        padding: 0.875rem 1rem;
                    }

                    .profile-content-wrapper {
                        grid-template-columns: 1fr;
                        gap: 1.5rem;
                    }

                    .profile-sidebar {
                        gap: 1rem;
                    }

                    .profile-card {
                        padding: 1.25rem;
                    }

                    .profile-card-title {
                        font-size: 1rem;
                        margin-bottom: 1rem;
                    }

                    .profile-tabs {
                        gap: 0;
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                    }

                    .profile-tab {
                        padding: 0.875rem 0.75rem;
                        font-size: 0.8125rem;
                        flex-shrink: 0;
                        white-space: nowrap;
                    }

                    .profile-tab-label {
                        display: none;
                    }

                    .profile-tab-label-mobile {
                        display: inline;
                    }

                    .profile-info-grid {
                        grid-template-columns: 1fr;
                        gap: 1.5rem;
                    }

                    .profile-thread-card {
                        padding: 1.25rem;
                    }

                    .profile-thread-title {
                        font-size: 1rem;
                    }

                    .profile-thread-meta {
                        flex-wrap: wrap;
                        gap: 1rem;
                        font-size: 0.8125rem;
                    }

                    .profile-users-grid {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }

                    .profile-user-card {
                        padding: 1.25rem;
                    }

                    .profile-empty-state {
                        padding: 3rem 1.5rem;
                    }

                    .profile-empty-state h3 {
                        font-size: 1.125rem;
                    }

                    .profile-empty-state p {
                        font-size: 0.875rem;
                    }
                }

                /* ========== 📱 SMALL MOBILE (< 480px) ========== */
                @media (max-width: 480px) {
                    .profile-page-wrapper {
                        padding-top: 110px;
                    }

                    .profile-header {
                        padding: 1rem;
                    }

                    .profile-avatar {
                        width: 100px;
                        height: 100px;
                    }

                    .profile-username {
                        font-size: 1.5rem;
                    }

                    .profile-stats-grid {
                        gap: 0.75rem;
                    }

                    .profile-stat-value {
                        font-size: 1.25rem;
                    }

                    .profile-stat-label {
                        font-size: 0.65rem;
                    }

                    .profile-card {
                        padding: 1rem;
                    }

                    .profile-tab {
                        padding: 0.75rem 0.5rem;
                        font-size: 0.75rem;
                    }

                    .profile-user-card {
                        padding: 1rem;
                    }

                    .profile-user-avatar {
                        width: 50px;
                        height: 50px;
                    }

                    .profile-user-name {
                        font-size: 1rem;
                    }

                    .profile-user-stat-value {
                        font-size: 1.125rem;
                    }
                }
            `}</style>
        </div>
    );
};