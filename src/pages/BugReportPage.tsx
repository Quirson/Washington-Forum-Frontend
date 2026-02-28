// src/pages/BugReportPage.tsx
import { Header } from '@/components/layout/Header';

export const BugReportPage = () => {
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
                    <h1 style={{ color: 'white', marginBottom: '1rem' }}>Bug Report</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Report bugs here...</p>
                </div>
            </div>
        </>
    );
};