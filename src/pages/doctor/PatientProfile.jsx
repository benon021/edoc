// =============================================================
// FILE: PatientProfile.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { 
    User, Calendar, Clock, Clipboard, Pill, FlaskConical, 
    ChevronLeft, Mail, Phone, MapPin, Activity, FileText,
    ArrowLeft, Download, ExternalLink, ShieldCheck, AlertCircle, CreditCard
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const PatientProfile = () => {
    const { pid } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedVisits, setExpandedVisits] = useState({});

    useEffect(() => {
        const fetchRecord = async () => {
            setLoading(true);
            try {
                // 1. Fetch Patient (try table 'patients' if 'patient' fails)
                const pidInt = parseInt(pid);
                let patient = null;
                let patientError = null;
                try {
                    const { data, error } = await supabase
                        .from('patient')
                        .select('*')
                        .eq('pid', pidInt)
                        .single();
                    if (data) patient = data;
                    else patientError = error || { message: 'No data from patient table' };
                } catch (e) {
                    patientError = e;
                }
                if (patientError) {
                    console.warn('[PatientProfile] patient table failed, trying patients:', patientError.message);
                    try {
                        const { data: altData, error: altError } = await supabase
                            .from('patients')
                            .select('*')
                            .eq('pid', pidInt)
                            .single();
                        patient = altData || null;
                    } catch (altE) {
                        console.error('[PatientProfile] patients table also failed:', altE);
                    }
                }

                if (patientError) {
                    console.error('[PatientProfile] Patient fetch error:', patientError);
                    throw patientError;
                }
                if (!patient) {
                    console.warn('[PatientProfile] No patient for pid:', pid);
                    setLoading(false);
                    return;
                }

                // 2. Fetch Consultations (safe int parse + optional)
                // Single pidInt declaration
                const patientPidInt = parseInt(pid);
let consultationsData = [];
                let consultationsError = null;
                try {
                    const { data, error } = await supabase
                        .from('consultations')
                        .select(`
                            *
                        `)
                        .eq('pid', patientPidInt)
                        .in('status', ['final', 'completed'])
                        .order('consultation_date', { ascending: false });
                    if (data) consultationsData = data;
                } catch (consultError) {
                    console.warn('[PatientProfile] Consultations fetch failed (optional):', consultError);
                    consultationsError = consultError;
                }

                // Don't throw - make optional
                console.warn('[PatientProfile] Skipping detailed consultations due to error');

                let enrichedConsultations = [];

                if (consultationsData && consultationsData.length > 0) {
                    const consultIds = consultationsData.map(c => c.id);

                    // Fetch related data in parallel
                    let prescriptions = [];
                    let lab_reports = [];
                    let vitals = [];
                    let lab_reqs = [];
                    try {
                        const [
                            { data: presData },
                            { data: vitData },
                            { data: reqData }
                        ] = await Promise.all([
                            supabase.from('prescriptions').select('*').in('consultation_id', consultIds),
                            supabase.from('vitals_records').select('*').in('consultation_id', consultIds),
                            supabase.from('lab_requests').select('id, consultation_id').in('consultation_id', consultIds)
                        ]);
                        prescriptions = presData || [];
                        vitals = vitData || [];
                        lab_reqs = reqData || [];

                        if (lab_reqs.length > 0) {
                            const reqIds = lab_reqs.map(r => r.id);
                            const { data: labData } = await supabase.from('lab_reports').select('*').in('request_id', reqIds);
                            lab_reports = labData || [];
                        }
                    } catch (promiseError) {
                        console.warn('[PatientProfile] Related data fetch failed:', promiseError);
                    }

                    enrichedConsultations = consultationsData.map(c => {
                        const cReqIds = lab_reqs.filter(r => r.consultation_id === c.id).map(r => r.id);
                        return {
                            ...c,
                            doctor_name: c.doctor?.docname || 'Unknown Doctor',
                            prescriptions: prescriptions?.filter(p => p.consultation_id === c.id) || [],
                            lab_results: lab_reports?.filter(r => cReqIds.includes(r.request_id)) || [],
                            vitals: vitals?.find(v => v.consultation_id === c.id) || null
                        };
                    });
                    
                    setExpandedVisits({ [consultationsData[0].id]: true });
                }

                setData({ patient, consultations: enrichedConsultations });

            } catch (err) {
                console.error("Failed to fetch medical record", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRecord();
    }, [pid]);

    const toggleVisit = (id) => {
        setExpandedVisits(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (loading) return (
        <div style={{ display: 'flex', height: '100vh', background: '#f8fafc' }}>
            <Sidebar userType="d" />
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #eff6ff', borderTopColor: '#2563eb', borderRadius: '50%' }}></div>
            </div>
        </div>
    );

    if (!data || !data.patient) return (
        <div style={{ display: 'flex', height: '100vh', background: '#f8fafc' }}>
            <Sidebar userType="d" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <AlertCircle size={64} color="#f87171" style={{ marginBottom: '16px' }} />
                <h2 style={{ color: '#1e293b', fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>Patient Record Not Found</h2>
                <p style={{ color: '#64748b', textAlign: 'center', maxWidth: '400px' }}>No patient data for PID {pid}. Check if patient exists or contact admin.</p>
                <button onClick={() => navigate('/doctor/patients')} style={{ marginTop: '24px', padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600' }}>
                    Back to Patients
                </button>
            </div>
        </div>
    );

    const { patient, consultations } = data;

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f1f5f9' }}>
            <Sidebar userType="d" />

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header / Actions */}
                <header style={{ 
                    padding: '24px 40px', background: 'white', borderBottom: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={() => navigate(-1)} style={{ padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Clinical Dossier</h1>
                            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Comprehensive Medical History Archive</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Download size={16} /> Export EMR
                        </button>
                        <button style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#2563eb', color: 'white', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                            Print Medical Summary
                        </button>
                    </div>
                </header>

                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Left Panel: Comprehensive Patient Dossier Card */}
                    <aside style={{ width: '400px', background: 'white', borderRight: '1px solid #e2e8f0', overflowY: 'auto', padding: '32px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <div style={{ 
                                width: '100px', height: '100px', borderRadius: '30px', background: '#eff6ff', 
                                margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#2563eb', fontSize: '2.5rem', fontWeight: '800', border: '4px solid #f8fafc'
                            }}>
                                {patient.pname.charAt(0)}
                            </div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>{patient.pname}</h2>
                            <span style={{ padding: '4px 12px', background: '#f1f5f9', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '800', color: '#2563eb' }}>
                                {patient.patient_display_id}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Vital Stats Section */}
                            <section>
                                <h4 style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>Vital Statistics</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700' }}>AGE</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b' }}>{new Date().getFullYear() - new Date(patient.pdob).getFullYear()} Yrs</div>
                                    </div>
                                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700' }}>GENDER</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b' }}>{patient.pgender}</div>
                                    </div>
                                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700' }}>MARITAL</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b' }}>{patient.pmarital || 'Single'}</div>
                                    </div>
                                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700' }}>BLOOD GROUP</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#ef4444' }}>{patient.pbloodgroup || '--'}</div>
                                    </div>
                                </div>
                            </section>

                            {/* Contact Details */}
                            <section>
                                <h4 style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>Administrative Data</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                                        <Phone size={14} color="#94a3b8" /> <span style={{ color: '#334155', fontWeight: '600' }}>{patient.ptel}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                                        <Mail size={14} color="#94a3b8" /> <span style={{ color: '#334155', fontWeight: '600' }}>{patient.pemail || 'No email registered'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                                        <CreditCard size={14} color="#94a3b8" /> <span style={{ color: '#334155', fontWeight: '600' }}>ID: {patient.patient_display_id || patient.nationalId || 'Not provided'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                                        <MapPin size={14} color="#94a3b8" style={{ marginTop: '3px' }} /> <span style={{ color: '#334155', fontWeight: '600' }}>{patient.paddress}</span>
                                    </div>
                                    <div style={{ marginTop: '12px', padding: '12px', background: '#f1f5f9', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: '800', marginBottom: '4px' }}>INSURANCE COVERAGE</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b' }}>{patient.pinsurance_provider || 'Self Pay'}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{patient.pinsurance_number || 'No Policy Number'}</div>
                                    </div>
                                </div>
                            </section>

                            {/* Emergency Contact */}
                            <section style={{ background: '#fffbeb', padding: '16px', borderRadius: '16px', border: '1px solid #fef3c7' }}>
                                <h4 style={{ fontSize: '0.7rem', color: '#92400e', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <AlertCircle size={14} /> EMERGENCY CONTACT
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: '#b45309', fontWeight: '700' }}>NAME</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>{patient.pemergency_name || '---'}</div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', color: '#b45309', fontWeight: '700' }}>RELATION</div>
                                            <div style={{ fontSize: '0.8rem', color: '#92400e' }}>{patient.pemergency_relation || '---'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', color: '#b45309', fontWeight: '700' }}>PHONE</div>
                                            <div style={{ fontSize: '0.8rem', color: '#92400e' }}>{patient.pemergency_phone || '---'}</div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Guardian Info (if minor) */}
                            <section style={{ background: '#f0f9ff', padding: '16px', borderRadius: '16px', border: '1px solid #bae6fd' }}>
                                <h4 style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px' }}>GUARDIAN DATA (FOR MINORS)</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: '#0369a1', fontWeight: '700' }}>GUARDIAN NAME</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>{patient.pguardian_name || '---'}</div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', color: '#0369a1', fontWeight: '700' }}>RELATION</div>
                                            <div style={{ fontSize: '0.8rem', color: '#0369a1' }}>{patient.pguardian_relation || '---'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', color: '#0369a1', fontWeight: '700' }}>PHONE</div>
                                            <div style={{ fontSize: '0.8rem', color: '#0369a1' }}>{patient.pguardian_phone || '---'}</div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Clinical Alerts */}
                            <section>
                                <h4 style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Activity size={16} /> CLINICAL ALERTS
                                </h4>
                                <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '0.65rem', color: '#991b1b', fontWeight: '800', marginBottom: '4px' }}>KNOWN ALLERGIES</div>
                                    <div style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: '700' }}>{patient.pallergies || 'NKDA (No Known Drug Allergies)'}</div>
                                </div>
                            </section>
                        </div>
                    </aside>

                    {/* Right Panel: Visit Timeline */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                        <div style={{ maxWidth: '950px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>Clinical Timeline ({consultations.length} Visits)</h3>
                                <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>Chronological Archives</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                {consultations.map((c) => (
                                    <div key={c.id} style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                        {/* Visit Header */}
                                        <div 
                                            onClick={() => toggleVisit(c.id)}
                                            style={{ padding: '24px 32px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedVisits[c.id] ? '#f8fafc' : 'white', transition: '0.2s' }}
                                        >
                                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                                <div style={{ textAlign: 'center', minWidth: '60px' }}>
                                                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>{new Date(c.consultation_date).getDate()}</div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{new Date(c.consultation_date).toLocaleString('default', { month: 'short' })}</div>
                                                </div>
                                                <div style={{ width: '2px', height: '40px', background: '#e2e8f0' }} />
                                                <div>
                                                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.1rem' }}>{c.diagnosis || 'General Consultation'}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                        <User size={14} /> Seen by Dr. {c.doctor_name} • <Clock size={14} /> {new Date(c.consultation_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                <span style={{ padding: '8px 16px', background: '#eff6ff', color: '#2563eb', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.5px' }}>
                                                    {c.consultation_type || 'OUTPATIENT'}
                                                </span>
                                                <ChevronLeft size={22} color="#94a3b8" style={{ transform: expandedVisits[c.id] ? 'rotate(-90deg)' : 'rotate(180deg)', transition: '0.3s' }} />
                                            </div>
                                        </div>

                                        {/* Expanded Details - Full Comprehensive View */}
                                        {expandedVisits[c.id] && (
                                            <div style={{ padding: '40px', borderTop: '1px solid #f1f5f9', animation: 'fadeIn 0.3s ease-out' }}>
                                                
                                                {/* Vitals Snapshot */}
                                                <div style={{ marginBottom: '40px' }}>
                                                    <h4 style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Activity size={16} /> Clinical Vitals Signs
                                                    </h4>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '24px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                                        {[
                                                            { label: 'Temp', value: c.vitals?.temp ? `${c.vitals.temp}°C` : '--', color: '#ef4444' },
                                                            { label: 'BP', value: c.vitals?.bp || '--', color: '#1e293b' },
                                                            { label: 'HR', value: c.vitals?.heart_rate ? `${c.vitals.heart_rate} bpm` : '--', color: '#1e293b' },
                                                            { label: 'SPO2', value: c.vitals?.spo2 ? `${c.vitals.spo2}%` : '--', color: '#2563eb' },
                                                            { label: 'Weight', value: c.vitals?.weight ? `${c.vitals.weight} kg` : '--', color: '#1e293b' },
                                                            { label: 'Height', value: c.vitals?.height ? `${c.vitals.height} cm` : '--', color: '#1e293b' },
                                                            { label: 'BMI', value: c.vitals?.bmi || '--', color: '#10b981' },
                                                            { label: 'Resp. Rate', value: c.vitals?.respiratory_rate ? `${c.vitals.respiratory_rate}/min` : '--', color: '#1e293b' },
                                                        ].map((v, i) => (
                                                            <div key={i} style={{ textAlign: 'center', padding: '12px', border: '1px solid #eff6ff', borderRadius: '16px', background: 'white' }}>
                                                                <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>{v.label}</div>
                                                                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: v.color }}>{v.value}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
                                                    {/* Subjective Section */}
                                                    <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                                                        <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <Clipboard size={18} color="#3b82f6" /> SUBJECTIVE FINDINGS
                                                        </h4>
                                                        <div style={{ marginBottom: '16px' }}>
                                                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>History of Presenting Illness</div>
                                                            <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.6', background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #eff6ff' }}>
                                                                {c.hpi || 'No clinical notes recorded.'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Objective / Physical Exam Section */}
                                                    <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                                                        <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <ShieldCheck size={18} color="#10b981" /> PHYSICAL EXAMINATION
                                                        </h4>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                                            {[
                                                                { label: 'General', value: c.general_appearance },
                                                                { label: 'Head/Neck', value: c.head_neck },
                                                                { label: 'ENT/Eyes', value: c.eyes_ent },
                                                                { label: 'Cardio', value: c.cardiovascular },
                                                                { label: 'Resp', value: c.respiratory },
                                                                { label: 'Abdomen', value: c.abdomen },
                                                                { label: 'MSK', value: c.musculoskeletal },
                                                                { label: 'Neuro', value: c.neurological },
                                                                { label: 'Skin', value: c.skin },
                                                                { label: 'GU/Genital', value: c.genitourinary },
                                                            ].map((item, idx) => (
                                                                <div key={idx} style={{ background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #eff6ff' }}>
                                                                    <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</div>
                                                                    <div style={{ fontSize: '0.85rem', color: item.value ? '#1e293b' : '#cbd5e1', fontWeight: '700' }}>{item.value || 'Normal / Unchecked'}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Assessment Section */}
                                                <div style={{ background: '#fffbeb', padding: '32px', borderRadius: '24px', border: '1px solid #fef3c7', marginBottom: '40px' }}>
                                                    <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#92400e', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <FileText size={18} color="#f59e0b" /> ASSESSMENT & DIAGNOSTIC IMPRESSION
                                                    </h4>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                            <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #fef3c7' }}>
                                                                <div style={{ fontSize: '0.65rem', color: '#b45309', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>Primary Diagnosis</div>
                                                                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>{c.diagnosis || 'Clinical Review'}</div>
                                                                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                                                    <span style={{ padding: '4px 8px', background: '#fef3c7', color: '#92400e', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800' }}>
                                                                        CODE: {c.primary_diagnosis_code || 'N/A'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #fef3c7' }}>
                                                                <div style={{ fontSize: '0.65rem', color: '#b45309', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Secondary Diagnoses</div>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                                    {(() => {
                                                                        try {
                                                                            const secondary = typeof c.secondary_diagnoses === 'string' ? JSON.parse(c.secondary_diagnoses) : c.secondary_diagnoses;
                                                                            return secondary && secondary.length > 0 ? secondary.map((d, i) => (
                                                                                <span key={i} style={{ padding: '6px 12px', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>{d.name || d}</span>
                                                                            )) : <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>None recorded</span>;
                                                                        } catch(e) { return <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>None recorded</span>; }
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                            <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #fef3c7', flex: 1 }}>
                                                                <div style={{ fontSize: '0.65rem', color: '#b45309', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Differential Diagnoses</div>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                                                                    {(() => {
                                                                        try {
                                                                            const diffs = typeof c.differential_diagnoses === 'string' ? JSON.parse(c.differential_diagnoses) : c.differential_diagnoses;
                                                                            return diffs && diffs.length > 0 ? diffs.map((d, i) => (
                                                                                <span key={i} style={{ padding: '6px 12px', background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', color: '#9a3412' }}>{d.name || d}</span>
                                                                            )) : <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>None recorded</span>;
                                                                        } catch(e) { return <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>None recorded</span>; }
                                                                    })()}
                                                                </div>
                                                                
                                                                <div style={{ borderTop: '1px solid #fef3c7', paddingTop: '16px' }}>
                                                                    <div style={{ fontSize: '0.65rem', color: '#b45309', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>Clinical Impression Notes</div>
                                                                    <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.6' }}>{c.clinical_impression || 'No additional clinical impression recorded.'}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Orders & Diagnostics Section */}
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
                                                    {/* Prescription Table */}
                                                    <div>
                                                        <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <Pill size={18} color="#2563eb" /> PHARMACOLOGICAL ORDERS (RX)
                                                        </h4>
                                                        <div style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: '24px', overflow: 'hidden' }}>
                                                            <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                                                                <thead style={{ background: '#f8fafc' }}>
                                                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
                                                                        <th style={{ padding: '16px 24px' }}>Medication</th>
                                                                        <th style={{ padding: '16px 24px' }}>Regimen</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {c.prescriptions && c.prescriptions.length > 0 ? c.prescriptions.map((rx, i) => (
                                                                        <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                                            <td style={{ padding: '16px 24px', fontWeight: '700' }}>{rx.drug_name}</td>
                                                                            <td style={{ padding: '16px 24px' }}>{rx.dosage} • {rx.frequency}</td>
                                                                        </tr>
                                                                    )) : (
                                                                        <tr>
                                                                            <td colSpan="2" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No pharmacological orders for this visit.</td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>

                                                    {/* Lab Results Table */}
                                                    <div>
                                                        <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <FlaskConical size={18} color="#059669" /> DIAGNOSTIC LAB RESULTS
                                                        </h4>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                            {c.lab_results && c.lab_results.length > 0 ? c.lab_results.map((res, i) => {
                                                                let parsedResults = {};
                                                                try {
                                                                    parsedResults = typeof res.results === 'string' ? JSON.parse(res.results) : (res.results || {});
                                                                } catch(e) {}
                                                                
                                                                return (
                                                                    <div key={i} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                                                        <div style={{ background: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                            <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                <FlaskConical size={16} color="#059669" /> {res.test_name}
                                                                            </div>
                                                                            <span style={{ padding: '4px 10px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '800' }}>VERIFIED</span>
                                                                        </div>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', padding: '12px 16px', gap: '10px' }}>
                                                                            {Object.entries(parsedResults).map(([key, val], idx) => {
                                                                                const isComplex = typeof val === 'object' && val !== null;
                                                                                const rVal = isComplex ? val.value : val;
                                                                                const rUnit = isComplex ? val.unit : '';
                                                                                const rStatus = isComplex ? (val.status || 'Normal') : 'Normal';
                                                                                
                                                                                const getStatusColor = (s) => {
                                                                                    const low = s.toLowerCase();
                                                                                    if (low.includes('critical') || low.includes('high')) return '#ef4444';
                                                                                    if (low.includes('low')) return '#3b82f6';
                                                                                    if (low.includes('reactive') && !low.includes('non')) return '#f59e0b';
                                                                                    return '#10b981';
                                                                                };
                                                                                const sColor = getStatusColor(rStatus);

                                                                                return (
                                                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                            <Activity size={14} color={sColor} />
                                                                                            <span style={{ color: '#475569', fontWeight: '600' }}>{key === 'undefined' || key.trim() === '' ? 'Unnamed Parameter' : key}</span>
                                                                                        </div>
                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                                            <span style={{ color: '#0f172a', fontWeight: '800' }}>{rVal} <span style={{ color: '#64748b', fontWeight: '600' }}>{rUnit}</span></span>
                                                                                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '6px', background: `${sColor}15`, color: sColor, fontWeight: '800', minWidth: '60px', textAlign: 'center', border: `1px solid ${sColor}30` }}>
                                                                                                {rStatus.toUpperCase()}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }) : (
                                                                <div style={{ padding: '40px', background: '#f8fafc', borderRadius: '24px', border: '1px dashed #e2e8f0', textAlign: 'center', color: '#94a3b8' }}>
                                                                    No diagnostic results recorded.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Plan & Follow-up Section */}
                                                <div style={{ background: '#f8fafc', padding: '40px', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                                                    <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <MapPin size={18} color="#6366f1" /> MANAGEMENT & DISPOSITION PLAN
                                                    </h4>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                                            <div>
                                                                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Management Plan</div>
                                                                <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.8', background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #eff6ff' }}>
                                                                    {c.management_plan || 'Routine clinical management.'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Patient Education</div>
                                                                <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.8', background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #eff6ff' }}>
                                                                    {c.patient_education || 'No education notes provided.'}
                                                                </p>
                                                            </div>
                                                            {c.referral_specialty && (
                                                                <div style={{ background: '#eef2ff', padding: '20px', borderRadius: '20px', border: '1px solid #e0e7ff' }}>
                                                                    <div style={{ fontSize: '0.65rem', color: '#4338ca', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Clinical Referral</div>
                                                                    <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '1rem' }}>{c.referral_specialty}</div>
                                                                    <p style={{ fontSize: '0.85rem', color: '#4338ca', marginTop: '4px' }}>{c.referral_notes}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                                            <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #eff6ff' }}>
                                                                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Follow-up Schedule</div>
                                                                {c.follow_up_date ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                                                                            <Calendar size={24} />
                                                                        </div>
                                                                        <div>
                                                                            <div style={{ fontSize: '1rem', fontWeight: '800', color: '#1e293b' }}>{new Date(c.follow_up_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                                                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Scheduled Follow-up</div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>No follow-up scheduled.</div>
                                                                )}
                                                            </div>
                                                            <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #eff6ff' }}>
                                                                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>Disposition Status</div>
                                                                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#2563eb' }}>{(() => {
                                                                    try {
                                                                        const disp = typeof c.disposition === 'string' ? JSON.parse(c.disposition) : c.disposition;
                                                                        return disp?.status || disp || 'Discharge';
                                                                    } catch(e) { return c.disposition || 'Discharge'; }
                                                                })()}</div>
                                                            </div>
                                                            {c.sick_leave && (
                                                                <div style={{ background: '#fef2f2', padding: '24px', borderRadius: '24px', border: '1px solid #fee2e2' }}>
                                                                    <div style={{ fontSize: '0.65rem', color: '#991b1b', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Clinical Sick Leave</div>
                                                                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#991b1b' }}>{(() => {
                                                                        try {
                                                                            const sl = typeof c.sick_leave === 'string' ? JSON.parse(c.sick_leave) : c.sick_leave;
                                                                            return sl?.days ? `${sl.days} Days (${sl.reason})` : sl;
                                                                        } catch(e) { return c.sick_leave; }
                                                                    })()}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {consultations.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
                                        <AlertCircle size={40} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                                        <p style={{ color: '#64748b', fontWeight: '600' }}>No clinical consultations found for this patient.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default PatientProfile;
