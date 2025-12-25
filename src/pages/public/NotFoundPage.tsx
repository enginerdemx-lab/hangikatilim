import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, HelpCircle, Calculator, Newspaper, Building2 } from 'lucide-react';

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    const quickLinks = [
        { icon: Home, label: 'Ana Sayfa', path: '/' },
        { icon: Calculator, label: 'Hesaplayıcı', path: '/#calculator' },
        { icon: Newspaper, label: 'Sektör Haberleri', path: '/sektor-haberleri' },
        { icon: Building2, label: 'Katılım Firmaları', path: '/katilim-firmalari' },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated Background Elements */}
            <div style={{
                position: 'absolute',
                top: '25%',
                left: '25%',
                width: '384px',
                height: '384px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '50%',
                filter: 'blur(64px)',
                animation: 'pulse 4s ease-in-out infinite'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '25%',
                right: '25%',
                width: '384px',
                height: '384px',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '50%',
                filter: 'blur(64px)',
                animation: 'pulse 4s ease-in-out infinite 1s'
            }} />

            <div style={{
                position: 'relative',
                zIndex: 10,
                maxWidth: '672px',
                width: '100%',
                textAlign: 'center'
            }}>
                {/* 404 Number */}
                <div style={{ position: 'relative', marginBottom: '2rem' }}>
                    <h1 style={{
                        fontSize: 'clamp(120px, 20vw, 200px)',
                        fontWeight: 900,
                        background: 'linear-gradient(90deg, #60a5fa, #34d399, #60a5fa)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        lineHeight: 1,
                        margin: 0,
                        userSelect: 'none'
                    }}>
                        404
                    </h1>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.2))',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Search style={{ width: '48px', height: '48px', color: 'rgba(255, 255, 255, 0.6)' }} />
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        color: 'white',
                        marginBottom: '0.75rem'
                    }}>
                        Sayfa Bulunamadı
                    </h2>
                    <p style={{
                        color: '#9ca3af',
                        fontSize: '1.125rem',
                        maxWidth: '28rem',
                        margin: '0 auto'
                    }}>
                        Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
                    </p>
                </div>

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    justifyContent: 'center',
                    marginBottom: '3rem'
                }}>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => navigate(-1)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                        >
                            <ArrowLeft style={{ width: '20px', height: '20px' }} />
                            Geri Dön
                        </button>
                        <Link
                            to="/"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                background: 'linear-gradient(90deg, #2563eb, #059669)',
                                color: 'white',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                fontSize: '1rem',
                                boxShadow: '0 10px 25px rgba(37, 99, 235, 0.25)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <Home style={{ width: '20px', height: '20px' }} />
                            Ana Sayfaya Git
                        </Link>
                    </div>
                </div>

                {/* Quick Links */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '1.5rem'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginBottom: '1rem'
                    }}>
                        <HelpCircle style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
                        <span style={{ color: '#d1d5db', fontWeight: 500 }}>Belki bunlar yardımcı olabilir</span>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '0.75rem'
                    }}>
                        {quickLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                }}
                            >
                                <link.icon style={{ width: '24px', height: '24px', color: '#9ca3af' }} />
                                <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                                    {link.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <p style={{ marginTop: '2rem', color: '#6b7280', fontSize: '0.875rem' }}>
                    Bir sorun olduğunu düşünüyorsanız{' '}
                    <Link to="/iletisim" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                        bizimle iletişime geçin
                    </Link>
                </p>
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
        </div>
    );
};

export default NotFoundPage;
