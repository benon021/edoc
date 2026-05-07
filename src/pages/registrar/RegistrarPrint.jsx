// =============================================================
// FILE: RegistrarPrint.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Calendar, Search, Users, Clock, Printer } from 'lucide-react';
import './RegistrarPrint.css';

const RegistrarPrint = () => {
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('forms');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [historyData, setHistoryData] = useState(null);
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('patient')
                .select('*')
                .order('pname', { ascending: true });
            if (error) throw error;
            setPatients(data || []);
        } catch (err) {
            console.error('Error fetching patients', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (pid) => {
        try {
            setLoading(true);
            // 1. Get patient info
            const { data: patient } = await supabase
                .from('patient')
                .select('*')
                .eq('pid', pid)
                .single();

            // 2. Get appointments and consultations for timeline
            const [apptRes, consultRes] = await Promise.all([
                supabase.from('appointment').select('appodate, status, doctor:docid(docname)').eq('pid', pid),
                supabase.from('consultations').select('consultation_date, clinical_impression, doctor:docid(docname)').eq('pid', pid)
            ]);

            const events = [];
            (apptRes.data || []).forEach(a => {
                events.push({
                    event_date: a.appodate,
                    type: 'APPOINTMENT',
                    provider: a.doctor?.docname || 'Staff',
                    detail: `Status: ${a.status}`
                });
            });
            (consultRes.data || []).forEach(c => {
                events.push({
                    event_date: new Date(c.consultation_date).toISOString().split('T')[0],
                    type: 'CONSULTATION',
                    provider: c.doctor?.docname || 'Staff',
                    detail: c.clinical_impression || 'Clinical visit'
                });
            });

            setHistoryData({
                patient,
                events: events.sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
            });
            setActiveTab('history');
        } catch (err) {
            console.error('Error fetching history', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = (patient) => {
        setSelectedPatient(patient);
        setTimeout(() => window.print(), 800);
    };

    const filtered = (patients || []).filter(p =>
        p.pname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patient_display_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '40px 56px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
                {/* Header */}
                <header className="no-print" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.04em', margin: 0 }}>
                            Clinical <span style={{ color: '#0891b2' }}>Archives</span> &amp; Forms
                        </h1>
                        <p style={{ color: '#475569', fontSize: '16px', marginTop: '6px', fontWeight: '600' }}>
                            Professional Registry Terminal • Institutional Grade Printing
                        </p>
                    </div>
                    <div style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1px solid white', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 15px #06b6d4' }} />
                        <span style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', letterSpacing: '0.05em' }}>ARCHIVE SERVER ONLINE</span>
                    </div>
                </header>

                {/* Action Hub */}
                <div className="no-print" style={{ background: 'white', padding: '30px', borderRadius: '30px', marginBottom: '40px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '24px' }}>
                        {['forms', 'reports'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '14px 28px', borderRadius: '14px', border: 'none', background: activeTab === tab ? '#0891b2' : '#f8fafc', color: activeTab === tab ? 'white' : '#64748b', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {tab === 'forms' ? <FileText size={18} /> : <Calendar size={18} />}
                                {tab === 'forms' ? 'Registry Dossiers' : 'Daily Archives'}
                            </button>
                        ))}
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search color="#0891b2" size={22} style={{ position: 'absolute', left: '22px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="Search by Name or Patient ID..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '18px 20px 18px 60px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}
                        />
                    </div>
                </div>

                {/* Patient Grid */}
                {activeTab === 'forms' && (
                    <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                        {filtered.length === 0 && (
                            <p style={{ color: '#94a3b8', fontWeight: '600', gridColumn: '1/-1', textAlign: 'center', padding: '60px' }}>No patients found.</p>
                        )}
                        {filtered.map(p => (
                            <div key={p.pid} style={{ background: 'white', padding: '28px', borderRadius: '24px', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '5px', height: '100%', background: '#06b6d4' }} />
                                <span style={{ fontSize: '11px', fontWeight: '900', color: '#0891b2', background: '#ecfeff', padding: '4px 10px', borderRadius: '6px' }}>{p.patient_display_id}</span>
                                <h3 style={{ fontSize: '19px', fontWeight: '900', color: '#0f172a', margin: '10px 0 4px' }}>{p.pname}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>
                                    <Users size={13} /> {p.pgender} • {p.pbloodgroup || 'Group TBD'}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => fetchHistory(p.pid)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0891b2', cursor: 'pointer', fontWeight: '800', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <Clock size={15} /> ARCHIVE
                                    </button>
                                    <button onClick={() => handlePrint(p)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: '#0f172a', color: 'white', cursor: 'pointer', fontWeight: '800', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <Printer size={15} /> PRINT
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── PRINTABLE: PAGE 1 & 2 ── */}
                {selectedPatient && (
                    <div className="print-only" style={{ display: 'none' }}>
                        {/* PAGE 1 */}
                        <div style={{ padding: '40px 60px', background: 'white', minHeight: '1050px', fontFamily: 'Inter,sans-serif', pageBreakAfter: 'always' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '40px' }}>
                                <div style={{ width: '140px', height: '140px', borderRadius: '24px', background: 'linear-gradient(135deg,#06b6d4,#10b981)', padding: '6px', flexShrink: 0 }}>
                                    <div style={{ width: '100%', height: '100%', borderRadius: '18px', background: 'white', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {selectedPatient.pphoto
                                            ? <img src={selectedPatient.pphoto} alt="Patient" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <Users size={55} color="#94a3b8" />}
                                    </div>
                                </div>
                                <div>
                                    <h1 style={{ fontSize: '38px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Patient Enrollment</h1>
                                    <p style={{ color: '#64748b', margin: '4px 0' }}>Part 1 of 2 — Primary Identity &amp; Physiological Baseline</p>
                                    <div style={{ marginTop: '10px', padding: '6px 14px', background: '#f1f5f9', borderRadius: '8px', display: 'inline-block', fontSize: '13px', fontWeight: '800', color: '#0891b2' }}>
                                        SYSTEM ID: {selectedPatient.patient_display_id}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '50px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '900', borderBottom: '3px solid #0891b2', paddingBottom: '8px', marginBottom: '24px', color: '#1e293b', textTransform: 'uppercase' }}>1. Basic Identity &amp; Residency</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div><label style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8' }}>FIRST NAME</label><div style={{ fontSize: '17px', fontWeight: '700', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>{selectedPatient.pname?.split(' ')[0] || '____________________'}</div></div>
                                    <div><label style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8' }}>LAST NAME</label><div style={{ fontSize: '17px', fontWeight: '700', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>{selectedPatient.pname?.split(' ').slice(1).join(' ') || '____________________'}</div></div>
                                    <div><label style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8' }}>DATE OF BIRTH</label><div style={{ fontSize: '17px', fontWeight: '700', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>{selectedPatient.pdob || '____ / ____ / ____'}</div></div>
                                    <div><label style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8' }}>GENDER</label><div style={{ fontSize: '17px', fontWeight: '700', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>{selectedPatient.pgender || '__________'}</div></div>
                                    <div><label style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8' }}>PHONE</label><div style={{ fontSize: '17px', fontWeight: '700', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>{selectedPatient.ptel || '__________________'}</div></div>
                                    <div><label style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8' }}>EMAIL</label><div style={{ fontSize: '17px', fontWeight: '700', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>{selectedPatient.pemail || '__________________'}</div></div>
                                    <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8' }}>PHYSICAL ADDRESS</label><div style={{ fontSize: '15px', fontWeight: '700', padding: '8px 0', borderBottom: '1px solid #e2e8f0', minHeight: '36px' }}>{selectedPatient.paddress || '________________________________________________________________________'}</div></div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '40px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '900', borderBottom: '3px solid #0891b2', paddingBottom: '8px', marginBottom: '24px', color: '#1e293b', textTransform: 'uppercase' }}>2. Physiological Baseline (Initial Vitals)</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
                                    {[
                                        { label: 'TEMPERATURE', value: selectedPatient.ptemp ? `${selectedPatient.ptemp}°C` : '--°C' },
                                        { label: 'BLOOD PRESSURE', value: selectedPatient.pbp || '--/--' },
                                        { label: 'WEIGHT', value: selectedPatient.pweight ? `${selectedPatient.pweight} KG` : '-- KG' },
                                        { label: 'HEIGHT', value: selectedPatient.pheight ? `${selectedPatient.pheight} CM` : '-- CM' },
                                    ].map(v => (
                                        <div key={v.label} style={{ padding: '20px', background: '#f0f9ff', borderRadius: '16px', border: '1px solid #bae6fd', textAlign: 'center' }}>
                                            <div style={{ fontSize: '9px', fontWeight: '900', color: '#0369a1' }}>{v.label}</div>
                                            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0c4a6e', marginTop: '8px' }}>{v.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', fontSize: '11px', color: '#cbd5e1', marginTop: '40px' }}>
                                Clinical record for {selectedPatient.pname} — Page 1 of 2
                            </div>
                        </div>

                        {/* PAGE 2 */}
                        <div style={{ padding: '40px 60px', background: 'white', minHeight: '1050px', fontFamily: 'Inter,sans-serif' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '4px solid #1e293b', paddingBottom: '16px', marginBottom: '36px' }}>
                                <div>
                                    <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#1e293b', margin: 0 }}>PART 2: CLINICAL DEPTH &amp; ADMIN</h2>
                                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0' }}>REF: {selectedPatient.patient_display_id}</p>
                                </div>
                            </div>
                            <div style={{ marginBottom: '36px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '900', borderBottom: '3px solid #0891b2', paddingBottom: '8px', marginBottom: '20px', color: '#1e293b', textTransform: 'uppercase' }}>3. Clinical Summary</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                                    <div style={{ padding: '18px', background: '#f0fdf4', borderRadius: '14px', border: '1px solid #bbf7d0' }}>
                                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#166534' }}>BLOOD GROUP</div>
                                        <div style={{ fontSize: '28px', fontWeight: '900', color: '#14532d', marginTop: '8px' }}>{selectedPatient.pbloodgroup || '____'}</div>
                                    </div>
                                    <div style={{ padding: '18px', background: '#fef2f2', borderRadius: '14px', border: '1px solid #fecaca' }}>
                                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#991b1b' }}>IDENTIFIED ALLERGIES</div>
                                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#7f1d1d', marginTop: '8px' }}>{selectedPatient.pallergies || 'NONE DISCLOSED'}</div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginBottom: '36px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '900', borderBottom: '3px solid #0891b2', paddingBottom: '8px', marginBottom: '20px', color: '#1e293b', textTransform: 'uppercase' }}>4. History &amp; Chronic Observations</h3>
                                <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', minHeight: '100px', fontSize: '14px', lineHeight: '1.8', color: '#1e293b' }}>
                                    {selectedPatient.pconditions || '_________________________________________________________________________________________________________________________________________________'}
                                </div>
                            </div>
                            <div style={{ marginBottom: '36px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '900', borderBottom: '3px solid #0891b2', paddingBottom: '8px', marginBottom: '20px', color: '#1e293b', textTransform: 'uppercase' }}>5. Admin &amp; Emergency Security</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div style={{ padding: '18px', background: '#f5f3ff', borderRadius: '12px', border: '1px solid #ddd6fe' }}>
                                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#5b21b6', marginBottom: '10px' }}>PAYMENT &amp; COVERAGE</div>
                                        <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>Method:</strong> {selectedPatient.ppayment || '____________'}</p>
                                        <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>Provider:</strong> {selectedPatient.pinsurance_provider || '____________'}</p>
                                        <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>Policy #:</strong> {selectedPatient.pinsurance_number || '____________'}</p>
                                    </div>
                                    <div style={{ padding: '18px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a' }}>
                                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#b45309', marginBottom: '10px' }}>NEXT OF KIN</div>
                                        <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>Name:</strong> {selectedPatient.pemergency_name || '____________'}</p>
                                        <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>Phone:</strong> {selectedPatient.pemergency_phone || '____________'}</p>
                                        <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>Relation:</strong> {selectedPatient.pemergency_relation || '____________'}</p>
                                    </div>
                                </div>
                            </div>
                            <div style={{ borderTop: '4px solid #1e293b', paddingTop: '30px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', marginTop: '40px' }}>
                                <div>
                                    <h4 style={{ fontWeight: '900', marginBottom: '10px' }}>Official Clinical Declaration</h4>
                                    <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>This electronic record constitutes an official medical document of EDOC Medical Hub. Certified accurate per clinical intake protocols.</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ height: '50px' }} />
                                    <div style={{ borderTop: '2px solid #1e293b', paddingTop: '8px', fontSize: '12px', fontWeight: '700' }}>Registrar: {profile?.regname || profile?.docname || 'ADMINISTRATOR'}</div>
                                    <div style={{ borderTop: '1px solid #94a3b8', marginTop: '30px', paddingTop: '8px', fontSize: '12px', fontWeight: '700' }}>INSTITUTIONAL STAMP</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', fontSize: '11px', color: '#cbd5e1', marginTop: '30px' }}>
                                REF: {selectedPatient.patient_display_id} — Page 2 of 2
                            </div>
                        </div>
                    </div>
                )}

                {/* MASTER ARCHIVE (History Print) */}
                {historyData && (
                    <div className="print-only" style={{ display: 'none' }}>
                        <div style={{ padding: '60px', background: 'white' }}>
                            <div style={{ borderBottom: '4px solid #000', paddingBottom: '16px', marginBottom: '30px', textAlign: 'center' }}>
                                <h1 style={{ fontSize: '30px', fontWeight: '900', margin: 0 }}>PATIENT MASTER CASE FILE</h1>
                                <p style={{ fontWeight: '600', color: '#333' }}>Longitudinal Clinical Record</p>
                            </div>
                            <div style={{ display: 'flex', gap: '30px', marginBottom: '36px', padding: '20px', border: '2px solid #000' }}>
                                <div style={{ width: '110px', height: '130px', border: '1px solid #000', overflow: 'hidden', flexShrink: 0 }}>
                                    {historyData.patient?.pphoto && <img src={historyData.patient.pphoto} alt="P" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '22px', fontWeight: '900' }}>{historyData.patient?.pname}</h2>
                                    <p>ID: {historyData.patient?.patient_display_id}</p>
                                    <p>DOB: {historyData.patient?.pdob} &nbsp;|&nbsp; Gender: {historyData.patient?.pgender}</p>
                                    <p>Phone: {historyData.patient?.ptel}</p>
                                </div>
                            </div>
                            <h3 style={{ background: '#000', color: '#fff', padding: '10px 20px', marginBottom: '20px' }}>CLINICAL EVENT TIMELINE</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #000' }}>
                                        <th style={{ textAlign: 'left', padding: '10px' }}>Date</th>
                                        <th style={{ textAlign: 'left', padding: '10px' }}>Type</th>
                                        <th style={{ textAlign: 'left', padding: '10px' }}>Provider</th>
                                        <th style={{ textAlign: 'left', padding: '10px' }}>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyData.events?.map((e, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                                            <td style={{ padding: '10px' }}>{e.event_date}</td>
                                            <td style={{ padding: '10px', fontWeight: '800', textTransform: 'uppercase' }}>{e.type}</td>
                                            <td style={{ padding: '10px' }}>{e.provider}</td>
                                            <td style={{ padding: '10px' }}>{e.detail}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{ marginTop: '60px', borderTop: '2px solid #000', paddingTop: '16px', textAlign: 'center', fontSize: '12px' }}>
                                Generated by EDOC Clinical System — {new Date().toLocaleString()}
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default RegistrarPrint;
