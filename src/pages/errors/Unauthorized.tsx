import { Link } from 'react-router-dom';

export const Unauthorized = () => {
    return (
        <div
            style={{
                minHeight: 'calc(100vh - 140px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-primary)'
            }}
        >
            <h1 style={{ fontSize: '6rem', margin: '0', color: '#f59e0b' }}>403</h1>
            <h2 style={{ fontSize: '2.5rem', margin: '1rem 0' }}>Acess Denied</h2>

            <p style={{ fontSize: '1.3rem', marginBottom: '2rem', maxWidth: '600px' }}>
                Hey, hold on! You don't have permission to come in here... What do you want here!? 👀
            </p>

            {/* Seu GIF do 403 aqui */}
            <img
                src="/403.gif"           // ← coloca o caminho certo do teu GIF
                alt="Acesso negado - O que você quer por aqui!?"
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
            />

            <Link
                to="/"
                style={{
                    marginTop: '2.5rem',
                    padding: '0.9rem 2.2rem',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '1.2rem',
                    fontWeight: 600
                }}
            >
                Back To Your Damn Home And Login
            </Link>
        </div>
    );
};