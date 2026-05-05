// =============================================================
// FILE: LabEntry.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React from 'react';
import Sidebar from '../../components/Sidebar';
import { FileText, Save, AlertTriangle, Paperclip } from 'lucide-react';

const LabEntry = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar userType="l" />
            <main style={{ flex: 1, padding: '48px 64px' }}>
                <header style={{ marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={32} color="var(--primary)" /> Result Entry
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Input test results, abnormal flags, and clinical comments.</p>
                </header>

                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', padding: '48px', color: 'var(--text-muted)' }}>
                    Select a test from 'Test Requests' to start entry.
                </div>
            </main>
        </div>
    );
};

export default LabEntry;
