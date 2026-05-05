// =============================================================
// FILE: Home.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Stethoscope, UserPlus, FlaskConical, User, ArrowRight } from 'lucide-react';

const Home = () => {
  const portals = [
    { 
        title: 'Administrator', 
        desc: 'System management, staff controls, and schedules.', 
        icon: Shield, 
        path: '/login', 
        color: '#0ea5e9',
        role: 'Admin Portal'
    },
    { 
        title: 'Doctor', 
        desc: 'Consultations, patient history, and prescriptions.', 
        icon: Stethoscope, 
        path: '/login', 
        color: '#10b981',
        role: 'Medical Staff'
    },
    { 
        title: 'Registrar', 
        desc: 'Front desk, patient enrollment, and booking.', 
        icon: UserPlus, 
        path: '/login', 
        color: '#f59e0b',
        role: 'Receptionist'
    },
    { 
        title: 'Laboratory', 
        desc: 'Test requests, sample tracking, and results.', 
        icon: FlaskConical, 
        path: '/login', 
        color: '#8b5cf6',
        role: 'Lab Technician'
    },
    { 
        title: 'Patient Portal', 
        desc: 'View reports, book appointments, and history.', 
        icon: User, 
        path: '/login', 
        color: '#ec4899',
        role: 'Personal Health'
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', paddingBottom: '80px' }}>
      {/* Top Banner */}
      <div style={{ background: 'var(--primary)', color: 'white', padding: '12px', textAlign: 'center', fontSize: '0.875rem', fontWeight: '500' }}>
        ✨ Moon View Medical Centre: Advanced Offline Healthcare Management System v2.0
      </div>

      {/* Hero Section */}
      <header style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--primary)', width: '40px', height: '40px', borderRadius: '10px' }}></div>
            <span style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-1px' }}>Moon View<span style={{ color: 'var(--primary)' }}> Medical</span></span>
        </div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '20px', lineHeight: '1.1' }}>
            Choose Your <span style={{ color: 'var(--primary)' }}>Access Portal</span>
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#64748b', maxWidth: '700px', margin: '0 auto' }}>
            A unified clinical environment for healthcare professionals and patients. 
            Select your department below to sign in to your workspace.
        </p>
      </header>

      {/* Portal Cards Grid */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        {portals.map((portal, idx) => (
          <Link 
            key={idx} 
            to={portal.path} 
            style={{ 
                textDecoration: 'none', 
                color: 'inherit',
                background: 'white',
                padding: '40px',
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden'
            }}
            className="portal-card"
          >
            {/* Background Accent */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `${portal.color}08`, borderRadius: '0 0 0 100%' }}></div>

            <div style={{ 
                width: '64px', 
                height: '64px', 
                background: `${portal.color}15`, 
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '24px',
                color: portal.color
            }}>
                <portal.icon size={32} />
            </div>

            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: portal.color, marginBottom: '8px', display: 'block' }}>
                {portal.role}
            </span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px' }}>{portal.title}</h3>
            <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '24px', flex: 1 }}>{portal.desc}</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--primary)' }}>
                Sign In to Portal <ArrowRight size={18} />
            </div>
          </Link>
        ))}
      </main>

      {/* Footer */}
      <footer style={{ marginTop: '100px', textAlign: 'center', color: '#94a3b8' }}>
        <p>© 2026 Moon View Medical Centre • Professional Medical Suite • Offline Mode Active</p>
      </footer>

      {/* Hover Effects CSS */}
      <style>{`
        .portal-card:hover {
            transform: translateY(-8px);
            border-color: var(--primary);
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default Home;
