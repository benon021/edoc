// =============================================================
// FILE: DoctorDashboard.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import ClinicalModal from '../../components/shared/ClinicalModal';
import {
    Calendar, Users, Clock, CheckCircle, TrendingUp, AlertCircle,
    ArrowRight, UserPlus, Bell, Search, Activity, Bookmark, Layout, CloudSun, User, Trash2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [stats, setStats] = useState({ total: 0, waiting: 0, completed: 0 });
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, appo: null });
    
    const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (profile?.docid) {
            fetchTodayQueue();
        }
    }, [profile]);

    const fetchTodayQueue = async () => {
        // Ensure docid is a valid integer before querying to avoid 400 errors
        const docIdInt = parseInt(profile?.docid);
        
        if (isNaN(docIdInt)) {
            console.warn('[DoctorDashboard] No valid integer docid found yet:', profile?.docid);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            
            const { data, error } = await supabase
                .from('appointment')
                .select(`
                    appoid, status, created_at,
                    patient:pid (pid, pname, patient_display_id, pgender)
                `)
                .eq('docid', docIdInt)
                .eq('appodate', today)
                .order('created_at', { ascending: true });
                
            if (error) throw error;
            
            if (data) {
                // Flatten the patient data
                const formattedQueue = data.map(appo => ({
                    appoid: appo.appoid,
                    status: appo.status,
                    created_at: appo.created_at,
                    pid: appo.patient?.pid,
                    pname: appo.patient?.pname || 'Unknown Patient',
                    patient_display_id: appo.patient?.patient_display_id || 'Unknown',
                    pgender: appo.patient?.pgender || 'N/A'
                }));
                
                setAppointments(formattedQueue);
                
                // Calculate stats
                const waiting = formattedQueue.filter(a => a.status === 'waiting').length;
                const completed = formattedQueue.filter(a => a.status === 'completed').length;
                setStats({ total: formattedQueue.length, waiting, completed });
            }
        } catch (err) {
            console.error("Failed to fetch today's queue", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete.appo) return;
        try {
            const { error } = await supabase
                .from('appointment')
                .delete()
                .eq('appoid', confirmDelete.appo.appoid);
                
            if (error) throw error;
            
            fetchTodayQueue();
            setConfirmDelete({ open: false, appo: null });
        } catch (err) {
            console.error(err);
            alert("Failed to delete appointment: " + err.message);
        }
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Nice afternoon';
        return 'Good evening';
    };

    const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const timeParts = formattedTime.split(' ');

    const metrics = [
        { label: 'Today Queue', count: stats.total, icon: Calendar, path: '/doctor/appointments', color: '#3b82f6' },
        { label: 'Waiting', count: stats.waiting, icon: Clock, path: '/doctor/appointments', color: '#f59e0b' },
        { label: 'Completed', count: stats.completed, icon: CheckCircle, path: '/doctor/appointments', color: '#10b981' },
        { label: 'Total Patients', count: stats.total, icon: Users, path: '/doctor/patients', color: '#8b5cf6' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar userType="d" />
            <main style={{ flex: 1, padding: '32px 48px' }}>
                
                <ClinicalModal 
                    isOpen={confirmDelete.open}
                    onClose={() => setConfirmDelete({ open: false, appo: null })}
                    type="danger"
                    title="Remove Appointment"
                    message={`Are you sure you want to PERMANENTLY remove the appointment for ${confirmDelete.appo?.pname}? This action will remove them from your clinical queue.`}
                    confirmText="Yes, Remove"
                    onConfirm={handleDelete}
                />

                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b' }}>Clinical Overview</h2>
                        <p style={{ color: '#64748b' }}>Manage your patient queue and daily consultations.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '700', color: '#1e293b' }}>{timeParts[0]} {timeParts[1]}</div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{todayDate}</div>
                        </div>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <Bell size={20} />
                        </div>
                    </div>
                </div>

                {/* Modern Dynamic Welcome Hero */}
                <div style={{
                    backgroundImage: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    borderRadius: '24px',
                    padding: '40px',
                    marginBottom: '40px',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
                }}>
                    <div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '12px' }}>
                            {getGreeting()},<br />
                            <span style={{ color: '#60a5fa' }}>Dr. {profile?.docname || 'Staff'}</span>
                        </h2>
                        <p style={{ fontSize: '1.1rem', opacity: 0.8, marginBottom: '32px' }}>
                            You have {stats.waiting} patients waiting in your queue today.
                        </p>
                        <button onClick={() => navigate('/doctor/appointments')} style={{ padding: '12px 24px', background: '#3b82f6', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            View Patient Queue <ArrowRight size={18} />
                        </button>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '15px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '3rem', fontWeight: '800', lineHeight: 1 }}>24°C</div>
                                <div style={{ fontSize: '1rem', opacity: 0.7, fontWeight: '500' }}>Sunny Interval</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '20px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <CloudSun size={40} />
                            </div>
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '600', opacity: 0.9 }}>Local Medical Center</div>
                    </div>
                </div>

                {/* Metrics Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                    {metrics.map((stat, idx) => (
                        <div key={idx}
                            onClick={() => navigate(stat.path)}
                            style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
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

                {/* Main Content: Patient Queue */}
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: '#1e293b' }}>Live Patient Queue</h3>
                            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Real-time updates from the Registrar desk.</p>
                        </div>
                        <button onClick={fetchTodayQueue} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '10px', color: '#475569', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                    </div>

                    <div style={{ padding: '0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '16px 32px', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>No.</th>
                                    <th style={{ textAlign: 'left', padding: '16px 32px', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Patient</th>
                                    <th style={{ textAlign: 'left', padding: '16px 32px', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Arrival Time</th>
                                    <th style={{ textAlign: 'left', padding: '16px 32px', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ textAlign: 'right', padding: '16px 32px', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Loading your queue...</td></tr>
                                ) : appointments.length > 0 ? (
                                    appointments.map((appo, idx) => (
                                        <tr key={appo.appoid} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '20px 32px', fontWeight: '700', color: '#64748b' }}>#{idx + 1}</td>
                                            <td style={{ padding: '20px 32px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{appo.pname}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{appo.patient_display_id} • {appo.pgender}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 32px', fontSize: '0.85rem', color: '#64748b' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Clock size={14} color="#3b82f6" /> 
                                                    <span style={{ fontWeight: '700', color: '#1e293b' }}>
                                                        {appo.created_at ? new Date(appo.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '20px' }}>Checked-in Today</div>
                                            </td>
                                            <td style={{ padding: '20px 32px' }}>
                                                <span style={{ 
                                                    padding: '6px 12px', 
                                                    borderRadius: '8px', 
                                                    fontSize: '0.75rem', 
                                                    fontWeight: '700', 
                                                    textTransform: 'uppercase',
                                                    background: appo.status === 'waiting' ? '#fffbeb' : 
                                                               appo.status === 'at_lab' ? '#e0f2fe' :
                                                               appo.status === 'results_ready' ? '#f0fdf4' : '#ecfdf5',
                                                    color: appo.status === 'waiting' ? '#9a3412' : 
                                                           appo.status === 'at_lab' ? '#0369a1' :
                                                           appo.status === 'results_ready' ? '#166534' : '#047857'
                                                }}>
                                                    {appo.status === 'at_lab' ? '🧪 AT LAB' : 
                                                     appo.status === 'results_ready' ? '✅ RESULTS READY' : appo.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                                    <button 
                                                        onClick={() => setConfirmDelete({ open: true, appo })}
                                                        style={{ padding: '8px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        title="Delete Appointment"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <button onClick={() => navigate(`/doctor/consultation?appoid=${appo.appoid}`)} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Start Session</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '64px' }}>
                                            <Activity size={48} color="#e2e8f0" style={{ marginBottom: '16px' }} />
                                            <p style={{ color: '#94a3b8', fontWeight: '500' }}>Your queue is currently empty.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    <div style={{ padding: '24px 32px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                        <button onClick={() => navigate('/doctor/appointments')} style={{ width: '100%', padding: '12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b', fontWeight: '700', cursor: 'pointer' }}>View Detailed Appointment Log</button>
                    </div>
                </div>

                <style>{`
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    .animate-spin { animation: spin 1s linear infinite; }
                `}</style>
            </main>
        </div>
    );
};

const RefreshCw = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>
);

export default DoctorDashboard;
