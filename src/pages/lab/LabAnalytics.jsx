import React, { useState, useEffect, useCallback } from 'react';
import { 
    BarChart3, TrendingUp, Activity, CheckCircle, 
    Clock, Microscope, Award, RefreshCw, Layers
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#14b8a6'];

function SimpleBar({ data, maxValue, color }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.map((item, i) => {
                const pct = maxValue > 0 ? (item.count / maxValue) * 100 : 0;
                return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 140, fontSize: '0.85rem', color: '#475569', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                        <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 20, height: 10, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: color || BAR_COLORS[i % BAR_COLORS.length], borderRadius: 20, transition: 'width 0.8s ease' }} />
                        </div>
                        <div style={{ width: 40, textAlign: 'right', fontWeight: '800', fontSize: '0.9rem', color: '#0f172a' }}>{item.count}</div>
                    </div>
                );
            })}
        </div>
    );
}

export default function LabAnalytics() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        total: 0,
        completed: 0,
        pending: 0,
        avgTAT: '0.0h',
        categories: [],
        topTests: [],
        technicians: []
    });

    const fetchLabIntelligence = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch Requests & Reports
            const { data: requests } = await supabase.from('lab_requests').select('status, test_type, created_at');
            const { data: reports } = await supabase.from('lab_reports').select('created_at, request_id, technician:technician_id(labname)');

            const total = requests?.length || 0;
            const completed = requests?.filter(r => r.status === 'completed').length || 0;
            const pending = requests?.filter(r => r.status === 'pending').length || 0;

            // 2. Turnaround Time (TAT) Calculation
            let totalTAT = 0;
            let tatCount = 0;
            reports?.forEach(rep => {
                const req = requests?.find(r => r.id === rep.request_id);
                if (req && req.created_at && rep.created_at) {
                    const diff = (new Date(rep.created_at) - new Date(req.created_at)) / (1000 * 60 * 60); // Hours
                    totalTAT += diff;
                    tatCount++;
                }
            });
            const avgTAT = tatCount > 0 ? (totalTAT / tatCount).toFixed(1) : '0.0';

            // 3. Category/Test Distribution
            const testMap = {};
            requests?.forEach(r => {
                const t = r.test_type || 'Other';
                testMap[t] = (testMap[t] || 0) + 1;
            });
            const topTests = Object.entries(testMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // 4. Technician Performance
            const techMap = {};
            reports?.forEach(rep => {
                const name = rep.technician?.labname || 'Clinical Staff';
                techMap[name] = (techMap[name] || 0) + 1;
            });
            const technicians = Object.entries(techMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            setData({
                total,
                completed,
                pending,
                avgTAT: `${avgTAT}h`,
                topTests,
                technicians,
                categories: [] // Future: Link to lab_catalog categories
            });

        } catch (e) {
            console.error('Lab Intelligence Error:', e);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchLabIntelligence(); }, [fetchLabIntelligence]);

    const completionRate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

    if (loading) return <div style={{ padding: 80, textAlign: 'center', color: '#64748b' }}>Analyzing laboratory performance...</div>;

    return (
        <div style={{ padding: '40px 56px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.04em', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Microscope size={40} color="#6366f1" /> Laboratory Intelligence
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: '500', marginTop: '4px' }}>Turnaround times, diagnostic volumes, and operational efficiency.</p>
                </div>
                <button onClick={fetchLabIntelligence} style={{ padding: '12px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: '700' }}>
                    <RefreshCw size={18} /> Refresh Analytics
                </button>
            </header>

            {/* KPI Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                {[
                    { label: 'Total Tests Ordered', value: data.total, icon: Layers, color: '#3b82f6', bg: '#eff6ff', sub: 'Gross volume' },
                    { label: 'Results Finalized', value: data.completed, icon: CheckCircle, color: '#10b981', bg: '#ecfdf5', sub: `${completionRate}% Completion` },
                    { label: 'Pending Queue', value: data.pending, icon: Clock, color: '#f59e0b', bg: '#fffbeb', sub: 'Awaiting processing' },
                    { label: 'Avg. Turnaround', value: data.avgTAT, icon: Activity, color: '#6366f1', bg: '#eef2ff', sub: 'Order to report' },
                ].map((kpi, i) => (
                    <div key={i} style={{ background: 'white', padding: '28px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ background: kpi.bg, width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                            <kpi.icon size={24} color={kpi.color} />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>{kpi.value}</h2>
                        <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</p>
                        <p style={{ fontSize: '0.85rem', color: kpi.color, fontWeight: '700', marginTop: '12px' }}>{kpi.sub}</p>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* Top Tests */}
                <div style={{ background: 'white', borderRadius: '28px', border: '1px solid #e2e8f0', padding: '36px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Activity size={24} color="#3b82f6" /> Diagnostic Volume by Test
                    </h3>
                    <SimpleBar data={data.topTests} maxValue={Math.max(...data.topTests.map(t => t.count), 1)} />
                </div>

                {/* Tech Performance */}
                <div style={{ background: 'white', borderRadius: '28px', border: '1px solid #e2e8f0', padding: '36px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Award size={24} color="#10b981" /> Technician Performance (Reports)
                    </h3>
                    <SimpleBar data={data.technicians} maxValue={Math.max(...data.technicians.map(t => t.count), 1)} color="#10b981" />
                </div>
            </div>
        </div>
    );
}
