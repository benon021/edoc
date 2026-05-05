// =============================================================
// FILE: DoctorSettings.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React from 'react';
import Sidebar from '../../components/Sidebar';
import StaffSettings from '../../components/StaffSettings';
import { Settings } from 'lucide-react';

const DoctorSettings = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar userType="d" />
            <main style={{ flex: 1, padding: '48px 64px' }}>
                <header style={{ marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Settings size={32} color="var(--primary)" /> Account Settings
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage your professional profile and security settings.</p>
                </header>

                <StaffSettings userType="d" />
            </main>
        </div>
    );
};

export default DoctorSettings;
