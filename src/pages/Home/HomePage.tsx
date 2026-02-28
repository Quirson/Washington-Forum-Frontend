import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, TrendingUp, Clock, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import './HomePage.css';

interface Category {
    id: string;
    name: string;
    description: string;
    slug: string;
    icon: string;
    color: string;
    thread_count: number;
    reply_count: number;
    last_thread?: {
        id: string;
        title: string;
        created_at: string;
        author: {
            username: string;
            avatar?: string;
        };
    };
}

interface Thread {
    id: string;
    title: string;
    slug: string;
    content: string;
    view_count: number;
    reply_count: number;
    like_count: number;
    created_at: string;
    author: {
        id: string;
        username: string;
        avatar?: string;
        highest_role?: string;
    };
    category: {
        name: string;
        slug: string;
    };
}

interface ForumStats {
    total_threads: number;
    total_replies: number;
    total_users: number;
    online_users: number;
}

export const HomePage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const { user, isAuthenticated, setUser, logout } = useAuthStore();

    // Fetch categories
    const { data: categoriesData, isLoading: loadingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await apiClient.get('/forum/categories');
            return response;
        },
    });

    // Fetch forum stats
    const { data: statsData } = useQuery({
        queryKey: ['forum-stats'],
        queryFn: async () => {
            const response = await apiClient.get('/forum/stats');
            return response;
        },
    });

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

    const categories: Category[] = categoriesData?.categories || [];
    const stats: ForumStats = statsData?.data || {
        total_threads: 10,
        total_replies: 43,
        total_users: totalMembers,
        online_users: onlineCount,
    };

    return (
        <div className="home-page">
            {/* SOCIAL LINKS SECTION */}
            <div className="social-links-section">
                <div className="container-custom">
                    <div className="social-links-grid">
                        {/* YouTube */}
                        <a
                            href="https://youtube.com/@washingtonrp-h8q?si=a-tZXVSF8V7Yc2mu"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="social-link social-link-youtube"
                        >
                            <div className="social-icon social-icon-youtube">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="#FF0000">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                            </div>
                            <div className="social-info">
                                <div className="social-label">YOUTUBE</div>
                                <div className="social-value">@washingtonrp</div>
                            </div>
                        </a>

                        {/* Discord Server */}
                        <a
                            href="https://discord.gg/washington"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="social-link social-link-discord"
                        >
                            <div className="social-icon social-icon-discord">
                                <svg width="28" height="28" viewBox="0 0 71 55" fill="#5865F2">
                                    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z" />
                                </svg>
                            </div>
                            <div className="social-info">
                                <div className="social-label">DISCORD</div>
                                <div className="social-value">Join Community</div>
                            </div>
                        </a>

                        {/* UCP Panel */}
                        <a
                            href="https://panel.washingtongaming.tech"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="social-link social-link-ucp"
                        >
                            <div className="social-icon social-icon-ucp">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2.5">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <line x1="9" y1="3" x2="9" y2="21" />
                                    <line x1="3" y1="9" x2="21" y2="9" />
                                </svg>
                            </div>
                            <div className="social-info">
                                <div className="social-label">SA-MP PANEL</div>
                                <div className="social-value">Control Panel</div>
                            </div>
                        </a>

                        {/* Government Discord */}
                        <a
                            href="https://discord.gg/dFjnAdun8y"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="social-link social-link-gov"
                        >
                            <div className="social-icon social-icon-gov">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                            </div>
                            <div className="social-info">
                                <div className="social-label">GOVERNMENT</div>
                                <div className="social-value">Discord Server</div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="quick-actions-bar">
                <div className="container-custom quick-actions-container">
                    <div className="breadcrumb">
                        <Link to="/" className="breadcrumb-active">Home</Link>
                    </div>
                    <div className="quick-actions-btns">
                        <Link to="/posts" className="btn-ghost quick-action-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MessageSquare size={16} />
                            Posts
                        </Link>
                        {isAuthenticated && (
                            <Link to="/messages" className="btn-ghost quick-action-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MessageSquare size={16} />
                                Messages
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="container-custom home-content">
                <div className="home-layout">
                    {/* Main Content */}
                    <div className="home-main">
                        {/* Forum Categories */}
                        <div className="categories-section">
                            <div className="section-header">
                                <h2 className="section-title">Forum Categories</h2>
                                <Link to="/posts" className="btn-primary">
                                    Create Post
                                </Link>
                            </div>

                            {loadingCategories ? (
                                <div className="loading-container">
                                    <div className="spinner"></div>
                                </div>
                            ) : (
                                <div className="categories-list">
                                    {categories.map((category) => (
                                        <Link
                                            key={category.id}
                                            to={
                                                category.slug === 'news' ? '/news'
                                                    : category.slug === 'updates' ? '/updates'
                                                        : category.slug === 'content' ? '/community'
                                                            : `/category/${category.slug}`
                                            }
                                            className="category-card"
                                            style={{
                                                '--category-color': category.color
                                            } as React.CSSProperties}
                                        >
                                            {/* Icon */}
                                            <div className="category-icon" style={{
                                                background: `${category.color}15`,
                                                border: `2px solid ${category.color}30`
                                            }}>
                                                {category.icon}
                                            </div>

                                            {/* Info */}
                                            <div className="category-info">
                                                <h3 className="category-name">{category.name}</h3>
                                                <p className="category-description">{category.description}</p>
                                            </div>

                                            {/* Stats */}
                                            <div className="category-stats">
                                                <div className="category-count" style={{ color: category.color }}>
                                                    {category.thread_count || 0}
                                                </div>
                                                <div className="category-label">
                                                    {category.thread_count === 1 ? 'thread' : 'threads'}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="home-sidebar">
                        {/* Forum Stats */}
                        <div className="card sidebar-card">
                            <h3 className="sidebar-title">Forum Statistics</h3>
                            <div className="stats-list">
                                {[
                                    { label: 'Total Threads', value: stats.total_threads, color: '#0ea5e9' },
                                    { label: 'Total Replies', value: stats.total_replies, color: '#10b981' },
                                    { label: 'Total Members', value: stats.total_users, color: '#f59e0b' },
                                    { label: 'Online Now', value: stats.online_users, color: '#ef4444' }
                                ].map((stat, idx) => (
                                    <div key={idx} className="stat-item">
                                        <span className="stat-label">{stat.label}</span>
                                        <span className="stat-value" style={{ color: stat.color }}>
                                            {stat.value?.toLocaleString() || 0}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="card sidebar-card">
                            <h3 className="sidebar-title">Quick Links</h3>
                            <div className="quick-links-list">
                                {[
                                    { label: 'Main Page', path: 'https://washigton-rp.webflow.io/' },
                                    { label: 'Staff Team', path: '/staff' },
                                    { label: 'Factions', path: '/factions' }
                                ].map((link, idx) => (
                                    <Link key={idx} to={link.path} className="quick-link-item">
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};