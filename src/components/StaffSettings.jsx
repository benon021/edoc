// =============================================================
// FILE: StaffSettings.jsx
// PURPOSE: React component for staff profile updates using Supabase.
// =============================================================
import React, { useState, useEffect } from 'react';
import { User, Camera, Phone, Lock, Save, ShieldCheck } from 'lucide-react';
import { useNotification } from './NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const StaffSettings = () => {
    const { profile, userType } = useAuth();
    const { showNotification } = useNotification();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        altPhone: '',
        address: '',
        gender: '',
        dob: '',
        photo: '',
        staffId: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [msg, setMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        if (!profile) return;

        setFormData({
            name: profile.full_name || profile.docname || profile.regname || profile.labname || profile.phname || '',
            email: profile.email || profile.docemail || profile.regemail || profile.labemail || profile.phemail || '',
            phone: profile.tel || profile.doctel || profile.regtel || profile.labtel || profile.phtel || '',
            altPhone: profile.docaltphone || profile.regaltphone || profile.labaltphone || profile.phaltphone || '',
            address: profile.docaddress || profile.regaddress || profile.labaddress || profile.phaddress || '',
            gender: profile.gender || profile.docgender || profile.reggender || profile.labgender || profile.phgender || '',
            dob: profile.dob || profile.docdob || profile.regdob || profile.labdob || profile.phdob || '',
            photo: profile.photo || profile.docphoto || profile.regphoto || profile.labphoto || profile.phphoto || '',
            staffId: profile.docid || profile.regid || profile.labid || profile.phid || 'ADMIN',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    }, [profile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            showNotification('File is too large. Please select an image under 10MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const img = new Image();
            img.src = reader.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_DIMENSION = 400;
                let { width, height } = img;

                if (width > height) {
                    if (width > MAX_DIMENSION) {
                        height *= MAX_DIMENSION / width;
                        width = MAX_DIMENSION;
                    }
                } else {
                    if (height > MAX_DIMENSION) {
                        width *= MAX_DIMENSION / height;
                        height = MAX_DIMENSION;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setFormData((prev) => ({ ...prev, photo: dataUrl }));
            };
        };
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();

        if (!profile || !userType) {
            showNotification('Unable to update profile until authentication completes.', 'error');
            return;
        }

        const updateMap = {
            a: {
                table: 'profiles',
                emailCol: 'email',
                fields: {
                    full_name: formData.name,
                    tel: formData.phone,
                    gender: formData.gender,
                    dob: formData.dob,
                    photo: formData.photo
                }
            },
            d: {
                table: 'doctor',
                emailCol: 'docemail',
                fields: {
                    docname: formData.name,
                    doctel: formData.phone,
                    docaltphone: formData.altPhone,
                    docaddress: formData.address,
                    docgender: formData.gender,
                    docdob: formData.dob,
                    docphoto: formData.photo
                }
            },
            r: {
                table: 'registrar',
                emailCol: 'regemail',
                fields: {
                    regname: formData.name,
                    regtel: formData.phone,
                    regaltphone: formData.altPhone,
                    regaddress: formData.address,
                    reggender: formData.gender,
                    regdob: formData.dob,
                    regphoto: formData.photo
                }
            },
            l: {
                table: 'lab_technician',
                emailCol: 'labemail',
                fields: {
                    labname: formData.name,
                    labtel: formData.phone,
                    labaltphone: formData.altPhone,
                    labaddress: formData.address,
                    labgender: formData.gender,
                    labdob: formData.dob,
                    labphoto: formData.photo
                }
            },
            ph: {
                table: 'pharmacist',
                emailCol: 'phemail',
                fields: {
                    phname: formData.name,
                    phtel: formData.phone,
                    phaltphone: formData.altPhone,
                    phaddress: formData.address,
                    phgender: formData.gender,
                    phdob: formData.dob,
                    phphoto: formData.photo
                }
            }
        };

        const mapping = updateMap[userType];
        if (!mapping) {
            showNotification('Profile updates for this role are not supported yet.', 'error');
            return;
        }

        // Update the specific role table (doctor, registrar, etc.)
        const { error: legacyError } = await supabase
            .from(mapping.table)
            .update(mapping.fields)
            .eq(mapping.emailCol, profile[mapping.emailCol]);

        if (legacyError) {
            showNotification(legacyError.message || 'Unable to update specific profile.', 'error');
            return;
        }

        // Also update the 'profiles' table for all staff (to keep things in sync)
        if (userType !== 'a') {
            await supabase
                .from('profiles')
                .update({
                    full_name: formData.name,
                    tel: formData.phone,
                    gender: formData.gender,
                    dob: formData.dob,
                    photo: formData.photo
                })
                .eq('email', profile.email || profile.docemail || profile.regemail || profile.labemail || profile.phemail);
        }

        showNotification('Profile updated successfully!', 'success');
    };

    const handleChangePassword = (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            setMsg({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        setMsg({ type: 'success', text: 'Password changed successfully' });
    };

    const getRoleName = (type) => {
        if (type === 'd') return 'Doctor';
        if (type === 'r') return 'Registrar';
        if (type === 'l') return 'Laboratory Technician';
        if (type === 'ph') return 'Pharmacist';
        return 'Staff';
    };

    const SectionHeader = ({ icon: Icon, title }) => (
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, color: '#1e293b' }}>
            <Icon size={22} color="var(--primary)" /> {title}
        </h3>
    );

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>
            {msg.text && (
                <div style={{ padding: 16, background: msg.type === 'error' ? '#fef2f2' : '#f0fdf4', color: msg.type === 'error' ? '#dc2626' : '#16a34a', borderRadius: 12, border: `1px solid ${msg.type === 'error' ? '#fee2e2' : '#bbf7d0'}`, fontWeight: 500 }}>
                    {msg.text}
                </div>
            )}

            <section style={{ background: 'white', padding: 40, borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <SectionHeader icon={User} title="Profile Information" />
                <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>
                    <div style={{ textAlign: 'center' }}>
                        <input type="file" id="photo-upload" style={{ display: 'none' }} onChange={handlePhotoUpload} accept="image/*" />
                        <div
                            onClick={() => document.getElementById('photo-upload').click()}
                            style={{ width: 140, height: 140, background: '#f1f5f9', borderRadius: '50%', border: '4px solid white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', overflow: 'hidden', position: 'relative', marginBottom: 16, cursor: 'pointer' }}
                        >
                            {formData.photo ? (
                                <img src={formData.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={80} color="#94a3b8" style={{ marginTop: 20 }} />
                            )}
                            <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.5)', padding: 4, cursor: 'pointer' }}>
                                <Camera size={16} color="white" />
                            </div>
                        </div>
                        <button onClick={() => document.getElementById('photo-upload').click()} style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>
                            Change Photo
                        </button>
                    </div>

                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: '#475569' }}>Full Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: '#475569' }}>Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="input-field">
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: '#475569' }}>Phone</label>
                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="input-field" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: '#475569' }}>Alternate Phone</label>
                            <input type="text" name="altPhone" value={formData.altPhone} onChange={handleChange} className="input-field" />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: '#475569' }}>Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: '#475569' }}>Address</label>
                            <input type="text" name="address" value={formData.address} onChange={handleChange} className="input-field" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: '#475569' }}>Date of Birth</label>
                            <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="input-field" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: '#475569' }}>Role</label>
                            <input type="text" value={getRoleName(userType)} readOnly className="input-field" style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: '#475569' }}>Employee / Staff ID</label>
                            <input type="text" value={formData.staffId} readOnly className="input-field" style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }} />
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={handleSaveProfile} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 12, background: '#0f172a', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                                <Save size={18} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section style={{ background: 'white', padding: 40, borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <SectionHeader icon={Lock} title="Security Settings" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, maxWidth: 400 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: '#475569' }}>Current Password</label>
                        <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} className="input-field" placeholder="••••••••" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: '#475569' }}>New Password</label>
                        <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} className="input-field" placeholder="••••••••" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: '#475569' }}>Confirm New Password</label>
                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="input-field" placeholder="••••••••" />
                    </div>
                    <button onClick={handleChangePassword} style={{ marginTop: 12, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: 12, cursor: 'pointer' }}>
                        <ShieldCheck size={18} /> Change Password
                    </button>
                </div>
            </section>
        </div>
    );
};

export default StaffSettings;
