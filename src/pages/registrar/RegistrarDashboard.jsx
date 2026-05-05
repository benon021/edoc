// =============================================================
// FILE: RegistrarDashboard.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import {
    Users, CalendarRange, Clock, AlertTriangle, UserPlus,
    CalendarPlus, Search, Calendar, Activity, Bookmark, Layout,
    CloudSun, ArrowRight, CheckCircle, FlaskConical, Pill
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const RegistrarDashboard = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [stats, setStats] = useState({ totalPatients: 0, totalDoctors: 0, todayBookings: 0, todaySessions: 0 });
    const [activeQueue, setActiveQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Get today's date in YYYY-MM-DD
            const today = new Date().toISOString().split('T')[0];

            // Run queries concurrently
            const [
                { count: patientsCount },
                { count: doctorsCount },
                { count: bookingsCount },
                { data: queueData }
            ] = await Promise.all([
                supabase.from('patient').select('*', { count: 'exact', head: true }),
                supabase.from('doctor').select('*', { count: 'exact', head: true }),
                supabase.from('appointment').select('*', { count: 'exact', head: true }).eq('appodate', today),
                supabase.from('appointment')
                    .select('appoid, status, patient:pid(patient_display_id, pname), doctor:docid(docname)')
                    .eq('appodate', today)
                    .order('created_at', { ascending: false })
            ]);

            setStats({
                totalPatients: patientsCount || 0,
                totalDoctors: doctorsCount || 0,
                todayBookings: bookingsCount || 0,
                todaySessions: 0
            });

            if (queueData) {
                const formattedQueue = queueData.map(item => ({
                    appoid: item.appoid,
                    patient_display_id: item.patient?.patient_display_id || 'Unknown',
                    pname: item.patient?.pname || 'Unknown Patient',
                    docname: item.doctor?.docname || 'Unknown',
                    status: item.status,
                    has_prescription: false, // Could be queried separately if needed
                    has_labs: false
                }));
                setActiveQueue(formattedQueue);
            }

        } catch (err) {
            console.error('Dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Nice afternoon';
        return 'Good evening';
    };

    const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const timeParts = formattedTime.split(' ');

    const metrics = [
        { label: 'Clinical Staff', count: stats.totalDoctors, icon: Activity, color: '#3b82f6' },
        { label: 'Patient Registry', count: stats.totalPatients, icon: Users, color: '#8b5cf6' },
        { label: 'Today Bookings', count: stats.todayBookings, icon: Bookmark, color: '#ff7200' },
        { label: 'Hospital Capacity', count: '92%', icon: Layout, color: '#10b981' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar userType="r" />
            <main style={{ flex: 1, padding: '32px 48px' }}>

                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b' }}>Operational Hub</h2>
                        <p style={{ color: '#64748b' }}>Real-time clinical throughput and patient management.</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '1.1rem' }}>{timeParts[0]} {timeParts[1]}</div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{todayDate}</div>
                    </div>
                </div>

                {/* Modern Dynamic Welcome Hero */}
                <div style={{
                    backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), url('/img/b8.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '24px',
                    padding: '40px',
                    marginBottom: '40px',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '12px' }}>
                            {getGreeting()},<br />
                            <span style={{ color: '#60a5fa' }}>{profile?.regname || 'Registrar'}</span>
                        </h2>
                        <p style={{ fontSize: '1.1rem', opacity: 0.8, marginBottom: '32px' }}>
                            Total patient volume for today is <span style={{ color: '#60a5fa', fontWeight: '700' }}>{stats.todayBookings}</span>.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => navigate('/registrar/new-patient')} style={{ padding: '12px 24px', background: '#3b82f6', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <UserPlus size={18} /> New Registration
                            </button>
                            <button onClick={() => navigate('/registrar/patients')} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
                                View Directory
                            </button>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '15px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '3rem', fontWeight: '800', lineHeight: 1 }}>24°C</div>
                                <div style={{ fontSize: '1rem', opacity: 0.7 }}>Nairobi, Central</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '20px', backdropFilter: 'blur(10px)' }}>
                                <CloudSun size={40} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                    {metrics.map((stat, idx) => (
                        <div key={idx} style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '1.875rem', fontWeight: '800', color: '#1e293b' }}>{stat.count}</div>
                                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>{stat.label}</div>
                            </div>
                            <div style={{ padding: '12px', background: `${stat.color}15`, borderRadius: '14px', color: stat.color }}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Clinical Lifecycle Tracker */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                    <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: '#1e293b' }}>Live Clinical Throughput</h3>
                                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Monitoring the cycle from Registration to Completion.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#f59e0b', background: '#fffbeb', padding: '6px 12px', borderRadius: '100px' }}>
                                    <Clock size={14} /> CONSULTATION
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#10b981', background: '#ecfdf5', padding: '6px 12px', borderRadius: '100px' }}>
                                    <CheckCircle size={14} /> COMPLETED
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '0' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc' }}>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '16px 32px', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Patient</th>
                                        <th style={{ textAlign: 'left', padding: '16px 32px', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Assigned Doctor</th>
                                        <th style={{ textAlign: 'left', padding: '16px 32px', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Clinical Stage</th>
                                        <th style={{ textAlign: 'right', padding: '16px 32px', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Handover Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Syncing with clinical departments...</td></tr>
                                    ) : activeQueue.length > 0 ? (
                                        activeQueue.map((item) => (
                                            <tr key={item.appoid} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '20px 32px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                                            <Users size={20} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '700', color: '#1e293b' }}>{item.pname}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {item.patient_display_id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px 32px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                                            <Activity size={14} />
                                                        </div>
                                                        <div style={{ fontWeight: '600', color: '#475569' }}>Dr. {item.docname}</div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px 32px' }}>
                                                    <div style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '8px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '700',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        background: item.status === 'completed' ? '#ecfdf5' : '#fff7ed',
                                                        color: item.status === 'completed' ? '#059669' : '#c2410c'
                                                    }}>
                                                        {item.status === 'completed' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                                        {item.status?.toUpperCase() || 'UNKNOWN'}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                        {item.has_prescription && <div style={{ color: '#8b5cf6' }} title="Prescription Sent"><Pill size={18} /></div>}
                                                        {item.has_labs && <div style={{ color: '#3b82f6' }} title="Labs Requested"><FlaskConical size={18} /></div>}
                                                        {item.status === 'completed' && <div style={{ color: '#10b981' }}><CheckCircle size={18} /></div>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '64px' }}>
                                                <Activity size={48} color="#e2e8f0" style={{ marginBottom: '16px' }} />
                                                <p style={{ color: '#94a3b8', fontWeight: '500' }}>No active clinical cycle tracking data available.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ padding: '24px 32px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                            <button onClick={() => navigate('/registrar/patients')} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', color: '#1e293b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                Manage New Handover <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default RegistrarDashboard;

