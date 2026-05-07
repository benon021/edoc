// =============================================================
// FILE: RegistrarPatients.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, Search, CalendarPlus, User, Phone, Fingerprint, RefreshCw, 
    AlertTriangle, Edit, Trash2, X, Save, Thermometer, Info, ShieldCheck, 
    CreditCard, Camera, MapPin, Heart, Activity, Droplets, Wind, CheckCircle
} from 'lucide-react';
import Select from 'react-select';
import { useNotification } from '../../components/NotificationContext';
import { getPatients, getDoctors, deletePatient, updatePatient, bookAppointment } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const RegistrarPatients = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    
    const [patients, setPatients] = useState([]);
    const [selectedPatients, setSelectedPatients] = useState(new Set());
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { showNotification } = useNotification();
    
    // Modal States
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [editData, setEditData] = useState({});
    
// Booking State
    const [doctors, setDoctors] = useState([]);
    const [bookingData, setBookingData] = useState({ docid: '', reason: '', type: 'instant', date: '', time: '' });
    const [bookingLoading, setBookingLoading] = useState(false);
    
    // Custom Alert State
    const [alert, setAlert] = useState({ show: false, title: '', message: '', type: 'info' });

    const fetchDoctorsList = async () => {
        try {
            const { data, error } = await supabase
                .from('doctor')
                .select('docid, docname, specialties');
            
            if (error) throw error;
            if (data) setDoctors(data);
        } catch (err) { 
            console.error('Fetch doctors error:', err); 
        }
    };

    const fetchPatients = async () => {
        setLoading(true);
        setError(null);
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('patient')
                .select(`
                    *,
                    appointment:appointment (
                        appoid,
                        appodate,
                        status
                    )
                `);
            
            if (error) throw error;
            if (data) {
                // FILTER: Only show patients who do NOT have an appointment TODAY
                const unbookedPatients = data.filter(p => {
                    const hasTodayAppo = p.appointment?.some(a => a.appodate === today);
                    return !hasTodayAppo;
                });

                // Sort chronologically in the queue (oldest first)
                // Use the earliest known timestamp fields if present.
                const toTime = (p) => {
                    // appointment rows should include appodate when loaded via join above
                    if (p.appointment?.[0]?.appodate) return new Date(p.appointment[0].appodate).getTime();
                    if (p.pdate_registered) return new Date(p.pdate_registered).getTime();
                    if (p.created_at) return new Date(p.created_at).getTime();
                    return 0;
                };

                const sorted = [...unbookedPatients].sort((a, b) => toTime(a) - toTime(b));
                setPatients(sorted);
            }
        } catch (err) {
            console.error('Fetch patients error:', err);
            setError("Network error. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctorsList();
        fetchPatients();
    }, []); 

    const showAlert = (title, message, type = 'info') => {
        setAlert({ show: true, title, message, type });
        if (type === 'success') {
            setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 3000);
        }
    };

    const confirmDelete = (patient) => {
        setSelectedPatient(patient);
        setDeleteModalOpen(true);
    };

    const openBookingModal = (patient) => {
        setSelectedPatient(patient);
        setIsBulkMode(false);
        setBookingModalOpen(true);
    };

    const openBulkBookingModal = () => {
        setIsBulkMode(true);
        setBookingModalOpen(true);
    };

    const handleDelete = async () => {
        const pid = selectedPatient.pid;
        setDeleteModalOpen(false);
        try {
            const { error } = await deletePatient(pid);
            if (!error) {
                showAlert("Deleted", "Patient record has been permanently removed.", "success");
                fetchPatients();
            } else {
                showAlert("Error", "Failed to delete patient record.", "error");
            }
        } catch (err) {
            showAlert("Error", "Network error while deleting.", "error");
        }
    };

    const openEditModal = (patient) => {
        setSelectedPatient(patient);
        setEditData({ ...patient });
        setEditModalOpen(true);
    };

    const togglePatientSelection = (pid) => {
        const newSelected = new Set(selectedPatients);
        if (newSelected.has(pid)) newSelected.delete(pid);
        else newSelected.add(pid);
        setSelectedPatients(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedPatients.size === filteredPatients.length) {
            setSelectedPatients(new Set());
        } else {
            setSelectedPatients(new Set(filteredPatients.map(p => p.pid)));
        }
    };

    const handleQuickBook = async (e) => {
        e.preventDefault();
        if (!bookingData.docid) {
            showAlert("Error", "Please select a consultant.", "error");
            return;
        }

        setBookingLoading(true);
        try {
            const pidsToBook = isBulkMode ? Array.from(selectedPatients) : [selectedPatient.pid];
            let successCount = 0;
            let errors = [];

            const payloadDate = bookingData.type === 'instant' ? new Date().toISOString().split('T')[0] : bookingData.date;

            // Fetch the doctor's schedule to get the scheduleid
            let { data: schedules, error: scheduleError } = await supabase
                .from('schedule')
                .select('scheduleid, nop')
                .eq('docid', bookingData.docid)
                .eq('scheduledate', payloadDate);
            
            if (scheduleError) {
                console.error('Error fetching schedule:', scheduleError);
                showAlert("Error", "Could not verify doctor schedule.", "error");
                setBookingLoading(false);
                return;
            }

            let schedId;
            if (!schedules || schedules.length === 0) {
                // Create new schedule if none exists
                const { data: newSched, error: insertError } = await supabase.from('schedule').insert([{
                    docid: bookingData.docid,
                    scheduledate: payloadDate,
                    title: 'Auto-Generated Session',
                    nop: pidsToBook.length
                }]).select().single();
                
                if (insertError) {
                    console.error('Error creating schedule:', insertError);
                    showAlert("Booking Failed", `Could not create session: ${insertError.message}`, "error");
                    setBookingLoading(false);
                    return;
                }
                schedId = newSched?.scheduleid;
            } else {
                schedId = schedules[0].scheduleid;
                // Update nop (Number of Patients)
                await supabase.from('schedule')
                    .update({ nop: (schedules[0].nop || 0) + pidsToBook.length })
                    .eq('scheduleid', schedId);
            }

            for (const pid of pidsToBook) {
                const { data, error } = await bookAppointment({
                    pid,
                    docid: bookingData.docid,
                    scheduleid: schedId,
                    appodate: payloadDate,
                    status: 'waiting'
                });

                if (!error) {
                    // Create an empty consultation draft with the reason
                    await supabase.from('consultations').insert({
                        appointment_id: data.appoid,
                        pid: pid,
                        docid: bookingData.docid,
                        consultation_date: payloadDate,
                        chief_complaint: bookingData.reason,
                        status: 'draft'
                    });
                    successCount++;
                } else {
                    console.error(`Booking error for patient ${pid}:`, error);
                    errors.push(`Failed for patient ID ${pid} (${error.message})`);
                }
            }

            if (successCount > 0) {
                setBookingModalOpen(false);
                showAlert("Success", `Handover Complete for ${successCount} patient(s)! They are now in the clinical queue.`, "success");
                
                // Refresh patient list (removes booked patients) + redirect
                fetchPatients();
                
                // Keep the operator in the same patient directory flow
                // (do not redirect to registrar history / other routing).
            }
            if (errors.length > 0) {
                showAlert("Warning", `Some bookings failed: ${errors.join(', ')}`, "warning");
            }
        } catch (err) {
            console.error(err);
            showAlert("Error", "An unexpected error occurred during booking.", "error");
        } finally {
            setBookingLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            // Clean data: convert empty strings to null
            const cleanedData = Object.fromEntries(
                Object.entries(editData).map(([key, value]) => [key, value === "" ? null : value])
            );
            
            const { error } = await updatePatient(selectedPatient.pid, cleanedData);
            if (!error) {
                setEditModalOpen(false);
                showAlert("Success", "Patient record updated successfully.", "success");
                fetchPatients();
            } else {
                showAlert("Update Failed", error.message, "error");
            }
        } catch (err) {
            showAlert("Error", "Network error during update.", "error");
        }
    };

    const filteredPatients = patients.filter(p => 
        (p.pname?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (p.ptel || '').includes(searchQuery) ||
        (p.patient_display_id?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    const SectionHeader = ({ icon: Icon, title }) => (
        <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
            {Icon && <Icon size={18} color="var(--primary)" />} {title}
        </h3>
    );

    const customSelectStyles = {
        control: (base) => ({
            ...base,
            padding: '2px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            boxShadow: 'none',
            fontSize: '0.875rem',
            '&:hover': { border: '1px solid #3b82f6' }
        })
    };

    return (
        <div style={{ padding: '48px 64px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
                <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Users size={28} color="var(--primary)" /> Patient Booking & Directory
                            {selectedPatients.size > 0 && (
                                <span style={{ 
                                    fontSize: '0.875rem', background: '#ff7200', color: 'white', 
                                    padding: '4px 12px', borderRadius: '100px', fontWeight: '800',
                                    animation: 'pulse 2s infinite'
                                }}>
                                    {selectedPatients.size} SELECTED
                                </span>
                            )}
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>Manage records, routing, and clinical bookings for all patients.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {selectedPatients.size > 0 && (
                            <button onClick={openBulkBookingModal} className="btn-primary" style={{ background: '#ff7200', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                                <Users size={18} /> Bulk Handover ({selectedPatients.size})
                            </button>
                        )}
                        <button onClick={fetchPatients} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#475569' }}>
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                        <button onClick={() => navigate('/registrar/new-patient')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                            <CalendarPlus size={20} /> Register New
                        </button>
                    </div>
                </header>

                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            placeholder="Search by name, ID, or phone..." 
                            className="input-field" 
                            style={{ paddingLeft: '48px', fontSize: '1rem' }} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                            <tr>
                                <th style={{ padding: '16px 24px', width: '40px' }}>
                                    <div 
                                        onClick={toggleSelectAll}
                                        style={{ 
                                            width: '20px', height: '20px', borderRadius: '6px', 
                                            border: '2px solid #cbd5e1', background: selectedPatients.size === filteredPatients.length && filteredPatients.length > 0 ? '#ff7200' : 'white',
                                            borderColor: selectedPatients.size === filteredPatients.length && filteredPatients.length > 0 ? '#ff7200' : '#cbd5e1',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        {selectedPatients.size === filteredPatients.length && filteredPatients.length > 0 && <CheckCircle size={14} color="white" />}
                                    </div>
                                </th>
                                <th style={{ textAlign: 'left', padding: '16px 24px', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Queue #</th>
                                <th style={{ textAlign: 'left', padding: '16px 24px', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Patient Details</th>
                                <th style={{ textAlign: 'left', padding: '16px 24px', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Identification</th>
                                <th style={{ textAlign: 'center', padding: '16px 24px', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Visits</th>
                                <th style={{ textAlign: 'center', padding: '16px 24px', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Loading...</td></tr>
                            ) : filteredPatients.length > 0 ? (
                                filteredPatients.map((p, index) => (
                                    <tr key={p.pid} style={{ borderBottom: '1px solid var(--border)', transition: 'all 0.2s', background: selectedPatients.has(p.pid) ? '#fff7ed' : 'transparent', borderLeft: selectedPatients.has(p.pid) ? '4px solid #ff7200' : '4px solid transparent' }} className="hover-row">
                                        <td style={{ padding: '16px 24px' }}>
                                            <div 
                                                onClick={() => togglePatientSelection(p.pid)}
                                                style={{ 
                                                    width: '20px', height: '20px', borderRadius: '6px', 
                                                    border: '2px solid #cbd5e1', background: selectedPatients.has(p.pid) ? '#ff7200' : 'white',
                                                    borderColor: selectedPatients.has(p.pid) ? '#ff7200' : '#cbd5e1',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                                                }}
                                            >
                                                {selectedPatients.has(p.pid) && <CheckCircle size={14} color="white" />}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '0.875rem' }}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{p.pname}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.pgender} • {p.ptel}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontSize: '0.875rem', color: '#475569', fontWeight: '500' }}>{p.patient_display_id}</div>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '700' }}>
                                                <Activity size={12} /> {p.appointment?.length || 0}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <button 
                                                    onClick={() => openBookingModal(p)} 
                                                    disabled={profile?.role === 'a'}
                                                    style={{ 
                                                        padding: '8px 12px', 
                                                        background: profile?.role === 'a' ? '#e2e8f0' : '#ff7200', 
                                                        color: profile?.role === 'a' ? '#94a3b8' : 'white', 
                                                        border: 'none', 
                                                        borderRadius: '6px', 
                                                        cursor: profile?.role === 'a' ? 'not-allowed' : 'pointer', 
                                                        fontSize: '0.8125rem', 
                                                        fontWeight: '600' 
                                                    }}
                                                    title={profile?.role === 'a' ? 'Clinical handover must be performed by a Registrar' : 'Book Appointment'}
                                                >
                                                    Book
                                                </button>
                                                <button onClick={() => openEditModal(p)} style={{ padding: '8px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#475569' }} title="Edit Details"><Edit size={16} /></button>
                                                <button onClick={() => confirmDelete(p)} style={{ padding: '8px', background: '#fef2f2', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#dc2626' }} title="Delete Record"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>No records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Edit Modal - Comprehensive View */}
                {editModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '20px' }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '1000px', maxHeight: '90vh', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                            {/* Modal Header */}
                            <div style={{ padding: '24px 40px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>Update Patient Record</h2>
                                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Editing details for {editData.pname} ({editData.patient_display_id})</p>
                                </div>
                                <button onClick={() => setEditModalOpen(false)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                            </div>

                            {/* Modal Body (Scrollable) */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                                <form id="editForm" onSubmit={handleUpdate}>
                                    
                                    {/* BASIC INFO */}
                                    <section style={{ padding: '24px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                                        <SectionHeader icon={User} title="Basic Information" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label className="label-text">Full Name</label>
                                                <input type="text" className="input-field" value={editData.pname} onChange={(e) => setEditData({...editData, pname: e.target.value})} required />
                                            </div>
                                            <div>
                                                <label className="label-text">Date of Birth</label>
                                                <input type="date" className="input-field" value={editData.pdob} onChange={(e) => setEditData({...editData, pdob: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="label-text">Gender</label>
                                                <Select options={[{value:'Male',label:'Male'},{value:'Female',label:'Female'},{value:'Other',label:'Other'}]} value={{value:editData.pgender,label:editData.pgender}} onChange={(opt) => setEditData({...editData, pgender: opt.value})} styles={customSelectStyles} />
                                            </div>
                                            <div>
                                                <label className="label-text">Marital Status</label>
                                                <Select options={[{value:'Single',label:'Single'},{value:'Married',label:'Married'},{value:'Divorced',label:'Divorced'},{value:'Widowed',label:'Widowed'}]} value={{value:editData.pmarital,label:editData.pmarital}} onChange={(opt) => setEditData({...editData, pmarital: opt.value})} styles={customSelectStyles} />
                                            </div>
                                        </div>
                                    </section>

                                    {/* CONTACT */}
                                    <section style={{ padding: '24px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', marginTop: '20px' }}>
                                        <SectionHeader icon={Phone} title="Contact & Address" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label className="label-text">Phone Number</label>
                                                <input type="text" className="input-field" value={editData.ptel} onChange={(e) => setEditData({...editData, ptel: e.target.value})} required />
                                            </div>
                                            <div>
                                                <label className="label-text">Alternate Phone</label>
                                                <input type="text" className="input-field" value={editData.palttel} onChange={(e) => setEditData({...editData, palttel: e.target.value})} />
                                            </div>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label className="label-text">Email Address</label>
                                                <input type="email" className="input-field" value={editData.pemail} onChange={(e) => setEditData({...editData, pemail: e.target.value})} />
                                            </div>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label className="label-text">Physical Address</label>
                                                <textarea className="input-field" rows="2" value={editData.paddress} onChange={(e) => setEditData({...editData, paddress: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="label-text">City</label>
                                                <input type="text" className="input-field" value={editData.pcity} onChange={(e) => setEditData({...editData, pcity: e.target.value})} />
                                            </div>
                                        </div>
                                    </section>

                                    {/* MEDICAL */}
                                    <section style={{ padding: '24px', borderRadius: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', marginTop: '20px' }}>
                                        <SectionHeader icon={Droplets} title="Medical Background" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label className="label-text">Blood Group</label>
                                                <Select options={['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=>({value:g,label:g}))} value={{value:editData.pbloodgroup,label:editData.pbloodgroup}} onChange={(opt) => setEditData({...editData, pbloodgroup: opt.value})} styles={customSelectStyles} />
                                            </div>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label className="label-text">Allergies</label>
                                                <textarea className="input-field" rows="2" value={editData.pallergies} onChange={(e) => setEditData({...editData, pallergies: e.target.value})} />
                                            </div>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label className="label-text">Existing Conditions</label>
                                                <textarea className="input-field" rows="2" value={editData.pconditions} onChange={(e) => setEditData({...editData, pconditions: e.target.value})} />
                                            </div>
                                        </div>
                                    </section>

                                    {/* VITALS */}
                                    <section style={{ padding: '24px', borderRadius: '16px', background: '#f0f9ff', border: '1px solid #bae6fd', marginTop: '20px' }}>
                                        <SectionHeader icon={Thermometer} title="Vital Signs (Last Recorded)" />
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                            <div>
                                                <label className="label-text">Temp (°C)</label>
                                                <input type="text" className="input-field" value={editData.ptemp} onChange={(e) => setEditData({...editData, ptemp: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="label-text">BP</label>
                                                <input type="text" className="input-field" value={editData.pbp} onChange={(e) => setEditData({...editData, pbp: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="label-text">Weight (kg)</label>
                                                <input type="text" className="input-field" value={editData.pweight} onChange={(e) => setEditData({...editData, pweight: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="label-text">Height (cm)</label>
                                                <input type="text" className="input-field" value={editData.pheight} onChange={(e) => setEditData({...editData, pheight: e.target.value})} />
                                            </div>
                                        </div>
                                    </section>

                                    {/* EMERGENCY */}
                                    <section style={{ padding: '24px', borderRadius: '16px', background: '#fffbeb', border: '1px solid #fde68a', marginTop: '20px' }}>
                                        <SectionHeader icon={ShieldCheck} title="Emergency Contact" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label className="label-text">Contact Name</label>
                                                <input type="text" className="input-field" value={editData.pemergency_name} onChange={(e) => setEditData({...editData, pemergency_name: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="label-text">Contact Phone</label>
                                                <input type="text" className="input-field" value={editData.pemergency_phone} onChange={(e) => setEditData({...editData, pemergency_phone: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="label-text">Relation</label>
                                                <input type="text" className="input-field" value={editData.pemergency_relation} onChange={(e) => setEditData({...editData, pemergency_relation: e.target.value})} />
                                            </div>
                                        </div>
                                    </section>

                                    {/* INSURANCE */}
                                    <section style={{ padding: '24px', borderRadius: '16px', background: '#f5f3ff', border: '1px solid #ddd6fe', marginTop: '20px' }}>
                                        <SectionHeader icon={CreditCard} title="Payment & Insurance" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label className="label-text">Payment Type</label>
                                                <Select options={[{value:'Cash',label:'Cash'},{value:'Card',label:'Card'},{value:'Insurance',label:'Insurance'}]} value={{value:editData.ppayment,label:editData.ppayment}} onChange={(opt) => setEditData({...editData, ppayment: opt.value})} styles={customSelectStyles} />
                                            </div>
                                            <div>
                                                <label className="label-text">Provider</label>
                                                <input type="text" className="input-field" value={editData.pinsurance_provider} onChange={(e) => setEditData({...editData, pinsurance_provider: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="label-text">Policy #</label>
                                                <input type="text" className="input-field" value={editData.pinsurance_number} onChange={(e) => setEditData({...editData, pinsurance_number: e.target.value})} />
                                            </div>
                                        </div>
                                    </section>
                                </form>
                            </div>

                            {/* Modal Footer */}
                            <div style={{ padding: '24px 40px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                                <button type="button" onClick={() => setEditModalOpen(false)} style={{ padding: '12px 24px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Discard Changes</button>
                                <button type="submit" form="editForm" className="btn-primary" style={{ padding: '12px 40px', display: 'flex', alignItems: 'center', gap: '8px' }}><Save size={20} /> Save Full Record</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Delete Confirmation Modal */}
                {deleteModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(12px)' }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                            <div style={{ width: '64px', height: '64px', background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', margin: '0 auto 20px' }}>
                                <Trash2 size={32} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>Confirm Deletion</h3>
                            <p style={{ color: '#64748b', marginBottom: '32px', lineHeight: '1.6' }}>
                                Are you sure you want to remove <strong>{selectedPatient?.pname}</strong>? This action cannot be undone and all clinical records will be lost.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setDeleteModalOpen(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '12px', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={handleDelete} style={{ flex: 1, padding: '12px', background: '#dc2626', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Delete Now</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Alert/Notification Toast */}
                {alert.show && (
                    <div style={{ position: 'fixed', bottom: '40px', right: '40px', background: alert.type === 'error' ? '#dc2626' : alert.type === 'success' ? '#059669' : '#3b82f6', color: 'white', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 2000, animation: 'slideIn 0.3s ease-out' }}>
                        {alert.type === 'success' ? <Save size={20} /> : <AlertTriangle size={20} />}
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{alert.title}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{alert.message}</div>
                        </div>
                        <button onClick={() => setAlert({ ...alert, show: false })} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}><X size={18} /></button>
                    </div>
                )}
                
                {/* Quick Booking Modal */}
                {bookingModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(10px)' }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                            <div style={{ padding: '32px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b' }}>Consultation Handover</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                                        {isBulkMode ? (
                                            <>Handing over <strong>{selectedPatients.size}</strong> selected patients</>
                                        ) : (
                                            <>Assigning <strong>{selectedPatient?.pname}</strong></>
                                        )}
                                    </p>
                                </div>
                                <button onClick={() => setBookingModalOpen(false)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>
                            </div>
                            
                            <form onSubmit={handleQuickBook} style={{ padding: '32px' }}>
                                <label className="label-text">Select Consultant</label>
                                <div style={{ display: 'grid', gap: '12px', maxHeight: '200px', overflowY: 'auto', marginBottom: '24px', paddingRight: '4px' }}>
                                    {doctors.map(d => (
                                        <div 
                                            key={d.docid}
                                            onClick={() => setBookingData({...bookingData, docid: d.docid})}
                                            style={{ 
                                                padding: '16px', borderRadius: '16px', border: bookingData.docid === d.docid ? '2px solid #ff7200' : '1px solid #e2e8f0',
                                                background: bookingData.docid === d.docid ? '#fff7ed' : 'white', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: bookingData.docid === d.docid ? '#ff7200' : '#94a3b8', textTransform: 'uppercase' }}>{d.specialties || 'General'}</div>
                                                <div style={{ fontWeight: '700', color: '#1e293b' }}>Dr. {d.docname}</div>
                                            </div>
                                            {bookingData.docid === d.docid && <CheckCircle size={20} color="#ff7200" />}
                                        </div>
                                    ))}
                                </div>

                                <label className="label-text">Clinical Notes (Optional)</label>
                                <textarea className="input-field" rows="2" value={bookingData.reason} onChange={(e) => setBookingData({...bookingData, reason: e.target.value})} placeholder="Reason for consultation..." style={{ marginBottom: '32px' }} />

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button type="button" onClick={() => setBookingModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#f1f5f9', fontWeight: '700', color: '#475569', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" disabled={bookingLoading} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: '#ff7200', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        {bookingLoading ? 'Sending...' : <><Save size={18} /> Confirm Handover</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                
                <style>{`
                    .hover-row:hover { background-color: #f8fafc; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    .animate-spin { animation: spin 1s linear infinite; }
                    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                    .input-field { width: 100%; padding: 10px 16px; border: 1px solid #cbd5e1; borderRadius: 10px; font-size: 0.875rem; transition: all 0.2s; background: white; }
                    .input-field:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
                    .label-text { display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.025em; }
                    
                    /* Custom Scrollbar for Modal */
                    ::-webkit-scrollbar { width: 8px; }
                    ::-webkit-scrollbar-track { background: #f1f5f9; }
                    ::-webkit-scrollbar-thumb { background: #cbd5e1; borderRadius: 4px; }
                    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                `}</style>
                <style>{`
                    @keyframes pulse {
                        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 114, 0, 0.4); }
                        70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(255, 114, 0, 0); }
                        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 114, 0, 0); }
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .animate-spin { animation: spin 2s linear infinite; }
                    .hover-row:hover { background-color: #f8fafc !important; }
                `}</style>
        </div>
    );
};

export default RegistrarPatients;
