import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

const registerSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine(val => val === true, {
        message: 'You must accept the terms',
    }),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const MinimalRegister = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setIsLoading(true);

            console.log('🆕 Attempting registration...', { username: data.username, email: data.email });

            const response = await authService.register({
                username: data.username,
                email: data.email,
                password: data.password,
                confirm_password: data.confirmPassword,
            });

            console.log('📥 Register response:', response);

            // MESMA LÓGICA DO LOGIN
            if (response.success) {
                toast.success('Account created! Check your email to verify.');
                // ✅ ir para página de "check email" e permitir reenvio
                setTimeout(() => {
                    navigate(`/check-email?email=${encodeURIComponent(data.email)}`, { replace: true });
                }, 150);
                return;
            }else {
                console.error('❌ Registration failed:', response);
                const errorMessage = response.message || response.error || 'Registration failed';
                setError('root', { type: 'manual', message: errorMessage });
                toast.error(errorMessage);
            }
        } catch (error: any) {
            console.error('💥 Registration error:', error);

            let errorMessage = 'Registration error';
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setError('root', { type: 'manual', message: errorMessage });
            toast.error(errorMessage);
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--background-primary)'
        }}>
            {/* Background Image */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'url(https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=2070&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.15,
                zIndex: 0
            }}></div>

            <div style={{
                width: '100%',
                maxWidth: '450px',
                background: 'rgba(20, 20, 25, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '40px 32px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>

                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Create Account
                    </h1>
                    <p style={{ color: '#888', fontSize: '14px' }}>
                        Join Washington Gaming community
                    </p>
                </div>

                {errors.root && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        color: '#ef4444'
                    }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#ef4444',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}>!</div>
                        <div>{errors.root.message}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#ccc'
                        }}>
                            Username
                        </label>
                        <input
                            {...register('username')}
                            type="text"
                            placeholder="Choose username"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${errors.username ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px'
                            }}
                        />
                        {errors.username && (
                            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                                {errors.username.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#ccc'
                        }}>
                            Email
                        </label>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="your@email.com"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${errors.email ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px'
                            }}
                        />
                        {errors.email && (
                            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#ccc'
                        }}>
                            Password
                        </label>
                        <input
                            {...register('password')}
                            type="password"
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${errors.password ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px'
                            }}
                        />
                        {errors.password && (
                            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#ccc'
                        }}>
                            Confirm Password
                        </label>
                        <input
                            {...register('confirmPassword')}
                            type="password"
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${errors.confirmPassword ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px'
                            }}
                        />
                        {errors.confirmPassword && (
                            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                                {errors.confirmPassword.message}
                            </p>
                        )}
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        marginTop: '8px'
                    }}>
                        <input
                            {...register('termsAccepted')}
                            type="checkbox"
                            style={{ marginTop: '4px', width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <label style={{ fontSize: '14px', color: '#aaa', lineHeight: '1.4', cursor: 'pointer' }}>
                            I agree to the <Link to="/terms" style={{ color: '#0ea5e9', textDecoration: 'none' }}>Terms</Link> and <Link to="/privacy" style={{ color: '#0ea5e9', textDecoration: 'none' }}>Privacy Policy</Link>
                        </label>
                    </div>
                    {errors.termsAccepted && (
                        <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '-8px' }}>
                            {errors.termsAccepted.message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            padding: '14px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.6 : 1,
                            transition: 'all 0.2s',
                            marginTop: '8px'
                        }}
                    >
                        {isLoading ? 'Creating account...' : 'Create Account'}
                    </button>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        margin: '8px 0'
                    }}>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
                        <span style={{ color: '#888', fontSize: '12px' }}>or</span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
                    </div>

                    <button
                        type="button"
                        onClick={handleDiscordRegister}
                        style={{
                            padding: '14px',
                            background: '#5865F2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'background 0.2s'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 71 55" fill="white">
                            <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z" />
                        </svg>
                        Register with Discord
                    </button>
                </form>

                <div style={{
                    textAlign: 'center',
                    marginTop: '24px',
                    paddingTop: '24px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <p style={{ color: '#888', marginBottom: '8px' }}>
                        Already have an account?
                    </p>
                    <Link to="/login" style={{
                        color: '#10b981',
                        textDecoration: 'none',
                        fontWeight: '600'
                    }}>
                        Sign In
                    </Link>
                </div>
            </div>

            <style>{`
                input:focus {
                    outline: none;
                    border-color: #10b981 !important;
                }
                
                button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
                }
            `}</style>
        </div>
    );
};