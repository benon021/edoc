// =============================================================
// FILE: PharmaSettings.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React from 'react';
import Sidebar from '../../components/Sidebar';
import StaffSettings from '../../components/StaffSettings';
import { Settings } from 'lucide-react';

const PharmaSettings = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar userType="ph" />
            <main style={{ flex: 1, padding: '48px 64px' }}>
                <header style={{ marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Settings size={32} color="var(--primary)" /> Pharmacy Settings
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage your pharmacist profile and account security.</p>
                </header>

                <StaffSettings userType="ph" />
            </main>
        </div>
    );
};

export default PharmaSettings;
