import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Save, User, Mail, Gamepad2, Building2, Shield,
    MapPin, FileText, Globe, Lock, Upload, Loader2,
    CheckCircle, XCircle
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

const profileSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(50),
    email: z.string().email('Invalid email address'),
    avatar_url: z.string().url('Invalid URL').optional().or(z.literal('')),
    discord_username: z.string().max(100, 'Discord username too long').optional().or(z.literal('')),
    samp_name: z.string().max(50, 'SA-MP name too long').optional().or(z.literal('')),
    samp_faction: z.string().max(50, 'Faction name too long').optional().or(z.literal('')),
    samp_rank: z.string().max(50, 'Rank too long').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
    current_password: z.string().min(6, 'Current password is required'),
    new_password: z.string().min(6, 'New password must be at least 6 characters'),
    confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export const SettingsPage = () => {
    const navigate = useNavigate();
    const { user, setUser } = useAuthStore();

    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewAvatar, setPreviewAvatar] = useState('');

    const {
        register: registerProfile,
        handleSubmit: handleProfileSubmit,
        formState: { errors: profileErrors },
        reset: resetProfile,
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            username: user?.username || '',
            email: user?.email || '',
            avatar_url: user?.avatar_url || '',
            discord_username: user?.discord_username || '',
            samp_name: user?.samp_name || '',
            samp_faction: user?.samp_faction || '',
            samp_rank: user?.samp_rank || '',
        },
    });

    const {
        register: registerPassword,
        handleSubmit: handlePasswordSubmit,
        formState: { errors: passwordErrors },
        reset: resetPassword,
    } = useForm<PasswordFormData>();

    useEffect(() => {
        if (user) {
            resetProfile({
                username: user.username,
                email: user.email,
                avatar_url: user.avatar_url || '',
                discord_username: user.discord_username || '',
                samp_name: user.samp_name || '',
                samp_faction: user.samp_faction || '',
                samp_rank: user.samp_rank || '',
            });
            setPreviewAvatar(user.avatar_url || '');
        }
    }, [user, resetProfile]);

    const handleProfileUpdate = async (data: ProfileFormData) => {
        try {
            setIsLoading(true);

            if (previewAvatar && previewAvatar !== user?.avatar_url && previewAvatar.startsWith('data:')) {
                console.log('📤 Uploading new avatar...');
                const uploadResponse = await authService.uploadAvatar(previewAvatar);

                if (uploadResponse.success && uploadResponse.data) {
                    data.avatar_url = uploadResponse.data.data_url || uploadResponse.data.url;
                    console.log('✅ Avatar uploaded, URL length:', data.avatar_url?.length);
                }
            }

            console.log('📝 Updating profile...');
            const response = await authService.updateProfile(data);

            if (response.success && response.data) {
                console.log('✅ Profile updated successfully');
                setUser(response.data);

                if (response.data.avatar_url) {
                    setPreviewAvatar(response.data.avatar_url);
                }

                toast.success('Profile updated successfully!');
            } else {
                toast.error(response.error || 'Failed to update profile');
            }
        } catch (error: any) {
            console.error('💥 Update error:', error);
            toast.error(error.response?.data?.error || 'Update failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async (data: PasswordFormData) => {
        try {
            setIsLoading(true);

            const response = await authService.changePassword(
                data.current_password,
                data.new_password
            );

            if (response.success) {
                resetPassword();
                toast.success('Password changed successfully!');
            } else {
                toast.error(response.error || 'Failed to change password');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Password change failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        console.log(`📁 File selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

        setIsUploading(true);

        try {
            const base64 = await fileToBase64(file);
            console.log(`📏 Base64 length: ${base64.length} characters`);

            setPreviewAvatar(base64);

            console.log('📤 Uploading to backend...');
            const uploadResponse = await authService.uploadAvatar(base64);
            console.log('📥 Upload response:', uploadResponse);

            if (!uploadResponse.success) {
                throw new Error('Upload failed');
            }

            const avatarUrl = uploadResponse.data?.data_url || uploadResponse.data?.url;

            console.log('🔄 Updating profile with avatar...');
            const updateResponse = await authService.updateProfile({
                avatar_url: avatarUrl
            });

            console.log('📥 Update response:', updateResponse);

            if (updateResponse.success && updateResponse.data) {
                setUser(updateResponse.data);
                toast.success('Avatar uploaded! 🚀');
            } else {
                throw new Error('Failed to update profile');
            }
        } catch (error: any) {
            console.error('💥 Upload error:', error);
            console.error('📊 Status:', error.response?.status);
            console.error('📝 Data:', error.response?.data);
            toast.error(error.response?.data?.error || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'password', label: 'Password', icon: Lock },
        { id: 'connections', label: 'Connections', icon: Globe },
        { id: 'privacy', label: 'Privacy', icon: Shield },
    ];

    if (!user) {
        navigate('/login');
        return null;
    }

    return (
        <div className="settings-page-wrapper">
            <div className="container-custom">
                {/* Header */}
                <div className="settings-header">
                    <h1 className="settings-title">
                        Account Settings
                    </h1>
                    <p className="settings-subtitle">
                        Manage your profile, security, and preferences
                    </p>
                </div>

                <div className="settings-container">
                    {/* Sidebar */}
                    <div className="settings-sidebar">
                        {/* User Info */}
                        <div className="settings-user-info">
                            <div className="settings-avatar">
                                <img
                                    src={previewAvatar || user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&size=400&background=0ea5e9&color=fff`}
                                    alt={user.username}
                                />
                            </div>
                            <h3 className="settings-username">{user.username}</h3>
                            <div className="settings-user-role">
                                {user.highest_role || 'Member'}
                            </div>
                        </div>

                        {/* Tabs */}
                        <nav className="settings-tabs-nav">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`settings-tab-btn ${activeTab === tab.id ? 'settings-tab-active' : ''}`}
                                >
                                    <tab.icon size={18} />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="settings-content">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <form onSubmit={handleProfileSubmit(handleProfileUpdate)}>
                                <h2 className="settings-content-title">Profile Information</h2>

                                {/* Avatar Upload */}
                                <div className="settings-avatar-section">
                                    <label className="settings-label">Profile Picture</label>
                                    <div className="settings-avatar-upload">
                                        <div className="settings-avatar-preview">
                                            <img
                                                src={previewAvatar || user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&size=400&background=0ea5e9&color=fff`}
                                                alt="Preview"
                                            />
                                        </div>
                                        <div>
                                            <label className="settings-upload-btn">
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 size={16} className="spin-icon" />
                                                        <span>Uploading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload size={16} />
                                                        <span>Upload New</span>
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleAvatarUpload}
                                                    style={{ display: 'none' }}
                                                    disabled={isUploading}
                                                />
                                            </label>
                                            <p className="settings-upload-hint">
                                                JPG, PNG or GIF. Max 5MB.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Grid */}
                                <div className="settings-form-grid">
                                    {/* Username */}
                                    <div className="settings-form-group">
                                        <label className="settings-form-label">
                                            <User size={14} />
                                            Username
                                        </label>
                                        <input
                                            {...registerProfile('username')}
                                            type="text"
                                            className={`settings-input ${profileErrors.username ? 'settings-input-error' : ''}`}
                                        />
                                        {profileErrors.username && (
                                            <p className="settings-error-text">
                                                {profileErrors.username.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="settings-form-group">
                                        <label className="settings-form-label">
                                            <Mail size={14} />
                                            Email
                                        </label>
                                        <input
                                            {...registerProfile('email')}
                                            type="email"
                                            className={`settings-input ${profileErrors.email ? 'settings-input-error' : ''}`}
                                        />
                                        {profileErrors.email && (
                                            <p className="settings-error-text">
                                                {profileErrors.email.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* SA-MP Name */}
                                    <div className="settings-form-group">
                                        <label className="settings-form-label">
                                            <Gamepad2 size={14} />
                                            SA-MP Name
                                        </label>
                                        <input
                                            {...registerProfile('samp_name')}
                                            type="text"
                                            placeholder="Your in-game name"
                                            className="settings-input"
                                        />
                                    </div>

                                    {/* Faction */}
                                    <div className="settings-form-group">
                                        <label className="settings-form-label">
                                            <Building2 size={14} />
                                            Faction
                                        </label>
                                        <input
                                            {...registerProfile('samp_faction')}
                                            type="text"
                                            placeholder="Your faction"
                                            className="settings-input"
                                        />
                                    </div>

                                    {/* Rank */}
                                    <div className="settings-form-group">
                                        <label className="settings-form-label">Rank</label>
                                        <input
                                            {...registerProfile('samp_rank')}
                                            type="text"
                                            placeholder="Your rank"
                                            className="settings-input"
                                        />
                                    </div>

                                    {/* Discord */}
                                    <div className="settings-form-group">
                                        <label className="settings-form-label">Discord Username</label>
                                        <input
                                            {...registerProfile('discord_username')}
                                            type="text"
                                            placeholder="username#0000"
                                            className="settings-input"
                                        />
                                    </div>
                                </div>

                                {/* Save Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="settings-save-btn"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={20} className="spin-icon" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Password Tab */}
                        {activeTab === 'password' && (
                            <form onSubmit={handlePasswordSubmit(handlePasswordChange)}>
                                <h2 className="settings-content-title">Change Password</h2>

                                <div className="settings-password-form">
                                    {/* Current Password */}
                                    <div className="settings-form-group">
                                        <label className="settings-form-label">Current Password</label>
                                        <input
                                            {...registerPassword('current_password')}
                                            type="password"
                                            className={`settings-input ${passwordErrors.current_password ? 'settings-input-error' : ''}`}
                                        />
                                        {passwordErrors.current_password && (
                                            <p className="settings-error-text">
                                                {passwordErrors.current_password.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* New Password */}
                                    <div className="settings-form-group">
                                        <label className="settings-form-label">New Password</label>
                                        <input
                                            {...registerPassword('new_password')}
                                            type="password"
                                            className={`settings-input ${passwordErrors.new_password ? 'settings-input-error' : ''}`}
                                        />
                                        {passwordErrors.new_password && (
                                            <p className="settings-error-text">
                                                {passwordErrors.new_password.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="settings-form-group">
                                        <label className="settings-form-label">Confirm New Password</label>
                                        <input
                                            {...registerPassword('confirm_password')}
                                            type="password"
                                            className={`settings-input ${passwordErrors.confirm_password ? 'settings-input-error' : ''}`}
                                        />
                                        {passwordErrors.confirm_password && (
                                            <p className="settings-error-text">
                                                {passwordErrors.confirm_password.message}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="settings-save-btn"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 size={20} className="spin-icon" />
                                                <span>Changing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Lock size={20} />
                                                <span>Change Password</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Connections Tab */}
                        {activeTab === 'connections' && (
                            <div>
                                <h2 className="settings-content-title">Connected Accounts</h2>

                                {/* Discord Connection */}
                                <div className="settings-connection-card">
                                    <div className="settings-connection-header">
                                        <div className="settings-connection-info">
                                            <div className="settings-discord-icon">
                                                <svg width="24" height="24" viewBox="0 0 71 55" fill="white">
                                                    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="settings-connection-title">Discord</h3>
                                                {user.discord_username ? (
                                                    <div className="settings-connection-status settings-connection-connected">
                                                        <CheckCircle size={14} />
                                                        Connected as {user.discord_username}
                                                    </div>
                                                ) : (
                                                    <div className="settings-connection-status settings-connection-disconnected">
                                                        <XCircle size={14} />
                                                        Not connected
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (user.discord_username) {
                                                    try {
                                                        await authService.disconnectDiscord();
                                                        setUser({ discord_username: '' });
                                                        toast.success('Discord disconnected');
                                                    } catch (error) {
                                                        toast.error('Failed to disconnect Discord');
                                                    }
                                                } else {
                                                    try {
                                                        const response = await authService.connectDiscord('connect');
                                                        if (response.url) {
                                                            window.location.href = response.url;
                                                        }
                                                    } catch (error) {
                                                        toast.error('Failed to connect Discord');
                                                    }
                                                }
                                            }}
                                            className={`settings-connection-btn ${user.discord_username ? 'settings-connection-btn-disconnect' : 'settings-connection-btn-connect'}`}
                                        >
                                            {user.discord_username ? 'Disconnect' : 'Connect'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Privacy Tab */}
                        {activeTab === 'privacy' && (
                            <div>
                                <h2 className="settings-content-title">Privacy Settings</h2>

                                <div className="settings-privacy-card">
                                    <h3 className="settings-privacy-title">Profile Visibility</h3>

                                    <label className="settings-privacy-option">
                                        <div>
                                            <div className="settings-privacy-label">Public Profile</div>
                                            <div className="settings-privacy-desc">
                                                Anyone can view your profile
                                            </div>
                                        </div>
                                        <input type="checkbox" defaultChecked className="settings-checkbox" />
                                    </label>

                                    <label className="settings-privacy-option">
                                        <div>
                                            <div className="settings-privacy-label">Show Email</div>
                                            <div className="settings-privacy-desc">
                                                Show your email on your profile
                                            </div>
                                        </div>
                                        <input type="checkbox" className="settings-checkbox" />
                                    </label>

                                    <label className="settings-privacy-option">
                                        <div>
                                            <div className="settings-privacy-label">Show Online Status</div>
                                            <div className="settings-privacy-desc">
                                                Show when you're online
                                            </div>
                                        </div>
                                        <input type="checkbox" defaultChecked className="settings-checkbox" />
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 📱 MOBILE RESPONSIVE STYLES */}
            <style>{`
                /* ========== BASE STYLES (Desktop) ========== */
                .settings-page-wrapper {
                    min-height: 100vh;
                    background: var(--background-primary);
                    padding-top: 150px;
                    padding-bottom: 4rem;
                }

                .settings-header {
                    margin-bottom: 3rem;
                }

                .settings-title {
                    font-size: 2.5rem;
                    font-family: Orbitron, sans-serif;
                    font-weight: 700;
                    margin-bottom: 1rem;
                    background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .settings-subtitle {
                    font-size: 1.125rem;
                    color: var(--text-secondary);
                }

                .settings-container {
                    display: grid;
                    grid-template-columns: 280px 1fr;
                    gap: 2rem;
                    background: var(--background-tertiary);
                    border-radius: 20px;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                }

                .settings-sidebar {
                    background: var(--background-secondary);
                    padding: 2rem;
                }

                .settings-user-info {
                    margin-bottom: 2rem;
                    text-align: center;
                }

                .settings-avatar {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    overflow: hidden;
                    margin: 0 auto 1rem;
                    border: 3px solid var(--accent-blue);
                }

                .settings-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .settings-username {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-bottom: 0.25rem;
                }

                .settings-user-role {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }

                .settings-tabs-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .settings-tab-btn {
                    width: 100%;
                    padding: 1rem;
                    background: transparent;
                    color: var(--text-secondary);
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    transition: all 0.2s;
                    text-align: left;
                    font-size: 0.9375rem;
                    font-weight: 500;
                }

                .settings-tab-active {
                    background: var(--accent-blue);
                    color: white;
                }

                .settings-content {
                    padding: 2.5rem;
                }

                .settings-content-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin-bottom: 2rem;
                }

                .settings-avatar-section {
                    margin-bottom: 2rem;
                }

                .settings-label {
                    display: block;
                    margin-bottom: 0.75rem;
                    font-size: 0.9375rem;
                    font-weight: 500;
                }

                .settings-avatar-upload {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .settings-avatar-preview {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    overflow: hidden;
                    position: relative;
                    flex-shrink: 0;
                }

                .settings-avatar-preview img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .settings-upload-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: var(--accent-blue);
                    color: white;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.9375rem;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .settings-upload-btn:hover {
                    background: #0284c7;
                }

                .settings-upload-hint {
                    margin-top: 0.5rem;
                    font-size: 0.8125rem;
                    color: var(--text-secondary);
                }

                .settings-form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .settings-form-group {
                    display: flex;
                    flex-direction: column;
                }

                .settings-form-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--text-secondary);
                }

                .settings-input {
                    width: 100%;
                    padding: 0.875rem;
                    background: var(--background-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    color: white;
                    font-size: 0.9375rem;
                    transition: border-color 0.2s;
                }

                .settings-input:focus {
                    outline: none;
                    border-color: var(--accent-blue);
                }

                .settings-input-error {
                    border-color: #ef4444;
                }

                .settings-error-text {
                    color: #ef4444;
                    font-size: 0.8125rem;
                    margin-top: 0.375rem;
                }

                .settings-save-btn {
                    padding: 1rem 2rem;
                    background: var(--accent-blue);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    transition: all 0.2s;
                }

                .settings-save-btn:hover {
                    background: #0284c7;
                }

                .settings-save-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .settings-password-form {
                    max-width: 500px;
                }

                .settings-connection-card {
                    background: var(--background-secondary);
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .settings-connection-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                }

                .settings-connection-info {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    flex: 1;
                }

                .settings-discord-icon {
                    width: 48px;
                    height: 48px;
                    background: #5865F2;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .settings-connection-title {
                    font-weight: 600;
                    margin-bottom: 0.25rem;
                }

                .settings-connection-status {
                    font-size: 0.875rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .settings-connection-connected {
                    color: #10b981;
                }

                .settings-connection-disconnected {
                    color: var(--text-secondary);
                }

                .settings-connection-btn {
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }

                .settings-connection-btn-connect {
                    background: #5865F2;
                    color: white;
                    border: 1px solid #5865F2;
                }

                .settings-connection-btn-disconnect {
                    background: var(--background-tertiary);
                    color: white;
                    border: 1px solid #ef4444;
                }

                .settings-privacy-card {
                    background: var(--background-secondary);
                    border-radius: 12px;
                    padding: 1.5rem;
                }

                .settings-privacy-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                }

                .settings-privacy-option {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 0;
                    cursor: pointer;
                    border-bottom: 1px solid var(--border-color);
                }

                .settings-privacy-option:last-child {
                    border-bottom: none;
                }

                .settings-privacy-label {
                    font-weight: 500;
                    margin-bottom: 0.25rem;
                }

                .settings-privacy-desc {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }

                .settings-checkbox {
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                    accent-color: #0ea5e9;
                }

                .spin-icon {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* ========== 📱 MOBILE RESPONSIVE ========== */
                @media (max-width: 768px) {
                    .settings-page-wrapper {
                        padding-top: 120px;
                        padding-bottom: 2rem;
                    }

                    .settings-header {
                        margin-bottom: 2rem;
                    }

                    .settings-title {
                        font-size: 1.75rem;
                    }

                    .settings-subtitle {
                        font-size: 1rem;
                    }

                    .settings-container {
                        grid-template-columns: 1fr;
                        gap: 0;
                        border-radius: 12px;
                    }

                    .settings-sidebar {
                        padding: 1.5rem;
                        border-bottom: 1px solid var(--border-color);
                    }

                    .settings-user-info {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        text-align: left;
                        margin-bottom: 1.5rem;
                    }

                    .settings-avatar {
                        width: 60px;
                        height: 60px;
                        margin: 0;
                    }

                    .settings-username {
                        font-size: 1.125rem;
                    }

                    .settings-user-role {
                        font-size: 0.8125rem;
                    }

                    .settings-tabs-nav {
                        flex-direction: row;
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                        gap: 0.5rem;
                    }

                    .settings-tab-btn {
                        padding: 0.75rem 1rem;
                        white-space: nowrap;
                        flex-shrink: 0;
                    }

                    .settings-tab-btn span {
                        display: none;
                    }

                    .settings-content {
                        padding: 1.5rem;
                    }

                    .settings-content-title {
                        font-size: 1.5rem;
                        margin-bottom: 1.5rem;
                    }

                    .settings-avatar-upload {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .settings-avatar-preview {
                        width: 80px;
                        height: 80px;
                    }

                    .settings-form-grid {
                        grid-template-columns: 1fr;
                        gap: 1.25rem;
                    }

                    .settings-password-form {
                        max-width: 100%;
                    }

                    .settings-save-btn {
                        width: 100%;
                    }

                    .settings-connection-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .settings-connection-btn {
                        width: 100%;
                        text-align: center;
                        justify-content: center;
                    }

                    .settings-privacy-option {
                        padding: 0.875rem 0;
                    }
                }

                /* ========== 📱 SMALL MOBILE (< 480px) ========== */
                @media (max-width: 480px) {
                    .settings-page-wrapper {
                        padding-top: 110px;
                    }

                    .settings-title {
                        font-size: 1.5rem;
                    }

                    .settings-subtitle {
                        font-size: 0.9375rem;
                    }

                    .settings-container {
                        border-radius: 8px;
                    }

                    .settings-sidebar {
                        padding: 1rem;
                    }

                    .settings-user-info {
                        gap: 0.75rem;
                    }

                    .settings-avatar {
                        width: 50px;
                        height: 50px;
                    }

                    .settings-username {
                        font-size: 1rem;
                    }

                    .settings-tabs-nav {
                        gap: 0.25rem;
                    }

                    .settings-tab-btn {
                        padding: 0.625rem 0.75rem;
                    }

                    .settings-content {
                        padding: 1.25rem;
                    }

                    .settings-content-title {
                        font-size: 1.25rem;
                    }

                    .settings-form-label {
                        font-size: 0.8125rem;
                    }

                    .settings-input {
                        padding: 0.75rem;
                        font-size: 0.875rem;
                    }

                    .settings-upload-btn {
                        padding: 0.625rem 1.25rem;
                        font-size: 0.875rem;
                    }

                    .settings-discord-icon {
                        width: 40px;
                        height: 40px;
                    }

                    .settings-connection-title {
                        font-size: 0.9375rem;
                    }

                    .settings-connection-status {
                        font-size: 0.8125rem;
                    }
                }
            `}</style>
        </div>
    );
};