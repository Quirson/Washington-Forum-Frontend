// App.tsx - VERSÃO ATUALIZADA COM MINIMAL LOGIN
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { Header } from './components/layout/Header';
import {AuthBootstrap} from "@/AuthBootstrap.tsx";
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { HomePage } from './pages/Home/HomePage';
import { MinimalLogin } from './pages/Auth/MinimalLogin'; // ← Alterado
import { MinimalRegister } from './pages/Auth/MinimalRegister'; // ← Alterado
import { SettingsPage } from './components/profile/SettingsPage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { StaffPage } from './pages/Staff/StaffPage';
import { MembersPage } from './pages/Members/MembersPageNew';
import { useAuthStore } from './store/auth.store';
import { ActivityPage } from './pages/Activity/ActivityPage';
import { FactionsPage } from "./pages/Factions/FactionsPage";
import FactionPage from "@/pages/Factions/FactionPage";
import { MessagesPage } from './components/messages/MessagesPage';
import { NotFound } from './pages/errors/NotFound';
import { Unauthorized } from './pages/errors/Unauthorized';
import { ManagersPage } from './pages/Management/ManagersPage';

import { ApplicationsPage } from "./pages/Applications/ApplicationsPage";
import { ApplicationSubmitPage } from "./pages/Applications/ApplicationSubmitPage";
import { ApplicationPublicLogsPage } from "./pages/Applications/ApplicationLogsPage.tsx";
import { MyApplicationsPage } from "./pages/Applications/MyApplicationsPage";
import { SubmissionDetailsPage } from "./pages/Applications/SubmissionDetailsPage";
import { ReviewsPage } from "./pages/Applications/ReviewsPage";
import { ReviewSubmissionPage } from "./pages/Applications/ReviewSubmissionPage";

import { CheckEmail } from './pages/Auth/CheckEmail';
import { VerifyEmail } from './pages/Auth/VerifyEmail';
import { ForgotPassword } from './pages/Auth/ForgotPassword';
import { ResetPassword } from './pages/Auth/ResetPassword';

import PostsPage from "@/pages/Posts/PostsPage";

import { NewsPage } from '@/pages/Home/NewsPage';
import { UpdatesPage } from '@/pages/Home/UpdatesPage';
import { CommunityContentPage } from '@/pages/Home/CommunityContentPage';

import { PublicSubmissionPage } from './pages/Applications/PublicSubmissionPage.tsx'

// Create Query Client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000,
        },
    },
});

function App() {
    const { initialize } = useAuthStore();

    // Inicializar autenticação quando o app carrega
    useEffect(() => {
        initialize();
    }, [initialize]);

    return (
        <QueryClientProvider client={queryClient}>
            <Router future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
            }}>
                <div className="min-h-screen bg-dark-100">
                    <AuthBootstrap />
                    <Header />

                    <main style={{
                        marginTop: '140px',
                        minHeight: 'calc(100vh - 140px)',
                        backgroundColor: 'var(--background-primary)'
                    }}>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<HomePage />} />
                            <Route path="/login" element={
                                <ProtectedRoute requireAuth={false}>
                                    <MinimalLogin /> {/* ← Alterado aqui */}
                                </ProtectedRoute>
                            } />
                            <Route path="/posts" element={<PostsPage />} />
                            <Route path="/check-email" element={<CheckEmail />} />
                            <Route path="/verify-email" element={<VerifyEmail />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/news" element={<NewsPage />} />
                            <Route path="/updates" element={<UpdatesPage />} />
                            <Route path="/community" element={<CommunityContentPage />} />
                            <Route path="/applications/:code/logs" element={<ApplicationPublicLogsPage />} />
                            <Route path="/applications/public/submissions/:id" element={<PublicSubmissionPage />} />
                            <Route path="/register" element={
                                <ProtectedRoute requireAuth={false}>
                                    <MinimalRegister /> {/* ← Alterado aqui */}
                                </ProtectedRoute>
                            } />
                            <Route path="/staff" element={<StaffPage />} />
                            <Route path="/members" element={<MembersPage />} />
                            <Route path="/profile/:id" element={<ProfilePage />} />

                            <Route path="/messages" element={
                                <ProtectedRoute>
                                    <MessagesPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/admin" element={
                                <ProtectedRoute>
                                    <ManagersPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/messages/:id" element={
                                <ProtectedRoute>
                                    <MessagesPage />
                                </ProtectedRoute>
                            } />


                            {/* Protected Routes */}
                            <Route path="/settings" element={
                                <ProtectedRoute>
                                    <SettingsPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/activity" element={<ActivityPage />} />
                            <Route path="/factions" element={
                                <ProtectedRoute>
                                    <FactionsPage/>
                                </ProtectedRoute>
                            } />

                            <Route path="/applications" element={
                                <ProtectedRoute>
                                    <ApplicationsPage/>
                                </ProtectedRoute>
                            } />
                            <Route
                                path="/applications/my"
                                element={
                                    <ProtectedRoute>
                                        <MyApplicationsPage />
                                    </ProtectedRoute>
                                }
                            />


                            <Route
                                path="/applications/:code"
                                element={
                                    <ProtectedRoute>
                                        <ApplicationSubmitPage />
                                    </ProtectedRoute>
                                }
                            />


                            <Route
                                path="/applications/:code/logs"
                                element={
                                    <ProtectedRoute>
                                        <ApplicationPublicLogsPage />
                                    </ProtectedRoute>
                                }
                            />


                            <Route
                                path="/applications/submissions/:id"
                                element={
                                    <ProtectedRoute>
                                        <SubmissionDetailsPage />
                                    </ProtectedRoute>
                                }
                            />


                            <Route
                                path="/applications/reviews"
                                element={
                                    <ProtectedRoute>
                                        <ReviewsPage />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/applications/reviews/submissions/:id"
                                element={
                                    <ProtectedRoute>
                                        <ReviewSubmissionPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/factions/:id" element={
                                <ProtectedRoute>
                                    <FactionPage />
                                </ProtectedRoute>
                            } />
                            {/* Error Pages */}
                            {/* Páginas de erro explícitas */}
                            <Route path="/unauthorized" element={<Unauthorized />} />

                            {/* Catch-all → 404 para qualquer rota que não exista */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </main>

                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#1c1c24',
                                color: '#fff',
                                border: '1px solid #2a2a36',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#0ea5e9',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />
                </div>
            </Router>
        </QueryClientProvider>
    );
}

export default App;