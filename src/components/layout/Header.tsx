import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import './Header.css';

export const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { user, token, isAuthenticated, isLoading, setUser, logout } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);


    // Substituir o useEffect que carrega o user:

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) return;

        const needsFetch =
            !user ||
            user.avatar_url === "__FETCH_FROM_API__" ||
            user.role_priority == null ||
            user.highest_role == null;

        if (!needsFetch) return;

        (async () => {
            try {
                const res = await authService.getCurrentUser();
                const u = (res.user || res.data) as any;

                // ✅ atualizar store com dados reais (role + avatar base64)
                setUser(u);
            } catch (e) {
                // se der 401, teu auth.service já limpa token/user
                console.warn("Failed to refresh /auth/me", e);
            }
        })();
    }, [isLoading, isAuthenticated, user?.avatar_url, user?.role_priority, user?.highest_role, setUser]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getAvatarUrl = () => {
        const v = user?.avatar_url;

        // ✅ base64 OK
        if (typeof v === "string" && v.startsWith("data:")) return v;

        // ✅ se for URL real
        if (typeof v === "string" && v && v !== "__FETCH_FROM_API__") return v;

        // ✅ fallback
        const name = encodeURIComponent(user?.username || "User");
        return `https://ui-avatars.com/api/?name=${name}&background=ff0000&color=fff`;
    };


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


    const navigationLinks = [
        { label: 'Home', path: '/' },
        { label: 'Staff', path: '/staff' },
        { label: 'Members', path: '/members' },
        { label: 'Activity', path: '/activity' },
        { label: 'Factions', path: '/factions' },
        { label: 'Applications', path: '/applications' },

    ];
    if (user?.role_priority && user.role_priority >= 850) {
        navigationLinks.push({ label: "Management", path: "/admin" });
    }

    return (
        <header className={`header-fixed ${scrolled ? 'header-scrolled' : ''}`}>
            {/* Banner Hero Section */}
            <div className="header-banner">
                <img
                    src="/banner.png"
                    alt="Washington Gaming"
                    className="header-banner-img"
                />
                <div className="header-banner-overlay"></div>

                {/* Banner Content */}
                <div className="header-banner-content">
                    <div className="container-custom">
                        <div className="header-banner-wrapper">
                            {/* Left: Logo + Title */}
                            <div className="header-logo-section">
                                <img
                                    src="/logo.png"s
                                    alt="Washington Gaming"
                                    className="header-logo-img"
                                />
                                <div className="header-title-wrapper">
                                    <h1 className="header-title" >WASHINGTON GAMING</h1>
                                    <p className="header-subtitle">SA-MP Roleplay Community Forum</p>
                                </div>
                            </div>

                            {/* Right: User Profile (Desktop only) */}
                            {isAuthenticated && user && (
                                <div className="header-user-card" style={{
                                    border: `2px solid ${getRoleColor(user.role_priority || 1)}40`
                                }}>
                                    <Link to={`/profile/${user.id}`} className="header-user-link">
                                        <img
                                            src={getAvatarUrl()}
                                            alt={user.username}
                                            className="header-user-avatar"
                                            style={{
                                                border: `3px solid ${getRoleColor(user.role_priority || 1)}`,
                                                boxShadow: `0 0 20px ${getRoleColor(user.role_priority || 1)}40`
                                            }}
                                            onError={(e) => {
                                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${user.username}&background=${getRoleColor(user.role_priority || 1).replace('#', '')}&color=fff`;
                                            }}
                                        />
                                        <div className="header-user-info">
                                            <div className="header-user-name">{user.username}</div>
                                            <div className="header-user-role" style={{
                                                color: getRoleColor(user.role_priority || 1),
                                                fontFamily: 'Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif'
                                            }}>
                                                {user.highest_role || 'Member'}
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Bar */}
            <nav className="nav-bar">
                <div className="container-custom">
                    <div className="nav-container">
                        {/* Left Section */}
                        <div className="nav-left">
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="nav-mobile-btn"
                            >
                                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>

                            {/* Desktop Navigation */}
                            <div className="nav-desktop">
                                {navigationLinks.map((link) => (
                                    <Link key={link.path} to={link.path} className="nav-link">
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Right Section */}
                        <div className="nav-right">
                            {/* Desktop Search */}
                            <div className="nav-search-desktop">
                                <input
                                    type="search"
                                    placeholder="Search forum..."
                                    className="nav-search-input"
                                />
                                <button className="nav-search-btn">
                                    <Search size={18} />
                                </button>
                            </div>

                            {/* Mobile Search Toggle */}
                            <button
                                onClick={() => setShowSearch(!showSearch)}
                                className="nav-search-toggle"
                            >
                                <Search size={18} />
                            </button>

                            {isAuthenticated ? (
                                <>
                                    {/* Notifications */}
                                    <button className="nav-icon-btn">
                                        <Bell size={18} />
                                        <span className="nav-notification-dot"></span>
                                    </button>

                                    {/* Create Button */}
                                    <button
                                        onClick={() => navigate('/applications')}
                                        className="nav-create-btn"
                                    >
                                        <span className="nav-create-text">Create</span>
                                        <span className="nav-create-icon">+</span>
                                    </button>

                                    {/* User Menu */}
                                    <div className="nav-user-menu">
                                        <button
                                            onClick={() => setShowUserMenu(!showUserMenu)}
                                            className="nav-user-btn"
                                        >
                                            <img
                                                src={getAvatarUrl()}
                                                alt={user?.username}
                                                className="nav-user-avatar"
                                            />
                                            <span className="nav-user-name">{user?.username}</span>
                                            <ChevronDown size={16} className="nav-user-chevron" />
                                        </button>

                                        {/* Dropdown */}
                                        {showUserMenu && (
                                            <div className="nav-dropdown">
                                                <Link
                                                    to={`/profile/${user?.id}`}
                                                    onClick={() => setShowUserMenu(false)}
                                                    className="nav-dropdown-item"
                                                >
                                                    <User size={16} />
                                                    My Profile
                                                </Link>
                                                <Link
                                                    to="/settings"
                                                    onClick={() => setShowUserMenu(false)}
                                                    className="nav-dropdown-item"
                                                >
                                                    <Settings size={16} />
                                                    Settings
                                                </Link>
                                                {user?.role_priority && user.role_priority >= 300 && (
                                                    <Link
                                                        to="/admin"
                                                        onClick={() => setShowUserMenu(false)}
                                                        className="nav-dropdown-item nav-dropdown-border"
                                                    >
                                                        <Settings size={16} />
                                                        Admin Panel
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setShowUserMenu(false);
                                                        handleLogout();
                                                    }}
                                                    className="nav-dropdown-item nav-dropdown-logout nav-dropdown-border"
                                                >
                                                    <LogOut size={16} />
                                                    Logout
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="nav-auth-btns">
                                    <Link to="/login" className="btn-ghost nav-auth-btn">Login</Link>
                                    <Link to="/register" className="btn-primary nav-auth-btn">Register</Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Search Bar */}
                    {showSearch && (
                        <div className="nav-search-mobile">
                            <input
                                type="search"
                                placeholder="Search forum..."
                                className="nav-search-input"
                            />
                            <button className="nav-search-btn">
                                <Search size={18} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="mobile-menu">
                        <div className="container-custom mobile-menu-content">
                            {/* Mobile User Card */}
                            {isAuthenticated && user && (
                                <div className="mobile-user-card" style={{
                                    borderColor: `${getRoleColor(user.role_priority || 1)}40`
                                }}>
                                    <Link
                                        to={`/profile/${user.id}`}
                                        className="mobile-user-link"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <img
                                            src={getAvatarUrl()}
                                            alt={user.username}
                                            className="mobile-user-avatar"
                                            style={{
                                                borderColor: getRoleColor(user.role_priority || 1),
                                                boxShadow: `0 0 15px ${getRoleColor(user.role_priority || 1)}40`
                                            }}
                                            onError={(e) => {
                                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${user.username}&background=${getRoleColor(user.role_priority || 1).replace('#', '')}&color=fff`;
                                            }}
                                        />
                                        <div>
                                            <div className="mobile-user-name">{user.username}</div>
                                            <div className="mobile-user-role" style={{
                                                color: getRoleColor(user.role_priority || 1)
                                            }}>
                                                {user.roles?.[0] || 'Member'}
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            )}

                            {/* Create Thread Button (Mobile) */}
                            {isAuthenticated && (
                                <button
                                    onClick={() => {
                                        navigate('/posts');
                                        setIsMenuOpen(false);
                                    }}
                                    className="mobile-create-btn"
                                >
                                    Create Thread
                                </button>
                            )}

                            {/* Navigation Links */}
                            {navigationLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className="mobile-nav-link"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
};