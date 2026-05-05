// =============================================================
// FILE: LabProcessing.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React from 'react';
import Sidebar from '../../components/Sidebar';
import { Activity, Clock, Server, CheckCircle } from 'lucide-react';

const LabProcessing = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar userType="l" />
            <main style={{ flex: 1, padding: '48px 64px' }}>
                <header style={{ marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Activity size={32} color="#10b981" /> Test Processing
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Monitor active tests, equipment status, and quality control checks.</p>
                </header>

                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No tests currently in progress.
                </div>
            </main>
        </div>
    );
};

export default LabProcessing;
