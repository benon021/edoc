// =============================================================
// FILE: LabWorkbench.jsx
// PURPOSE: React component for the Laboratory Analysis Workbench.
//          Handles specimen processing, result entry, and reporting.
//          Uses schema-compliant queries and joins.
// =============================================================
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import { Microscope, Search, Droplets, Activity, FileText, CheckCircle, AlertTriangle, Send, X, Clock, User, Loader } from 'lucide-react';
import NotificationCenter from '../../components/NotificationCenter';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const RESULT_TEMPLATES = {
    'Full Blood Count': [
        { field: 'Haemoglobin (Hb)', unit: 'g/dL', ref: '12.0 – 17.5' },
        { field: 'WBC Count', unit: 'x10³/µL', ref: '4.0 – 11.0' },
        { field: 'Platelets', unit: 'x10³/µL', ref: '150 – 400' },
        { field: 'PCV/Haematocrit', unit: '%', ref: '36 – 52' },
        { field: 'MCV', unit: 'fL', ref: '80 – 100' },
    ],
    'Lipid Profile': [
        { field: 'Total Cholesterol', unit: 'mg/dL', ref: '< 200' },
        { field: 'LDL Cholesterol', unit: 'mg/dL', ref: '< 130' },
        { field: 'HDL Cholesterol', unit: 'mg/dL', ref: '> 40' },
        { field: 'Triglycerides', unit: 'mg/dL', ref: '< 150' },
    ],
    'Urinalysis': [
        { field: 'Appearance', unit: '', ref: 'Clear' },
        { field: 'pH', unit: '', ref: '4.5 – 8.0' },
        { field: 'Protein', unit: '', ref: 'Negative' },
        { field: 'Glucose', unit: '', ref: 'Negative' },
        { field: 'Blood', unit: '', ref: 'Negative' },
        { field: 'Leucocytes', unit: '/HPF', ref: '0 – 5' },
    ],
    'Blood Sugar (FBS)': [
        { field: 'Fasting Blood Sugar', unit: 'mg/dL', ref: '70 – 100' },
    ],
    'Liver Function Test': [
        { field: 'ALT (SGPT)', unit: 'U/L', ref: '7 – 56' },
        { field: 'AST (SGOT)', unit: 'U/L', ref: '10 – 40' },
        { field: 'ALP', unit: 'U/L', ref: '44 – 147' },
        { field: 'Total Bilirubin', unit: 'mg/dL', ref: '0.2 – 1.2' },
        { field: 'Albumin', unit: 'g/dL', ref: '3.5 – 5.0' },
    ],
    'Renal Function Test': [
        { field: 'Serum Creatinine', unit: 'mg/dL', ref: '0.6 – 1.2' },
        { field: 'BUN', unit: 'mg/dL', ref: '7 – 20' },
        { field: 'Uric Acid', unit: 'mg/dL', ref: '2.4 – 7.0' },
        { field: 'eGFR', unit: 'mL/min', ref: '> 60' },
    ],
};

const getDefaultFields = (testType, catalog = []) => {
    const catalogTest = catalog.find(t => t.test_name.toLowerCase() === testType.toLowerCase());
    if (catalogTest && catalogTest.ref_ranges) {
        try {
            const fields = JSON.parse(catalogTest.ref_ranges);
            if (Array.isArray(fields)) return fields;
        } catch (e) {
            console.error("Failed to parse ref_ranges for", testType, e);
        }
    }
    for (const key of Object.keys(RESULT_TEMPLATES)) {
        if (testType && testType.toLowerCase().includes(key.toLowerCase())) return RESULT_TEMPLATES[key];
    }
    return [{ field: 'Result', unit: '', ref: 'As per reference' }, { field: 'Interpretation', unit: '', ref: '' }];
};

const getStatusStyle = (status) => {
    switch (status) {
        case 'pending': return { background: '#fef3c7', color: '#b45309' };
        case 'sample_collected': return { background: '#e0f2fe', color: '#0369a1' };
        case 'sample_rejected': return { background: '#fef2f2', color: '#ef4444' };
        case 'completed': return { background: '#ecfdf5', color: '#059669' };
        default: return { background: '#f1f5f9', color: '#475569' };
    }
};

const statusLabel = (s) => {
    const map = { pending: 'Pending', sample_collected: 'Sample Collected', sample_rejected: 'Sample Rejected', completed: 'Completed' };
    return map[s] || s;
};

