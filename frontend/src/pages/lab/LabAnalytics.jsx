// =============================================================
// FILE: LabAnalytics.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import { BarChart3, TrendingUp, Activity, CheckCircle, Clock, Microscope, Award, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#14b8a6'];

function SimpleBar({ data, maxValue, color }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.map((item, i) => {
                const pct = maxValue > 0 ? (item.count / maxValue) * 100 : 0;
                return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 160, fontSize: '0.78rem', color: '#475569', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.test_type || item.labname}</div>
                        <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 20, height: 12, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: color || BAR_COLORS[i % BAR_COLORS.length], borderRadius: 20, transition: 'width 0.8s ease' }} />
                        </div>
                        <div style={{ width: 30, textAlign: 'right', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{item.count}</div>
                    </div>
                );
            })}
        </div>
    );
}

function WeeklyChart({ data }) {
    const max = Math.max(...data.map(d => d.count), 1);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
            {data.length === 0 ? (
                <div style={{ flex: 1, textAlign: 'center', color: '#94a3b8', paddingTop: 40, fontSize: '0.85rem' }}>No data for the past 7 days</div>
            ) : data.map((d, i) => {
                const pct = (d.count / max) * 100;
                const dayName = days[new Date(d.day).getDay()];
                return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1e293b' }}>{d.count}</div>
                        <div style={{ width: '100%', background: '#f1f5f9', borderRadius: '6px 6px 0 0', position: 'relative', height: '80px', display: 'flex', alignItems: 'flex-end' }}>
                            <div style={{ width: '100%', height: `${pct}%`, background: 'linear-gradient(to top, #3b82f6, #60a5fa)', borderRadius: '6px 6px 0 0', minHeight: 4, transition: 'height 0.8s ease' }} />
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>{dayName}</div>
                    </div>
                );
            })}
        </div>
    );
}

export default function LabAnalytics() {
    const [data, setData] = useState({ totalTests: 0, completed: 0, pending: 0, topTests: [], weeklyVolume: [], techPerformance: [] });
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const { data: requests, error: reqErr } = await supabase.from('lab_requests').select('status, test_type, created_at');
            const { data: reports, error: repErr } = await supabase.from('lab_reports').select('lab_technician:technician_id(labname)');

            if (reqErr) throw reqErr;

            const totalTests = requests?.length || 0;
            const completed = requests?.filter(r => r.status === 'completed').length || 0;
            const pending = requests?.filter(r => r.status === 'pending').length || 0;

            const topTestsMap = {};
            requests?.forEach(r => {
                const t = r.test_type || 'Unknown';
                topTestsMap[t] = (topTestsMap[t] || 0) + 1;
            });
            const topTests = Object.entries(topTestsMap).map(([test_type, count]) => ({ test_type, count })).sort((a, b) => b.count - a.count).slice(0, 8);

            const weeklyVolumeMap = {};
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            requests?.forEach(r => {
                if (!r.created_at) return;
                const date = new Date(r.created_at);
                if (date >= sevenDaysAgo) {
                    const day = date.toISOString().split('T')[0];
                    weeklyVolumeMap[day] = (weeklyVolumeMap[day] || 0) + 1;
                }
            });
            const weeklyVolume = Object.entries(weeklyVolumeMap).map(([day, count]) => ({ day, count })).sort((a, b) => a.day.localeCompare(b.day));

            const techMap = {};
            reports?.forEach(r => {
                const name = r.lab_technician?.labname || 'Unknown';
                techMap[name] = (techMap[name] || 0) + 1;
            });
            const techPerformance = Object.entries(techMap).map(([labname, count]) => ({ labname, count })).sort((a, b) => b.count - a.count);

            setData({ totalTests, completed, pending, topTests, weeklyVolume, techPerformance });
        } catch (e) { console.error(e); }
        setLoading(false);
    }, []);

    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

    const completionRate = data.totalTests > 0 ? Math.round((data.completed / data.totalTests) * 100) : 0;
    const maxTest = Math.max(...(data.topTests?.map(t => t.count) || []), 1);
    const maxTech = Math.max(...(data.techPerformance?.map(t => t.count) || []), 1);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
            <Sidebar userType="l" />
            <main style={{ flex: 1, padding: '40px 56px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <BarChart3 size={28} color="#6366f1" /> Lab Analytics
                        </h1>
                        <p style={{ color: '#64748b', marginTop: 4 }}>Performance metrics, test volumes, and technician insights.</p>
                    </div>
                    <button onClick={fetchAnalytics} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontWeight: 500 }}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>Loading analytics...</div>
                ) : (
                    <>
                        {/* KPI Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                            {[
                                { label: 'Total Tests', value: data.totalTests, icon: Microscope, color: '#3b82f6', bg: '#eff6ff', suffix: '' },
                                { label: 'Completed', value: data.completed, icon: CheckCircle, color: '#10b981', bg: '#ecfdf5', suffix: '' },
                                { label: 'Pending', value: data.pending, icon: Clock, color: '#f59e0b', bg: '#fffbeb', suffix: '' },
                                { label: 'Completion Rate', value: completionRate, icon: TrendingUp, color: '#6366f1', bg: '#eef2ff', suffix: '%' },
                            ].map((s, i) => (
                                <div key={i} style={{ background: 'white', padding: '28px 24px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                                        <div style={{ background: s.bg, padding: 10, borderRadius: 10 }}><s.icon size={20} color={s.color} /></div>
                                    </div>
                                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a' }}>{s.value}{s.suffix}</div>
                                    <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 500, marginTop: 4 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Completion Progress */}
                        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 28, marginBottom: 24 }}>
                            <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Activity size={18} color="#6366f1" /> Overall Completion Progress
                            </h3>
                            <div style={{ background: '#f1f5f9', borderRadius: 20, height: 20, overflow: 'hidden', marginBottom: 8 }}>
                                <div style={{ width: `${completionRate}%`, height: '100%', background: 'linear-gradient(to right, #6366f1, #8b5cf6)', borderRadius: 20, transition: 'width 1s ease' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                                <span>{data.completed} completed</span>
                                <span style={{ fontWeight: 700, color: '#6366f1' }}>{completionRate}%</span>
                                <span>{data.totalTests} total</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                            {/* Weekly Volume Chart */}
                            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 28 }}>
                                <h3 style={{ fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <TrendingUp size={18} color="#3b82f6" /> Weekly Test Volume (Last 7 Days)
                                </h3>
                                <WeeklyChart data={data.weeklyVolume || []} />
                            </div>

                            {/* Tech Performance */}
                            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 28 }}>
                                <h3 style={{ fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Award size={18} color="#10b981" /> Technician Performance
                                </h3>
                                {data.techPerformance?.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>No completed results data yet</div>
                                ) : (
                                    <SimpleBar data={data.techPerformance} maxValue={maxTech} color="#10b981" />
                                )}
                            </div>
                        </div>

                        {/* Top Tests */}
                        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 28 }}>
                            <h3 style={{ fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <BarChart3 size={18} color="#f59e0b" /> Most Ordered Tests (Top 8)
                            </h3>
                            {data.topTests?.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>No test request data available yet</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                    <SimpleBar data={data.topTests} maxValue={maxTest} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {data.topTests.map((t, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 10 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: BAR_COLORS[i % BAR_COLORS.length] }} />
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{t.test_type}</span>
                                                </div>
                                                <span style={{ fontWeight: 800, color: BAR_COLORS[i % BAR_COLORS.length] }}>{t.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
