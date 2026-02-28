import { Link } from 'react-router-dom';

export const NotFound = () => {
    return (
        <div
            style={{
                minHeight: 'calc(100vh - 140px)', // mesmo margin-top que o main
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-primary)'
            }}
        >
            <h1 style={{ fontSize: '6rem', margin: '0', color: '#ef4444' }}>404</h1>
            <h2 style={{ fontSize: '2.5rem', margin: '1rem 0' }}>Page Not Found -_- </h2>

            <p style={{ fontSize: '1.3rem', marginBottom: '2rem', maxWidth: '600px' }}>
                What The Hell you Want here!? This Page Dosent Exists... Or you Lost your goddamn Mind and RP? 😏
            </p>

            {/* Seu GIF do 404 aqui */}
            <img
                src="/404.gif"          // ← coloca o caminho certo do teu GIF
                alt="O que você quer por aqui!?"
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
            />

            <Link
                to="/"
                style={{
                    marginTop: '2.5rem',
                    padding: '0.9rem 2.2rem',
                    background: 'var(--accent-blue)',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '1.2rem',
                    fontWeight: 600
                }}
            >
                Back Home
            </Link>
        </div>
    );
};