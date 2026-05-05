// =============================================================
// FILE: AdminDashboard.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { getAdminStats } from '../../lib/api';
import {
    Users, UserCheck, Activity, DollarSign, Stethoscope,
    Pill, FlaskConical, Bell, Zap, Search, Calendar, CloudSun
} from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalPatients: 1,
        staff: { doctors: 1, registrars: 1, lab_techs: 1, pharmacists: 1 },
        revenue: { pharmacy: 0, lab: 0, total: 0 },
        todayClinicalVolume: 0
    });

    useEffect(() => {
        getAdminStats()
            .then(data => setStats(data))
            .catch(console.error);
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

    const metrics = [
        { label: 'Doctors', count: stats.staff.doctors, icon: Stethoscope },
        { label: 'Patients', count: stats.totalPatients, icon: Users },
        { label: 'New Booking', count: 1, icon: Bell },
        { label: 'Today Sessions', count: 0, icon: Activity },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff' }}>
            <Sidebar userType="a" />
            <main style={{ flex: 1, padding: '24px 30px' }}>


                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#343a40', marginBottom: '25px' }}>Home</h2>

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
                            <span style={{ color: '#60a5fa' }}>Administrator</span>
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
                    {metrics.map((stat, idx) => (
                        <div key={idx} style={{ background: 'white', padding: '20px 25px', borderRadius: '4px', border: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#007bff' }}>{stat.count}</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#343a40' }}>{stat.label}</div>
                            </div>
                            <div style={{ padding: '12px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px', color: '#007bff' }}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content Sections */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#007bff', marginBottom: '10px' }}>Upcoming Appointments until Next Friday</h3>
                        <p style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '20px' }}>Quick access to Upcoming Appointments until 7 days.</p>
                        <div style={{ background: 'white', border: '1px solid #dee2e6', height: '300px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '12px 20px', borderBottom: '2px solid #007bff', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', fontWeight: '700', fontSize: '0.85rem' }}>
                                <div>No</div><div>Patient</div><div>Doctor</div><div>Session</div>
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                                <Users size={100} />
                            </div>
                            <button style={{ padding: '12px', background: '#007bff', color: 'white', border: 'none', fontWeight: '700' }}>Show all Appointments</button>
                        </div>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#007bff', marginBottom: '10px' }}>Upcoming Sessions until Next Friday</h3>
                        <p style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '20px' }}>Scheduled clinical sessions for the next week.</p>
                        <div style={{ background: 'white', border: '1px solid #dee2e6', height: '300px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '12px 20px', borderBottom: '2px solid #007bff', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontWeight: '700', fontSize: '0.85rem' }}>
                                <div>Title</div><div>Doctor</div><div>Time</div>
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                                <Activity size={100} />
                            </div>
                            <button style={{ padding: '12px', background: '#007bff', color: 'white', border: 'none', fontWeight: '700' }}>Show all Sessions</button>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default AdminDashboard;
