// src/pages/RulesPage.tsx
import { Header } from '@/components/layout/Header';

export const RulesPage = () => {
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
                    <h1 style={{ color: 'white', marginBottom: '1rem' }}>Server Rules</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Server rules content...</p>
                </div>
            </div>
        </>
    );
};