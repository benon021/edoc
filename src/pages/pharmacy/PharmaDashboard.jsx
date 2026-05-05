// =============================================================
// FILE: PharmaDashboard.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import {
    Search, Calendar, UserPlus, Users, Bookmark, Layout, CloudSun, Pill, Shield, FlaskConical
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PharmaDashboard = () => {
    const [stats, setStats] = useState({
        pendingPrescriptions: 1,
        todaySalesCount: 2,
        todayRevenue: 0,
        lowStock: 0
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [prescriptions, setPrescriptions] = useState([]);
    const [inventory, setInventory] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayStr = today.toISOString();

                // 1. Fetch Stats in parallel with limited columns
                const [prescRes, salesRes, inventoryRes, labRes] = await Promise.all([
                    supabase.from('prescriptions')
                        .select('id, created_at, appointment!inner(patient!inner(pname), schedule!inner(doctor!inner(docname)))')
                        .eq('status', 'pending'),
                    supabase.from('pharmacy_sale')
                        .select('total_amount, created_at')
                        .gte('created_at', todayStr),
                    supabase.from('medicine')
                        .select('id, stock_qty, reorder_level'),
                    supabase.from('lab_requests')
                        .select('id')
                        .neq('status', 'completed')
                ]);

                if (prescRes.error) throw prescRes.error;
                if (salesRes.error) throw salesRes.error;
                if (inventoryRes.error) throw inventoryRes.error;

                const pendingPresc = prescRes.data || [];
                const todaySales = salesRes.data || [];
                const inv = inventoryRes.data || [];
                const pendingLabs = labRes.data || [];

                // Calculate stats
                const totalRevenue = todaySales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
                const lowStockCount = inv.filter(item => (item.stock_qty || 0) <= (item.reorder_level || 10)).length;

                setStats({
                    pendingPrescriptions: pendingPresc.length,
                    todaySalesCount: todaySales.length,
                    todayRevenue: totalRevenue,
                    lowStock: lowStockCount,
                    pendingLabs: pendingLabs.length
                });

                // Set detail lists
                setPrescriptions(pendingPresc.map(p => ({
                    ...p,
                    pname: p.appointment?.patient?.pname || 'Unknown',
                    docname: p.appointment?.schedule?.doctor?.docname || 'Unknown'
                })));
                setInventory(inv);

            } catch (err) {
                console.error("Dashboard data fetch error:", err);
            }
        };

        fetchDashboardData();
    }, []);

    const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Nice afternoon';
        return 'Good evening';
    };

    const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const timeParts = formattedTime.split(' ');

    const statCards = [
        { label: 'Pending RX', value: stats.pendingPrescriptions, icon: Pill },
        { label: 'Today Sales', value: stats.todaySalesCount, icon: Users },
        { label: 'Low Stock', value: stats.lowStock, icon: Shield },
        { label: 'Pending Lab', value: stats.pendingLabs, icon: FlaskConical },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff' }}>
            <Sidebar userType="ph" />
            <main style={{ flex: 1, padding: '24px 30px' }}>


                {/* Modern Dynamic Welcome Hero */}
                <div style={{
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(/img/b8.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '16px',
                    padding: '40px 50px',
                    marginBottom: '40px',
                    color: 'white',
                    minHeight: '280px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                            {getGreeting()},<br />
                            <span style={{ color: '#60a5fa' }}>{user.phname || 'Pharmacist'}</span>
                        </h2>
                        <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Ready to make today productive!
                        </p>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                            <span style={{ fontSize: '4rem', fontWeight: '800', lineHeight: 1 }}>{timeParts[0]}</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: '600', opacity: 0.8 }}>{timeParts[1]}</span>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '15px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: 1 }}>23°C</div>
                                <div style={{ fontSize: '1.1rem', opacity: 0.9, fontWeight: '500' }}>Partly cloudy</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '50%', backdropFilter: 'blur(10px)' }}>
                                <CloudSun size={40} />
                            </div>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '600', opacity: 0.9 }}>Nairobi</div>
                        <div style={{ fontSize: '1rem', opacity: 0.8 }}>{todayDate}</div>
                    </div>
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#343a40', marginBottom: '25px' }}>Status</h2>

                {/* Edoc Status Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                    {statCards.map((stat, idx) => (
                        <div key={idx} style={{ background: 'white', padding: '20px 25px', borderRadius: '4px', border: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#007bff' }}>{stat.value}</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#343a40' }}>{stat.label}</div>
                            </div>
                            <div style={{ padding: '12px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px', color: '#007bff' }}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Edoc Content Sections */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>

                    {/* Appointments Section - Real RX Requests */}
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#007bff', marginBottom: '10px' }}>Active Prescription Queue</h3>
                        <p style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '20px' }}>Clinical orders pending dispensing. Click to process medications.</p>

                        <div style={{ background: 'white', borderRadius: '4px', border: '1px solid #dee2e6', display: 'flex', flexDirection: 'column', height: '350px', overflow: 'hidden' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr', padding: '12px 20px', borderBottom: '2px solid #007bff', fontSize: '0.85rem', fontWeight: '700', color: '#343a40', background: '#f8f9fa' }}>
                                <div>Time</div>
                                <div>Patient Name</div>
                                <div>Doctor</div>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                {prescriptions.length > 0 ? prescriptions.map((rx, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr', padding: '12px 20px', borderBottom: '1px solid #eee', fontSize: '0.85rem' }}>
                                        <div style={{ color: '#6c757d' }}>{new Date(rx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div style={{ fontWeight: '600' }}>{rx.pname}</div>
                                        <div>Dr. {rx.docname}</div>
                                    </div>
                                )) : (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#adb5bd' }}>
                                        No pending prescriptions found.
                                    </div>
                                )}
                            </div>
                            <button style={{ width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '0', fontWeight: '600', cursor: 'pointer' }}>
                                Open Dispensary Workbench
                            </button>
                        </div>
                    </div>

                    {/* Sessions Section */}
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#007bff', marginBottom: '10px' }}>Expiring Stocks until Next Friday</h3>
                        <p style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '20px' }}>Here's Quick access to Upcoming Sessions that Scheduled until 7 days. Add, Remove and Many features available in @Schedule section.</p>

                        <div style={{ background: 'white', borderRadius: '4px', border: '1px solid #dee2e6', display: 'flex', flexDirection: 'column', height: '350px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', padding: '12px 20px', borderBottom: '2px solid #007bff', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>
                                <div>Medication Title</div>
                                <div>Batch</div>
                                <div>Expiry Date & Time</div>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                                <div style={{ opacity: 0.3, marginBottom: '20px' }}>
                                    <svg width="200" height="100" viewBox="0 0 200 100" fill="none">
                                        <circle cx="100" cy="50" r="30" fill="#007bff" fillOpacity="0.2" />
                                        <path d="M70 80C70 80 85 60 100 60C115 60 130 80 130 80" stroke="#007bff" strokeWidth="4" strokeLinecap="round" />
                                        <rect x="85" y="40" width="30" height="10" rx="5" fill="#007bff" />
                                    </svg>
                                </div>
                                <button style={{ width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer', marginTop: 'auto' }}>Show all Health Status</button>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default PharmaDashboard;
