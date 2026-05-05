// =============================================================
// FILE: RegistrarHistory.jsx
// PURPOSE: React component for viewing patient history.
// =============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { Search, Clock, ChevronRight, Activity, Calendar, FlaskConical, Pill, ArrowRight, UserPlus, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const RegistrarHistory = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingData, setBookingData] = useState({ docid: '' });
    const [bookingError, setBookingError] = useState('');

    useEffect(() => {
        fetchDoctors();
        fetchPatients();
    }, []);

    const fetchDoctors = async () => {
        try {
            const { data, error } = await supabase.from('doctor').select('docid, docname, specialties');
            if (data) setDoctors(data);
        } catch (err) {
            console.error('Error fetching doctors:', err);
        }
    };

    const fetchPatients = async () => {
        try {
            setLoading(true);
            
            // Get patients who have an active appointment
            const { data: appointments, error } = await supabase
                .from('appointment')
                .select('appoid, status, patient:pid(*), doctor:docid(docname)')
                .in('status', ['waiting', 'in_consultation', 'pending_lab']);
                
            if (appointments) {
                // Map the appointments to patient objects with appointment info attached
                const bookedPatients = appointments.map(app => ({
                    ...app.patient,
                    appointment: {
                        appoid: app.appoid,
                        status: app.status,
                        doctor_name: app.doctor?.docname
                    }
                }));
                
                // Deduplicate by pid (in case a patient has multiple active appointments)
                const uniquePatients = Array.from(new Map(bookedPatients.map(p => [p.pid, p])).values());
                setPatients(uniquePatients);
            }
        } catch (err) {
            console.error('Error fetching booked patients:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleHandoverClick = (patient) => {
        setSelectedPatient(patient);
        setBookingError('');
        setBookingData({ docid: '' });
        setShowBookingModal(true);
    };

    const confirmBooking = async () => {
        if (!bookingData.docid) {
            setBookingError('Please select a doctor to handover the patient.');
            return;
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            const appointmentId = selectedPatient.appointment?.appoid;

            if (!appointmentId) throw new Error("No active appointment found to update.");
            
            // 1. Get or create schedule for this doctor today
            let scheduleId;
            const { data: existingSchedule } = await supabase
                .from('schedule')
                .select('scheduleid, nop')
                .eq('docid', bookingData.docid)
                .eq('scheduledate', today)
                .single();
                
            if (existingSchedule) {
                scheduleId = existingSchedule.scheduleid;
                await supabase.from('schedule').update({ nop: existingSchedule.nop + 1 }).eq('scheduleid', scheduleId);
            } else {
                const { data: newSchedule } = await supabase
                    .from('schedule')
                    .insert([{ docid: bookingData.docid, title: 'Session', scheduledate: today, nop: 1 }])
                    .select('scheduleid')
                    .single();
                scheduleId = newSchedule.scheduleid;
            }
            
            // 2. UPDATE the existing appointment (Change Doctor)
            const { error } = await supabase
                .from('appointment')
                .update({
                    docid: bookingData.docid,
                    scheduleid: scheduleId
                })
                .eq('appoid', appointmentId);

            if (error) throw error;

            // 3. Update the consultation record too
            await supabase
                .from('consultations')
                .update({ doctor_id: bookingData.docid })
                .eq('appointment_id', appointmentId);
            
            setShowBookingModal(false);
            fetchPatients();
        } catch (err) {
            setBookingError(err.message || 'Failed to change doctor.');
        }
    };

    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.pname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              p.patient_display_id?.toLowerCase().includes(searchQuery.toLowerCase());
        const status = p.appointment?.status || 'unknown';
        if (activeTab === 'all') return matchesSearch;
        if (activeTab === 'waiting') return matchesSearch && status === 'waiting';
        if (activeTab === 'consulting') return matchesSearch && status === 'in_consultation';
        if (activeTab === 'lab') return matchesSearch && status === 'pending_lab';
        return matchesSearch;
    });

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar userType="r" />
            <main style={{ flex: 1, padding: '48px 64px' }}>
                <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <ListOrdered color="var(--primary)" size={28} /> Clinical History & Handover
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Track patient journeys and manage department handovers.</p>
                    </div>
                </header>

                {/* Tabs & Search */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'white', padding: '16px 24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {[ 
                            { id: 'all', label: 'All Active' },
                            { id: 'waiting', label: 'Waiting Area' },
                            { id: 'consulting', label: 'In Consultation' },
                            { id: 'lab', label: 'At Laboratory' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    background: activeTab === tab.id ? '#2563eb' : 'transparent',
                                    color: activeTab === tab.id ? 'white' : '#64748b',
                                    boxShadow: activeTab === tab.id ? '0 4px 6px -1px rgba(37, 99, 235, 0.2)' : 'none',
                                    transition: '0.2s'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search active patients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                        />
                    </div>
                </div>

                {/* Data Grid */}
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Patient Info</th>
                                <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Current Stage</th>
                                <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Assigned Doctor</th>
                                <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Loading active clinical cycles...</td></tr>
                            ) : filteredPatients.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>No patients found in the current view.</td></tr>
                            ) : (
                                filteredPatients.map(patient => (
                                    <tr key={patient.pid} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontWeight: '700', color: '#1e293b' }}>{patient.pname}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>ID: {patient.patient_display_id}</div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                                                {patient.appointment?.status === 'waiting' && <><Clock size={16} color="#f59e0b"/> <span style={{color: '#d97706'}}>Waiting Area</span></>}
                                                {patient.appointment?.status === 'in_consultation' && <><Activity size={16} color="#3b82f6"/> <span style={{color: '#2563eb'}}>In Consultation</span></>}
                                                {patient.appointment?.status === 'pending_lab' && <><FlaskConical size={16} color="#8b5cf6"/> <span style={{color: '#7c3aed'}}>Laboratory</span></>}
                                                {!['waiting', 'in_consultation', 'pending_lab'].includes(patient.appointment?.status) && <span style={{color: '#64748b'}}>{patient.appointment?.status || 'Unknown'}</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', fontWeight: '600', color: '#475569' }}>
                                            {patient.appointment?.doctor_name ? `Dr. ${patient.appointment.doctor_name}` : 'Not Assigned'}
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <button 
                                                onClick={() => handleHandoverClick(patient)}
                                                style={{ padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: '0.2s' }}
                                                onMouseOver={(e) => e.currentTarget.style.borderColor = '#94a3b8'}
                                                onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                            >
                                                Change Doctor <ChevronRight size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Handover / Re-Route Modal */}
            {showBookingModal && selectedPatient && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', width: '500px', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'slideUp 0.3s ease-out' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Re-Route Patient</h2>
                        <p style={{ color: '#64748b', marginBottom: '24px' }}>Transfer <strong>{selectedPatient.pname}</strong> to another clinical department or doctor.</p>
                        
                        {bookingError && (
                            <div style={{ padding: '12px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '16px' }}>
                                {bookingError}
                            </div>
                        )}

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Assign Doctor / Specialist</label>
                            <select 
                                value={bookingData.docid} 
                                onChange={(e) => setBookingData({...bookingData, docid: e.target.value})}
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
                            >
                                <option value="">-- Select Available Doctor --</option>
                                {doctors.map(doc => (
                                    <option key={doc.docid} value={doc.docid}>Dr. {doc.docname} ({doc.specialties || 'General'})</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
                            <button onClick={() => setShowBookingModal(false)} style={{ padding: '12px 24px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={confirmBooking} style={{ padding: '12px 24px', background: '#ff7200', border: 'none', borderRadius: '10px', fontWeight: '700', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Confirm Handover <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
    );
};

// Simple stub for ListOrdered icon since it wasn't imported directly above
const ListOrdered = ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>
);

export default RegistrarHistory;
