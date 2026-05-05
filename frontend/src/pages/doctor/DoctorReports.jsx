// =============================================================
// FILE: DoctorReports.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React from 'react';
import Sidebar from '../../components/Sidebar';
import { FileText } from 'lucide-react';

const DoctorReports = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar userType="d" />
            <main style={{ flex: 1, padding: '48px 64px' }}>
                <header style={{ marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '1.875rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={28} color="var(--primary)" /> Clinical Reports
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Generate and view summaries of clinical activity.</p>
                </header>
                
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No reports generated yet.
                </div>
            </main>
        </div>
    );
};

export default DoctorReports;
