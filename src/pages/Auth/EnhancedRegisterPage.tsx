// pages/Auth/EnhancedRegisterPage.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Loader2, User, Mail, Lock, Eye, EyeOff, AlertCircle, Gamepad2, Building2, Shield, MapPin, FileText } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

const registerSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(50),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((val) => val === true, {
        message: 'You must accept the terms and conditions',
    }),
    samp_name: z.string().max(50, 'SA-MP name too long').optional().or(z.literal('')),
    samp_faction: z.string().max(50, 'Faction name too long').optional().or(z.literal('')),
    samp_rank: z.string().max(50, 'Rank too long').optional().or(z.literal('')),
    discord_username: z.string().max(100, 'Discord username too long').optional().or(z.literal('')),
    location: z.string().max(100, 'Location too long').optional().or(z.literal('')),
    bio: z.string().max(500, 'Bio too long').optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const EnhancedRegisterPage = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setFocus,
        watch,
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            termsAccepted: false,
        },
    });

    // Auto-focus no primeiro campo
    useEffect(() => {
        setFocus('username');
    }, [setFocus]);

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await authService.register({
                username: data.username,
                email: data.email,
                password: data.password,
                confirm_password: data.confirmPassword,
                samp_name: data.samp_name,
                samp_faction: data.samp_faction,
                samp_rank: data.samp_rank,
                discord_username: data.discord_username,
                location: data.location,
                bio: data.bio,
            });

            if (response.success && response.data) {
                login(response.data.user, response.data.token, true);
                toast.success('Account created successfully!');
                navigate('/');
            } else {
                setError(response.error || 'Registration failed');
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            setError(
                error.response?.data?.error ||
                error.message ||
                'An error occurred during registration'
            );
            toast.error('Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDiscordRegister = async () => {
        try {
            const response = await authService.connectDiscord('register');
            if (response.url) {
                window.location.href = response.url;
            }
        } catch (error) {
            toast.error('Discord registration failed');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a24 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Pattern */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
                pointerEvents: 'none'
            }}></div>

            <div style={{
                width: '100%',
                maxWidth: '600px',
                background: 'rgba(28, 28, 36, 0.95)',
                border: '1px solid rgba(42, 42, 54, 0.6)',
                borderRadius: '20px',
                padding: '3rem 2.5rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Logo Section */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        margin: '0 auto 1.5rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)'
                    }}>
                        <UserPlus size={40} style={{ color: 'white' }} />
                    </div>
                    <h1 style={{
                        fontSize: '2rem',
                        fontFamily: 'Orbitron, sans-serif',
                        fontWeight: '700',
                        marginBottom: '0.5rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Create Account
                    </h1>
                    <p style={{
                        fontSize: '0.9375rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6
                    }}>
                        Join the Washington Gaming community
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '10px',
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                        <div>
                            <div style={{
                                fontSize: '0.9375rem',
                                fontWeight: '500',
                                color: '#ef4444',
                                marginBottom: '0.25rem'
                            }}>
                                Registration Error
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'rgba(239, 68, 68, 0.8)' }}>
                                {error}
                            </div>
                        </div>
                    </div>
                )}

                {/* Discord Register */}
                <button
                    type="button"
                    onClick={handleDiscordRegister}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        background: '#5865F2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#4752C4';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#5865F2';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 71 55" fill="none">
                        <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="white"/>
                    </svg>
                    Register with Discord
                </button>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    margin: '1.5rem 0',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem'
                }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(42, 42, 54, 0.8)' }}></div>
                    <span>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(42, 42, 54, 0.8)' }}></div>
                </div>

                {/* Registration Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '1.5rem',
                        marginBottom: '1.5rem'
                    }}>
                        {/* Username */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: 'var(--text-secondary)',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <User size={14} />
                                Username
                            </label>
                            <input
                                {...register('username')}
                                type="text"
                                placeholder="Choose a username"
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    background: 'rgba(42, 42, 54, 0.5)',
                                    border: `1px solid ${errors.username ? '#ef4444' : 'rgba(42, 42, 54, 0.8)'}`,
                                    borderRadius: '10px',
                                    color: 'white',
                                    fontSize: '0.9375rem',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(42, 42, 54, 0.8)'}
                            />
                            {errors.username && (
                                <p style={{
                                    marginTop: '0.375rem',
                                    fontSize: '0.8125rem',
                                    color: '#ef4444'
                                }}>
                                    {errors.username.message}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: 'var(--text-secondary)',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <Mail size={14} />
                                Email Address
                            </label>
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="your.email@example.com"
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    background: 'rgba(42, 42, 54, 0.5)',
                                    border: `1px solid ${errors.email ? '#ef4444' : 'rgba(42, 42, 54, 0.8)'}`,
                                    borderRadius: '10px',
                                    color: 'white',
                                    fontSize: '0.9375rem',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(42, 42, 54, 0.8)'}
                            />
                            {errors.email && (
                                <p style={{
                                    marginTop: '0.375rem',
                                    fontSize: '0.8125rem',
                                    color: '#ef4444'
                                }}>
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: 'var(--text-secondary)',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <Lock size={14} />
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem 3rem 0.875rem 1rem',
                                        background: 'rgba(42, 42, 54, 0.5)',
                                        border: `1px solid ${errors.password ? '#ef4444' : 'rgba(42, 42, 54, 0.8)'}`,
                                        borderRadius: '10px',
                                        color: 'white',
                                        fontSize: '0.9375rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(42, 42, 54, 0.8)'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '1rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        padding: '0.25rem'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p style={{
                                    marginTop: '0.375rem',
                                    fontSize: '0.8125rem',
                                    color: '#ef4444'
                                }}>
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: 'var(--text-secondary)'
                            }}>
                                Confirm Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    {...register('confirmPassword')}
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem 3rem 0.875rem 1rem',
                                        background: 'rgba(42, 42, 54, 0.5)',
                                        border: `1px solid ${errors.confirmPassword ? '#ef4444' : 'rgba(42, 42, 54, 0.8)'}`,
                                        borderRadius: '10px',
                                        color: 'white',
                                        fontSize: '0.9375rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(42, 42, 54, 0.8)'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '1rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        padding: '0.25rem'
                                    }}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p style={{
                                    marginTop: '0.375rem',
                                    fontSize: '0.8125rem',
                                    color: '#ef4444'
                                }}>
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        {/* SA-MP Name */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: 'var(--text-secondary)',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <Gamepad2 size={14} />
                                SA-MP Name (Optional)
                            </label>
                            <input
                                {...register('samp_name')}
                                type="text"
                                placeholder="Your in-game name"
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    background: 'rgba(42, 42, 54, 0.5)',
                                    border: `1px solid ${errors.samp_name ? '#ef4444' : 'rgba(42, 42, 54, 0.8)'}`,
                                    borderRadius: '10px',
                                    color: 'white',
                                    fontSize: '0.9375rem',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(42, 42, 54, 0.8)'}
                            />
                        </div>

                        {/* SA-MP Faction */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: 'var(--text-secondary)',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <Building2 size={14} />
                                Faction (Optional)
                            </label>
                            <input
                                {...register('samp_faction')}
                                type="text"
                                placeholder="Your faction"
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    background: 'rgba(42, 42, 54, 0.5)',
                                    border: `1px solid ${errors.samp_faction ? '#ef4444' : 'rgba(42, 42, 54, 0.8)'}`,
                                    borderRadius: '10px',
                                    color: 'white',
                                    fontSize: '0.9375rem',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(42, 42, 54, 0.8)'}
                            />
                        </div>

                        {/* Discord Username */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: 'var(--text-secondary)',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <Shield size={14} />
                                Discord (Optional)
                            </label>
                            <input
                                {...register('discord_username')}
                                type="text"
                                placeholder="username#0000"
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    background: 'rgba(42, 42, 54, 0.5)',
                                    border: `1px solid ${errors.discord_username ? '#ef4444' : 'rgba(42, 42, 54, 0.8)'}`,
                                    borderRadius: '10px',
                                    color: 'white',
                                    fontSize: '0.9375rem',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(42, 42, 54, 0.8)'}
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: 'var(--text-secondary)',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <MapPin size={14} />
                                Location (Optional)
                            </label>
                            <input
                                {...register('location')}
                                type="text"
                                placeholder="Your location"
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    background: 'rgba(42, 42, 54, 0.5)',
                                    border: `1px solid ${errors.location ? '#ef4444' : 'rgba(42, 42, 54, 0.8)'}`,
                                    borderRadius: '10px',
                                    color: 'white',
                                    fontSize: '0.9375rem',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(42, 42, 54, 0.8)'}
                            />
                        </div>
                    </div>

                    {/* Bio */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: 'var(--text-secondary)',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <FileText size={14} />
                            Bio (Optional)
                        </label>
                        <textarea
                            {...register('bio')}
                            rows={3}
                            placeholder="Tell us about yourself..."
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                background: 'rgba(42, 42, 54, 0.5)',
                                border: `1px solid ${errors.bio ? '#ef4444' : 'rgba(42, 42, 54, 0.8)'}`,
                                borderRadius: '10px',
                                color: 'white',
                                fontSize: '0.9375rem',
                                resize: 'vertical',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(42, 42, 54, 0.8)'}
                        />
                        {errors.bio && (
                            <p style={{
                                marginTop: '0.375rem',
                                fontSize: '0.8125rem',
                                color: '#ef4444'
                            }}>
                                {errors.bio.message}
                            </p>
                        )}
                    </div>

                    {/* Terms and Conditions */}
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                        }}>
                            <input
                                {...register('termsAccepted')}
                                type="checkbox"
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer',
                                    accentColor: '#10b981',
                                    marginTop: '0.125rem'
                                }}
                            />
                            <div style={{ color: 'var(--text-secondary)' }}>
                                I agree to the{' '}
                                <Link to="/terms" style={{ color: '#10b981', textDecoration: 'underline' }}>
                                    Terms of Service
                                </Link>
                                {' '}and{' '}
                                <Link to="/privacy" style={{ color: '#10b981', textDecoration: 'underline' }}>
                                    Privacy Policy
                                </Link>
                            </div>
                        </label>
                        {errors.termsAccepted && (
                            <p style={{
                                marginTop: '0.375rem',
                                fontSize: '0.8125rem',
                                color: '#ef4444',
                                marginLeft: '1.5rem'
                            }}>
                                {errors.termsAccepted.message}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            transition: 'all 0.2s',
                            marginBottom: '1.5rem'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 25px rgba(16, 185, 129, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                                <span>Creating account...</span>
                            </>
                        ) : (
                            <>
                                <UserPlus size={20} />
                                <span>Create Account</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Login Link */}
                <div style={{ textAlign: 'center' }}>
                    <p style={{
                        fontSize: '0.9375rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '1rem'
                    }}>
                        Already have an account?
                    </p>
                    <Link
                        to="/login"
                        style={{
                            display: 'inline-block',
                            padding: '0.875rem 2rem',
                            background: 'rgba(42, 42, 54, 0.5)',
                            color: '#0ea5e9',
                            borderRadius: '10px',
                            textDecoration: 'none',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            border: '1px solid rgba(14, 165, 233, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(42, 42, 54, 0.5)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        Sign In
                    </Link>
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};