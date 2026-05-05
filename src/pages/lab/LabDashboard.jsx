// =============================================================
// FILE: LabDashboard.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import { Microscope, ClipboardList, CheckCircle, AlertCircle, TrendingUp, CloudSun, RefreshCw, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function LabDashboard() {
    const [stats, setStats] = useState({ pending: 0, urgent: 0, completedToday: 0, requestedToday: 0 });
    const [requests, setRequests] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const { profile } = useAuth();
    const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // 1. Fetch raw lab requests
            const { data: rawData, error: labError } = await supabase
                .from('lab_requests')
                .select('id, test_name, status, urgency, created_at, appointment_id')
                .order('created_at', { ascending: false });
                
            if (labError) throw labError;
            
            // 2. Fetch related appointments and patients manually
            const appoids = [...new Set((rawData || []).map(r => r.appointment_id).filter(Boolean))];
            let appos = [];
            if (appoids.length > 0) {
                const { data: appoData, error: appoError } = await supabase
                    .from('appointment')
                    .select(`
                        appoid, 
                        appodate,
                        patient:pid(pid, pname, pgender),
                        doctor:docid(docname)
                    `)
                    .in('appoid', appoids);
                if (appoError) console.warn("Appointment fetch failed", appoError);
                else appos = appoData || [];
            }

            const allReqs = (rawData || []).map(r => {
                const appo = appos.find(a => a.appoid === r.appointment_id);
                return {
                    ...r,
                    appointment: appo
                };
            });
            
            const pendingReqs = allReqs.filter(r => r.status !== 'completed').map(r => ({
                ...r,
                pname: r.appointment?.patient?.pname || 'Unknown',
                pgender: r.appointment?.patient?.pgender || 'Unknown',
                docname: 'Clinical Staff' // Simplified
            }));
            
            setRequests(pendingReqs);
            
            let pendingCount = 0;
            let urgentCount = 0;
            let completedTodayCount = 0;
            let requestedTodayCount = 0;
            
            allReqs.forEach(r => {
                const isToday = r.created_at && r.created_at.startsWith(today);
                
                if (r.status !== 'completed') {
                    pendingCount++;
                } else {
                    if (isToday) completedTodayCount++;
                }
                
                if (isToday) requestedTodayCount++;
            });
            
            setStats({
                pending: pendingCount,
                urgent: urgentCount,
                completedToday: completedTodayCount,
                requestedToday: requestedTodayCount
            });
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const getGreeting = () => {
        const h = currentTime.getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const timeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const [t, period] = timeStr.split(' ');

    const statCards = [
        { label: "Today's Requests", value: stats.requestedToday, icon: ClipboardList, color: '#3b82f6', bg: '#eff6ff' },
        { label: 'Pending Queue', value: stats.pending, icon: Microscope, color: '#f59e0b', bg: '#fffbeb' },
        { label: 'Urgent Cases', value: stats.urgent, icon: AlertCircle, color: '#ef4444', bg: '#fef2f2' },
        { label: 'Completed Today', value: stats.completedToday, icon: CheckCircle, color: '#10b981', bg: '#ecfdf5' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
            <Sidebar userType="l" />
            <main style={{ flex: 1, padding: '40px 56px', overflowY: 'auto' }}>

                {/* Hero Banner */}
                <div style={{ backgroundImage: 'linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,58,95,0.88)), url(/img/b8.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 20, padding: '40px 50px', marginBottom: 36, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 260, boxShadow: '0 20px 40px rgba(15,23,42,0.2)' }}>
                    <div>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 6 }}>
                            {getGreeting()},<br />
                            <span style={{ color: '#60a5fa' }}>{profile?.labname || 'Lab Technician'}</span>
                        </h2>
                        <p style={{ fontSize: '1rem', opacity: 0.85, marginBottom: 28 }}>Ready to process today's samples 🔬</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <span style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1 }}>{t}</span>
                            <span style={{ fontSize: '1.3rem', fontWeight: 600, opacity: 0.75 }}>{period}</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, marginBottom: 8 }}>
                            <div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>23°C</div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.85 }}>Nairobi</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.15)', padding: 14, borderRadius: '50%', backdropFilter: 'blur(8px)' }}>
                                <CloudSun size={36} />
                            </div>
                        </div>
                        <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>{todayDate}</div>
                    </div>
                </div>

                {/* Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 36 }}>
                    {statCards.map((s, i) => (
                        <div key={i} style={{ background: 'white', padding: '28px 24px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                                <div style={{ padding: 10, background: s.bg, borderRadius: 10 }}><s.icon size={22} color={s.color} /></div>
                            </div>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{s.value}</h3>
                            <p style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 500 }}>{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Main Content */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28 }}>
                    {/* Active Requests Table */}
                    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <TrendingUp size={18} color="#3b82f6" /> Active Lab Requests
                            </h3>
                            <button onClick={fetchData} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
                                <RefreshCw size={16} />
                            </button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        {['Patient', 'Test Name', 'Priority', 'Doctor'].map(h => (
                                            <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.length > 0 ? requests.slice(0, 8).map((r, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                             <td style={{ padding: '14px 20px' }}>
                                                 <div style={{ fontWeight: 600 }}>{r.pname}</div>
                                                 <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{r.pgender}</div>
                                             </td>
                                             <td style={{ padding: '14px 20px' }}>{r.test_name}</td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: r.urgency === 'Urgent' ? '#fef2f2' : '#f0f9ff', color: r.urgency === 'Urgent' ? '#ef4444' : '#3b82f6' }}>
                                                    {r.urgency === 'Urgent' ? '⚡ URGENT' : 'Routine'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 20px' }}>Dr. {r.docname}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>No pending requests</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Status Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 20 }}>Workflow Status</h3>
                            {[
                                { label: 'Awaiting Sample', count: stats.pending, color: '#f59e0b' },
                                { label: 'Urgent / STAT', count: stats.urgent, color: '#ef4444' },
                                { label: 'Completed Today', count: stats.completedToday, color: '#10b981' },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                                        <span style={{ fontSize: '0.875rem', color: '#475569' }}>{item.label}</span>
                                    </div>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: item.color }}>{item.count}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', color: 'white', padding: 24, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: 14, borderRadius: 12 }}>
                                <Activity size={28} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: 4 }}>Lab Workload Score</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.pending + stats.urgent}</div>
                                <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>Active items in queue</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