export default function LabWorkbench() {
    const { profile } = useAuth();
    const [requests, setRequests] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [panelOpen, setPanelOpen] = useState(false);
    const [resultValues, setResultValues] = useState({});
    const [notes, setNotes] = useState('');
    const [verified, setVerified] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [technicians, setTechnicians] = useState([]);
    const [selectedTech, setSelectedTech] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            // Pruned select to only existing columns
            // 1. Fetch raw lab requests
            const { data: rawData, error: labError } = await supabase
                .from('lab_requests')
                .select('id, test_name, status, created_at, appointment_id, technician_id')
                .neq('status', 'completed')
                .order('created_at', { ascending: false });

            if (labError) throw labError;

            // 2. Fetch related details manually
            const appoids = [...new Set((rawData || []).map(r => r.appointment_id).filter(Boolean))];
            let appos = [];
            if (appoids.length > 0) {
                const { data: appoData, error: appoError } = await supabase
                    .from('appointment')
                    .select(`
                        appoid, 
                        appodate,
                        patient:pid(pid, pname, ptel, pdob, pgender),
                        doctor:docid(docname, docemail)
                    `)
                    .in('appoid', appoids);
                if (appoError) console.warn("Appointment fetch failed", appoError);
                else appos = appoData || [];
            }

            // 3. Fetch technicians manually for mapping
            const { data: techData } = await supabase
                .from('lab_technician')
                .select('labid, labname');
            const techMap = (techData || []).reduce((acc, t) => {
                acc[t.labid] = t.labname;
                return acc;
            }, {});

            const mapped = (rawData || []).map(r => {
                const appo = appos.find(a => a.appoid === r.appointment_id);
                return {
                    ...r,
                    appointment: appo,
                    patient_id: appo?.patient?.pid,
                    pname: appo?.patient?.pname || 'Unknown',
                    pgender: appo?.patient?.pgender || 'Unknown',
                    ptel: appo?.patient?.ptel || '',
                    pdob: appo?.patient?.pdob || '',
                    docname: appo?.doctor?.docname || 'Clinical Staff',
                    docemail: appo?.doctor?.docemail || '',
                    consultation_date: appo?.appodate || '',
                    assigned_tech_name: techMap[r.technician_id] || null
                };
            });
            
            setRequests(mapped);
        } catch (e) {
            console.error("Fetch requests error:", e);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCatalog = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('lab_catalog').select('*').order('category').order('test_name');
            if (error) throw error;
            setCatalog(data || []);
        } catch (e) { console.error("Catalog fetch failed", e); }
    }, []);

    const fetchTechnicians = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('lab_technician').select('labid, labname, labemail');
            if (error) throw error;
            setTechnicians(data || []);
            // Try to find the tech record matching the current user's email if possible
            if (profile?.email) {
                const myTech = data?.find(t => t.labemail === profile.email);
                if (myTech) setSelectedTech(myTech.labid);
            }
        } catch (e) { console.error("Technicians fetch failed", e); }
    }, [profile]);

    useEffect(() => { 
        fetchRequests(); 
        fetchCatalog();
        fetchTechnicians();
    }, [fetchRequests, fetchCatalog, fetchTechnicians]);

    const filtered = requests.filter(r => {
        const matchesFilter =
            filter === 'All' ||
            (filter === 'Collected' && r.status === 'sample_collected') ||
            (filter === 'Pending' && r.status === 'pending');
        const matchesSearch = !search || r.pname?.toLowerCase().includes(search.toLowerCase()) || r.test_name?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const counts = {
        pending: requests.filter(r => r.status === 'pending').length,
        collected: requests.filter(r => r.status === 'sample_collected').length,
    };

    const openPanel = (req) => {
        setSelected(req);
        const fields = getDefaultFields(req.test_name, catalog);
        const init = {};
        fields.forEach(f => {
            init[f.field] = { 
                value: '', 
                unit: f.unit || '', 
                ref: f.ref || '', 
                status: 'Normal' 
            };
        });
        setResultValues(init);
        setNotes('');
        setVerified(false);
        
        // Auto-select technician: Assigned > Logged In > First in list
        if (req.technician_id) {
            setSelectedTech(req.technician_id);
        } else if (profile?.email) {
            const myTech = technicians.find(t => t.labemail === profile.email);
            if (myTech) setSelectedTech(myTech.labid);
            else setSelectedTech(technicians[0]?.labid || null);
        } else {
            setSelectedTech(technicians[0]?.labid || null);
        }
        
        setPanelOpen(true);
    };

    const handleCollect = async (id) => {
        try {
            const { error } = await supabase.from('lab_requests').update({ status: 'sample_collected' }).eq('id', id);
            if (error) throw error;
            showToast('Sample marked as collected');
            fetchRequests();
        } catch (e) {
            showToast('Failed to mark sample as collected', 'error');
        }
    };

    const handleFinalize = async () => {
        if (!verified) return showToast('Please verify the results before finalizing', 'error');
        setSubmitting(true);
        try {
            // INSERT FIRST! If this fails, the request won't disappear
            const { error: insertError } = await supabase.from('lab_reports').insert({
                request_id: selected.id,
                patient_id: Number(selected.patient_id),
                test_name: selected.test_name,
                results: JSON.stringify(resultValues),
                notes: notes,
                technician_id: Number(selectedTech) || profile?.id || null
            });
            if (insertError) throw insertError;

            // UPDATE SECOND
            const { error: updateError } = await supabase.from('lab_requests').update({ status: 'completed' }).eq('id', selected.id);
            if (updateError) throw updateError;
            
            if (selected.docemail) {
                await supabase.from('notifications').insert({
                    userid: selected.docemail,
                    title: `Lab Result Ready: ${selected.test_name}`,
                    message: `Results for patient ${selected.pname} are now available for review.`,
                    type: 'lab',
                    is_read: 0
                });
            }
            
            showToast('Results finalized & doctor notified ✓');
            setPanelOpen(false);
            fetchRequests();
        } catch (e) {
            console.error('[handleFinalize] Error:', e);
            showToast(`Submission failed: ${e.message || 'Check console'}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const fields = selected ? getDefaultFields(selected.test_name, catalog) : [];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
            <Sidebar userType="l" />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {toast && (
                    <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : '#10b981', color: 'white', padding: '12px 24px', borderRadius: 12, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                        {toast.msg}
                    </div>
                )}

                <header style={{ background: 'white', padding: '20px 40px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Microscope size={26} color="#2563eb" /> Lab Workbench
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 2 }}>Central hub for active test processing</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient or test..." style={{ padding: '8px 12px 8px 32px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', width: 220 }} />
                        </div>
                        <NotificationCenter />
                    </div>
                </header>

                <div style={{ padding: '28px 40px', flex: 1, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
                        {[
                            { label: 'Pending Orders', key: 'Pending', count: counts.pending, color: '#f59e0b', bg: '#fffbeb', icon: Clock },
                            { label: 'Samples Collected', key: 'Collected', count: counts.collected, color: '#3b82f6', bg: '#eff6ff', icon: Droplets },
                        ].map(s => (
                            <div key={s.key} onClick={() => setFilter(filter === s.key ? 'All' : s.key)}
                                style={{ background: 'white', padding: '14px 20px', borderRadius: 12, border: filter === s.key ? `2px solid ${s.color}` : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14, flex: 1, cursor: 'pointer', transition: 'all 0.2s', transform: filter === s.key ? 'translateY(-2px)' : 'none', boxShadow: filter === s.key ? `0 4px 12px ${s.color}22` : 'none' }}>
                                <div style={{ background: s.bg, padding: 10, borderRadius: 10 }}><s.icon size={18} color={s.color} /></div>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{s.count}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    {['Patient', 'Test Requested', 'Status', 'Doctor', 'Action'].map(h => (
                                        <th key={h} style={{ textAlign: h === 'Action' ? 'right' : 'left', padding: '14px 20px', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 64, color: '#94a3b8' }}><Loader size={24} style={{ animation: 'spin 1s linear infinite' }} /></td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 64, color: '#94a3b8' }}>No active requests found</td></tr>
                                ) : filtered.map(req => (
                                    <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: '0.15s' }}
                                        onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseOut={e => e.currentTarget.style.background = 'white'}
                                        onClick={() => openPanel(req)}>
                                        <td style={{ padding: '18px 20px' }}>
                                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{req.pname}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>PID: {req.patient_id}</div>
                                            {req.assigned_tech_name && (
                                                <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 800, marginTop: 4 }}>
                                                    👤 {req.assigned_tech_name.toUpperCase()}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '18px 20px' }}>
                                            <div style={{ fontWeight: 500 }}>{req.test_name}</div>
                                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Req #{req.id}</div>
                                        </td>
                                        <td style={{ padding: '18px 20px' }}>
                                            <span style={{ ...getStatusStyle(req.status), padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>
                                                {statusLabel(req.status)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '18px 20px', fontSize: '0.85rem' }}>Dr. {req.docname}</td>
                                        <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                                            <button onClick={e => { e.stopPropagation(); openPanel(req); }}
                                                style={{ background: '#2563eb', color: 'white', border: 'none', padding: '7px 16px', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                                                Process
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {panelOpen && selected && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }} onClick={() => setPanelOpen(false)} />
                        <div style={{ width: 520, height: '100vh', background: 'white', boxShadow: '-10px 0 40px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                            <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Process Test</h2>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>ID: #LR-{selected.id} · {selected.test_name}</p>
                                </div>
                                <button onClick={() => setPanelOpen(false)} style={{ background: '#e2e8f0', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}><X size={16} /></button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                                <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', color: 'white', padding: 20, borderRadius: 12, marginBottom: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                        <div style={{ background: 'rgba(255,255,255,0.15)', padding: 8, borderRadius: 8 }}><User size={18} /></div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selected.pname}</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>{selected.pgender}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>
                                        Ordered by: Dr. {selected.docname}
                                    </div>
                                </div>

                                <section style={{ marginBottom: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 12, fontSize: '0.9rem' }}>
                                        <Droplets size={16} color="#d946ef" /> 1. Sample Status
                                    </div>
                                    {selected.status === 'sample_collected' ? (
                                        <div style={{ background: '#ecfdf5', border: '1px solid #86efac', borderRadius: 10, padding: '12px 16px', color: '#166534', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <CheckCircle size={16} /> Sample ready for analysis
                                        </div>
                                    ) : (
                                        <button onClick={() => handleCollect(selected.id)}
                                            style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #3b82f6', color: '#2563eb', background: '#eff6ff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                                            Mark Sample as Collected
                                        </button>
                                    )}
                                </section>

                                <section style={{ marginBottom: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 12, fontSize: '0.9rem' }}>
                                        <FileText size={16} color="#3b82f6" /> 2. Enter Findings
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {fields.map(f => (
                                            <div key={f.field} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{f.field}</label>
                                                    {f.ref && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Ref: {f.ref}</span>}
                                                </div>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <input 
                                                        value={resultValues[f.field]?.value || ''} 
                                                        onChange={e => setResultValues(v => ({ ...v, [f.field]: { ...v[f.field], value: e.target.value } }))}
                                                        placeholder="Value" 
                                                        style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.88rem' }} 
                                                    />
                                                    <select
                                                        value={resultValues[f.field]?.status || 'Normal'}
                                                        onChange={e => setResultValues(v => ({ ...v, [f.field]: { ...v[f.field], status: e.target.value } }))}
                                                        style={{ padding: '0 8px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.8rem' }}
                                                    >
                                                        <option>Normal</option>
                                                        <option>High</option>
                                                        <option>Low</option>
                                                        <option>Reactive</option>
                                                        <option>Non-Reactive</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                        <div>
                                            <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>Observations</label>
                                            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                                                placeholder="Add notes..." style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.88rem', resize: 'none' }} />
                                        </div>
                                     </div>
                                 </section>

                                 <section style={{ marginBottom: 24 }}>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 12, fontSize: '0.9rem', marginTop: 20 }}>
                                         <CheckCircle size={16} color="#10b981" /> 3. Authorization & Technician
                                     </div>
                                     <div style={{ marginBottom: 16 }}>
                                         <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>Performing Technician</label>
                                         <select 
                                             value={selectedTech || ''} 
                                             onChange={e => setSelectedTech(e.target.value)}
                                             style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                                         >
                                             <option value="">Select Technician...</option>
                                             {technicians.map(t => (
                                                <option key={t.labid} value={t.labid}>{t.labname}</option>
                                            ))}
                                         </select>
                                     </div>
                                     <label style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 16px', cursor: 'pointer' }}>
                                         <input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} style={{ width: 18, height: 18 }} />
                                         <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#166534' }}>Certify and Release Results</span>
                                     </label>
                                 </section>
                            </div>

                            <div style={{ padding: '20px 28px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
                                <button onClick={handleFinalize} disabled={submitting || !verified}
                                    style={{ width: '100%', padding: '14px', borderRadius: 12, background: verified ? '#2563eb' : '#e2e8f0', color: verified ? 'white' : '#94a3b8', border: 'none', fontWeight: 700, cursor: verified ? 'pointer' : 'not-allowed' }}>
                                    {submitting ? 'Submitting...' : 'Finalize & Notify Doctor'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
