import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, Loader2, Lock, Mail } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
    const navigate = useNavigate();
    const { setUser, setToken } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            setIsLoading(true);
            const response = await authService.login(data);

            if (response.data) {
                setUser(response.data.user);
                setToken(response.data.token);
                toast.success('Welcome back!');
                navigate('/');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDiscordLogin = async () => {
        try {
            const response = await authService.connectDiscord('register');
            if (response.url) {
                window.location.href = response.url;
            }
        } catch (error) {
            toast.error('Discord login failed');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--background-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
            paddingTop: '440px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '900px',
                background: 'var(--background-tertiary)',
                border: '2px solid var(--border-color)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    minHeight: '600px'
                }}>
                    {/* Left Side - Branding */}
                    <div style={{
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                        padding: '3rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Decorative Background */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                            pointerEvents: 'none'
                        }}></div>

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{
                                width: '120px',
                                height: '120px',
                                background: 'rgba(255,255,255,0.2)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 2rem',
                                backdropFilter: 'blur(10px)',
                                border: '3px solid rgba(255,255,255,0.3)'
                            }}>
                                <LogIn size={60} style={{ color: 'white' }} />
                            </div>

                            <h1 style={{
                                fontSize: '2.5rem',
                                fontFamily: 'Orbitron, sans-serif',
                                fontWeight: '700',
                                color: 'white',
                                marginBottom: '1rem',
                                textShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}>
                                Welcome Back
                            </h1>

                            <p style={{
                                fontSize: '1.125rem',
                                color: 'rgba(255,255,255,0.9)',
                                lineHeight: 1.6,
                                marginBottom: '2rem'
                            }}>
                                Sign in to continue to Washington Gaming forum and connect with the community
                            </p>

                            <div style={{
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <div style={{
                                    fontSize: '0.9375rem',
                                    color: 'rgba(255,255,255,0.95)',
                                    marginBottom: '0.75rem'
                                }}>
                                    New to Washington Gaming?
                                </div>
                                <Link
                                    to="/register"
                                    style={{
                                        display: 'inline-block',
                                        padding: '0.875rem 2rem',
                                        background: 'white',
                                        color: '#0ea5e9',
                                        borderRadius: '8px',
                                        textDecoration: 'none',
                                        fontWeight: '600',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                    }}
                                >
                                    Create Account
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div style={{
                        padding: '3rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}>
                        <div>
                            <h2 style={{
                                fontSize: '1.875rem',
                                fontFamily: 'Orbitron, sans-serif',
                                fontWeight: '700',
                                marginBottom: '0.5rem'
                            }}>
                                Sign In
                            </h2>
                            <p style={{
                                color: 'var(--text-secondary)',
                                fontSize: '0.9375rem',
                                marginBottom: '2rem'
                            }}>
                                Enter your credentials to access your account
                            </p>

                            {/* Discord Login */}
                            <button
                                onClick={handleDiscordLogin}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: '#5865F2',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
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
                                onMouseEnter={(e) => e.currentTarget.style.background = '#4752C4'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#5865F2'}
                            >
                                <svg width="24" height="24" viewBox="0 0 71 55" fill="none">
                                    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="white"/>
                                </svg>
                                Continue with Discord
                            </button>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                margin: '1.5rem 0',
                                color: 'var(--text-secondary)',
                                fontSize: '0.875rem'
                            }}>
                                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                                <span>OR</span>
                                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                            </div>

                            {/* Login Form */}
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '0.5rem',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        Email Address
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{
                                            position: 'absolute',
                                            left: '1rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'var(--text-secondary)'
                                        }} />
                                        <input
                                            {...register('email')}
                                            type="email"
                                            placeholder="your@email.com"
                                            className="input-field"
                                            style={{ width: '100%', paddingLeft: '3rem' }}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p style={{ color: '#ef4444', fontSize: '0.8125rem', marginTop: '0.375rem' }}>
                                            {errors.email.message}
                                        </p>
                                    )}
                                </div>

                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '0.5rem',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        Password
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{
                                            position: 'absolute',
                                            left: '1rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'var(--text-secondary)'
                                        }} />
                                        <input
                                            {...register('password')}
                                            type="password"
                                            placeholder="••••••••"
                                            className="input-field"
                                            style={{ width: '100%', paddingLeft: '3rem' }}
                                        />
                                    </div>
                                    {errors.password && (
                                        <p style={{ color: '#ef4444', fontSize: '0.8125rem', marginTop: '0.375rem' }}>
                                            {errors.password.message}
                                        </p>
                                    )}
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '1.5rem'
                                }}>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.875rem',
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            {...register('rememberMe')}
                                            type="checkbox"
                                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                        <span style={{ color: 'var(--text-secondary)' }}>Remember me</span>
                                    </label>

                                    <Link
                                        to="/forgot-password"
                                        style={{
                                            fontSize: '0.875rem',
                                            color: '#0ea5e9',
                                            textDecoration: 'none',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-primary"
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        fontSize: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            <span>Signing in...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogIn size={20} />
                                            <span>Sign In</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Responsive */}
            <style>{`
                @media (max-width: 768px) {
                    #root > div > div > div {
                        grid-template-columns: 1fr !important;
                    }
                    #root > div > div > div > div:first-child {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
};