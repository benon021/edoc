// =============================================================
// FILE: LabResults.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Search, Download, Eye, X, FileText, Calendar, User, Microscope, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function LabResults() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);

    const fetchResults = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch raw reports
            const { data: rawData, error: reportError } = await supabase
                .from('lab_reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (reportError) throw reportError;

            // 2. Fetch patients manually
            const pids = [...new Set((rawData || []).map(r => r.patient_id).filter(Boolean))];
            let patients = [];
            if (pids.length > 0) {
                const { data: pData } = await supabase
                    .from('patient')
                    .select('pid, pname, pgender')
                    .in('pid', pids);
                patients = pData || [];
            }

            // 3. Fetch technicians manually
            const { data: techData } = await supabase
                .from('lab_technician')
                .select('labid, labname');
            const techMap = (techData || []).reduce((acc, t) => {
                acc[t.labid] = t.labname;
                return acc;
            }, {});

            const mapped = (rawData || []).map(r => {
                const pat = patients.find(p => p.pid === r.patient_id);
                return {
                    ...r,
                    pname: pat?.pname || 'Unknown',
                    pgender: pat?.pgender || 'Unknown',
                    technician_name: techMap[r.technician_id] || 'System'
                };
            });
            
            setResults(mapped);
        } catch (e) { setResults([]); }
        setLoading(false);
    }, []);

    useEffect(() => { fetchResults(); }, [fetchResults]);

    const filtered = results.filter(r =>
        !search || r.pname?.toLowerCase().includes(search.toLowerCase()) || r.test_name?.toLowerCase().includes(search.toLowerCase())
    );

    const handlePrint = (result) => {
        const resultData = (() => { try { return JSON.parse(result.results || '{}'); } catch { return {}; } })();
        const win = window.open('', '_blank');
        win.document.write(`
            <!DOCTYPE html><html><head><title>Lab Report — ${result.pname}</title>
            <style>
                body { font-family: 'Arial', sans-serif; margin: 40px; color: #1e293b; }
                .header { border-bottom: 3px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; }
                .logo { font-size: 1.4rem; font-weight: 900; color: #0f172a; }
                .subtitle { color: #64748b; font-size: 0.85rem; }
                .badge { background: #ecfdf5; border: 1px solid #86efac; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px; }
                .info-item label { display: block; font-size: 0.7rem; text-transform: uppercase; color: #94a3b8; font-weight: 600; margin-bottom: 4px; }
                .info-item span { font-weight: 700; font-size: 0.95rem; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
                th { background: #0f172a; color: white; padding: 10px 16px; text-align: left; font-size: 0.8rem; }
                td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; }
                tr:nth-child(even) td { background: #f8fafc; }
                .notes { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; font-size: 0.9rem; }
                .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; justify-content: space-between; font-size: 0.8rem; color: #94a3b8; }
                .sig { border-top: 1px solid #0f172a; width: 200px; padding-top: 4px; font-size: 0.78rem; color: #64748b; text-align: center; }
            </style></head><body>
            <div class="header">
                <div><div class="logo">🏥 eDoc Hospital</div><div class="subtitle">Clinical Laboratory Report</div></div>
                <div style="text-align:right"><div class="badge">✓ COMPLETED</div><div style="margin-top:6px;font-size:0.8rem;color:#64748b">${new Date(result.created_at).toLocaleDateString()}</div></div>
            </div>
            <div class="info-grid">
                <div class="info-item"><label>Patient Name</label><span>${result.pname}</span></div>
                <div class="info-item"><label>Patient ID</label><span>${result.patient_display_id || '—'}</span></div>
                <div class="info-item"><label>Gender</label><span>${result.pgender || '—'}</span></div>
                <div class="info-item"><label>Test Name</label><span>${result.test_name}</span></div>
                <div class="info-item"><label>Technician</label><span>${result.technician_name || '—'}</span></div>
                <div class="info-item"><label>Date Processed</label><span>${new Date(result.created_at).toLocaleString()}</span></div>
            </div>
            <table>
                <thead><tr><th>Parameter</th><th>Result</th></tr></thead>
                <tbody>
                    ${Object.entries(resultData).map(([k, v]) => {
                        const valStr = typeof v === 'object' && v !== null ? `${v.value} ${v.unit || ''}` : String(v);
                        return `<tr><td>${k}</td><td><strong>${valStr}</strong></td></tr>`;
                    }).join('')}
                </tbody>
            </table>
            ${result.notes ? `<div class="notes"><strong>Technician Notes:</strong><br>${result.notes}</div>` : ''}
            <div class="footer">
                <div>Generated: ${new Date().toLocaleString()}</div>
                <div class="sig">Authorized Technician: ${result.technician_name || '___________'}</div>
            </div>
            </body></html>
        `);
        win.document.close();
        win.print();
    };

    const parseResults = (raw) => { try { return JSON.parse(raw || '{}'); } catch { return {}; } };

    return (
        <div style={{ padding: '40px 56px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <CheckCircle size={28} color="#10b981" /> Completed Results
                    </h1>
                    <p style={{ color: '#64748b', marginTop: 4 }}>Review and deliver completed test results to doctors.</p>
                </div>

                {/* Search */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by patient or test name..." style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                    </div>
                </div>

                {/* Table */}
                <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                {['Patient', 'Test Name', 'Technician', 'Date Completed', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '14px 20px', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 64, color: '#94a3b8' }}>Loading results archive...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                                            <FileText size={48} color="#e2e8f0" style={{ marginBottom: 16 }} />
                                            <p style={{ color: '#94a3b8', fontWeight: 500 }}>No completed results found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.map((r, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f8fafc', transition: '0.15s' }}
                                    onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseOut={e => e.currentTarget.style.background = 'white'}>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{r.pname}</div>
                                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{r.pgender} · ID: {r.patient_display_id || '—'}</div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Microscope size={14} color="#64748b" /> {r.test_name}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px', fontSize: '0.875rem', color: '#475569' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <User size={13} color="#94a3b8" /> {r.technician_name || 'Unknown'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#64748b' }}>
                                            <Calendar size={13} /> {new Date(r.created_at).toLocaleString()}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{ background: r.verified === 1 ? '#ecfdf5' : '#fef3c7', color: r.verified === 1 ? '#059669' : '#b45309', padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                                            {r.verified === 1 ? '✓ Verified' : 'Pending Review'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => setSelected(r)} style={{ padding: '6px 14px', borderRadius: 8, background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Eye size={13} /> View
                                            </button>
                                            <button onClick={() => handlePrint(r)} style={{ padding: '6px 14px', borderRadius: 8, background: '#f0fdf4', color: '#059669', border: '1px solid #86efac', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Download size={13} /> Print
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length > 0 && (
                        <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#64748b' }}>
                            {filtered.length} results in archive
                        </div>
                    )}
                </div>

                {/* Result Detail Modal - Professional Medical Report Style */}
                {selected && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                        <div style={{ 
                            background: 'white', borderRadius: 24, width: 640, maxHeight: '90vh', overflowY: 'auto', 
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0',
                            position: 'relative', display: 'flex', flexDirection: 'column'
                        }}>
                            {/* Colorful Header Accent */}
                            <div style={{ height: 8, background: 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: '24px 24px 0 0' }}></div>
                            
                            <div style={{ padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                        <div style={{ background: '#eff6ff', padding: 8, borderRadius: 12 }}>
                                            <Microscope size={24} color="#3b82f6" />
                                        </div>
                                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>MEDICAL REPORT</h2>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FileText size={14} /> Official Laboratory Result · Case #{selected.id?.toString().padStart(6, '0')}
                                    </div>
                                </div>
                                <button onClick={() => setSelected(null)} style={{ background: '#f1f5f9', border: 'none', padding: 8, borderRadius: 12, cursor: 'pointer', color: '#64748b', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}><X size={20} /></button>
                            </div>

                            <div style={{ padding: '0 40px 40px' }}>
                                {/* Receipt-style Patient Header */}
                                <div style={{ 
                                    background: '#f8fafc', padding: 24, borderRadius: 20, marginBottom: 32,
                                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px',
                                    border: '1px solid #f1f5f9'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, marginBottom: 4, letterSpacing: '0.5px' }}>PATIENT NAME</div>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>{selected.pname}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{selected.pgender} · ID: {selected.patient_display_id || '—'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, marginBottom: 4, letterSpacing: '0.5px' }}>ORDER DETAILS</div>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{selected.test_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>Authorized by {selected.technician_name || 'Lab Staff'}</div>
                                    </div>
                                    <div style={{ gridColumn: 'span 2', paddingTop: 16, borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, marginBottom: 2 }}>DATE SAMPLED</div>
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{new Date(selected.created_at).toLocaleDateString()}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, marginBottom: 2 }}>STATUS</div>
                                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#10b981' }}>✓ VALIDATED</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Results Section */}
                                <div style={{ marginBottom: 32 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                        <div style={{ flex: 1, height: 1, background: '#f1f5f9' }}></div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Clinical Findings</span>
                                        <div style={{ flex: 1, height: 1, background: '#f1f5f9' }}></div>
                                    </div>

                                    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead style={{ background: '#f8fafc' }}>
                                                <tr>
                                                    <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Parameter</th>
                                                    <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Value / Flag</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(parseResults(selected.results)).map(([k, v], i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                        <td style={{ padding: '16px 20px', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>{k}</td>
                                                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                                            {typeof v === 'object' && v !== null ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                                                                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: v.status && v.status !== 'Normal' ? '#ef4444' : '#1e293b' }}>
                                                                        {v.value}
                                                                    </span>
                                                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{v.unit || ''}</span>
                                                                    {v.status && v.status !== 'Normal' && (
                                                                        <span style={{ 
                                                                            padding: '4px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 800,
                                                                            background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2'
                                                                        }}>
                                                                            {v.status}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span style={{ fontWeight: 800, color: '#1e293b' }}>{String(v)}</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {selected.notes && (
                                    <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 16, padding: '20px', marginBottom: 32 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.8rem', color: '#92400e', marginBottom: 8, textTransform: 'uppercase' }}>
                                            <AlertCircle size={14} /> Technician Comments
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#78350f', lineHeight: 1.6 }}>{selected.notes}</div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button 
                                        onClick={() => handlePrint(selected)} 
                                        style={{ 
                                            flex: 2, padding: '16px', borderRadius: 16, 
                                            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
                                            color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                            boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.2)'
                                        }}
                                    >
                                        <Download size={20} /> DOWNLOAD OFFICIAL REPORT
                                    </button>
                                    <button 
                                        onClick={() => setSelected(null)} 
                                        style={{ 
                                            flex: 1, padding: '16px', borderRadius: 16, 
                                            background: '#f1f5f9', color: '#475569', 
                                            border: 'none', fontWeight: 700, cursor: 'pointer',
                                            transition: '0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                                    >
                                        CLOSE
                                    </button>
                                </div>
                            </div>
                            
                            {/* Footer Accent */}
                            <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '0 0 24px 24px', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                                This is a computer-generated report and remains valid without a physical signature.
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}
