// src/components/profile/EditProfileModal.tsx
import { useState } from 'react';
import { X, Save, Upload, User, MapPin, Calendar, Gamepad2 } from 'lucide-react';

interface EditProfileModalProps {
    user: any;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
}

export const EditProfileModal = ({ user, isOpen, onClose, onSave }: EditProfileModalProps) => {
    const [formData, setFormData] = useState({
        username: user?.username || '',
        location: user?.location || '',
        birthday: user?.birthday || '',
        discord_username: user?.discord_username || '',
        samp_name: user?.samp_name || '',
        samp_faction: user?.samp_faction || '',
        samp_rank: user?.samp_rank || '',
        bio: user?.bio || ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                background: 'var(--background-tertiary)',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto',
                border: '1px solid var(--border-color)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: 'white'
                    }}>
                        Edit Profile
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '0.25rem'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ padding: '1.5rem' }}>
                        {/* Avatar Upload */}
                        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                            <div style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                margin: '0 auto 1rem',
                                position: 'relative'
                            }}>
                                <img
                                    src={user?.avatar_url}
                                    alt={user?.username}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                                <button
                                    type="button"
                                    style={{
                                        position: 'absolute',
                                        bottom: '0',
                                        right: '0',
                                        background: 'var(--accent-blue)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Upload size={16} />
                                </button>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Click to change profile picture
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <User size={14} />
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'var(--background-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        color: 'white',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        color: 'var(--text-secondary)',
                                        marginBottom: '0.5rem',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <MapPin size={14} />
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            background: 'var(--background-secondary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            color: 'white',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        color: 'var(--text-secondary)',
                                        marginBottom: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <Calendar size={14} />
                                        Birthday
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.birthday}
                                        onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            background: 'var(--background-secondary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            color: 'white',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '0.5rem'
                                }}>
                                    Discord Username
                                </label>
                                <input
                                    type="text"
                                    value={formData.discord_username}
                                    onChange={(e) => setFormData({...formData, discord_username: e.target.value})}
                                    placeholder="username#0000"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'var(--background-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        color: 'white',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        color: 'var(--text-secondary)',
                                        marginBottom: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <Gamepad2 size={14} />
                                        SA-MP Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.samp_name}
                                        onChange={(e) => setFormData({...formData, samp_name: e.target.value})}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            background: 'var(--background-secondary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            color: 'white',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        color: 'var(--text-secondary)',
                                        marginBottom: '0.5rem'
                                    }}>
                                        SA-MP Faction
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.samp_faction}
                                        onChange={(e) => setFormData({...formData, samp_faction: e.target.value})}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            background: 'var(--background-secondary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            color: 'white',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '0.5rem'
                                }}>
                                    Bio
                                </label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'var(--background-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        color: 'white',
                                        fontSize: '0.95rem',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '1.5rem',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '0.75rem'
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'var(--background-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '0.95rem'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'var(--accent-blue)',
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Save size={16} />
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};