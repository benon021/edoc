// =============================================================
// FILE: AdminSettings.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { getSystemConfig, updateSystemConfig } from '../../lib/api';
import { 
    Settings, Save, Globe, Landmark, Percent, HardDrive, 
    Shield, Bell, Stethoscope, Mail, Phone, MapPin, 
    Clock, DollarSign, AlertCircle, CheckCircle
} from 'lucide-react';

const AdminSettings = () => {
    const [activeTab, setActiveTab] = useState('identity');
    const [config, setConfig] = useState({ 
        hospital_name: '', 
        hospital_tagline: '',
        hospital_address: '',
        hospital_phone: '',
        hospital_email: '',
        currency: 'KSh', 
        vat_rate: '16', 
        consultation_fee: '1000',
        registration_fee: '500',
        followup_days: '7',
        system_status: 'Online', 
        hospital_logo: '',
        session_timeout: '12',
        maintenance_message: 'The system is currently undergoing scheduled maintenance. Please check back later.'
    });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        getSystemConfig()
            .then(({ data, error }) => {
                if (!error && data?.length) {
                    const configData = data.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
                    setConfig(prev => ({ ...prev, ...configData }));
                }
            })
            .catch(console.error);
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updates = {
                hospital_name: config.hospital_name,
                hospital_tagline: config.hospital_tagline,
                hospital_address: config.hospital_address,
                hospital_phone: config.hospital_phone,
                hospital_email: config.hospital_email,
                currency: config.currency,
                vat_rate: config.vat_rate,
                consultation_fee: config.consultation_fee,
                registration_fee: config.registration_fee,
                followup_days: config.followup_days,
                system_status: config.system_status,
                hospital_logo: config.hospital_logo,
                session_timeout: config.session_timeout,
                maintenance_message: config.maintenance_message,
            };
            await updateSystemConfig(updates);
            showToast('Global configuration updated successfully');
        } catch (err) {
            showToast('Connection error', 'error');
        }
        setLoading(false);
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setConfig({ ...config, hospital_logo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const TabButton = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                padding: '12px 20px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === id ? 'var(--primary)' : 'transparent',
                color: activeTab === id ? 'white' : '#64748b',
                fontWeight: '700',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                transition: '0.2s all'
            }}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
            <Sidebar userType="a" />
            
            {toast && (
                <div style={{ 
                    position: 'fixed', top: 32, right: 32, zIndex: 9999, 
                    background: toast.type === 'error' ? '#ef4444' : '#10b981', 
                    color: 'white', padding: '16px 32px', borderRadius: '16px', 
                    fontWeight: '700', boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    display: 'flex', alignItems: 'center', gap: 12,
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                    {toast.msg}
                </div>
            )}

            <main style={{ flex: 1, padding: '48px 64px', overflowY: 'auto' }}>
                <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.04em', marginBottom: '8px' }}>System Control Portal</h1>
                        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Configure global hospital parameters and operational logic.</p>
                    </div>
                    <button 
                        onClick={handleSave} 
                        disabled={loading}
                        style={{ 
                            padding: '14px 28px', background: 'var(--primary)', color: 'white', border: 'none', 
                            borderRadius: '14px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)'
                        }}
                    >
                        <Save size={20} /> {loading ? 'Syncing...' : 'Save All Changes'}
                    </button>
                </header>

                <div style={{ display: 'flex', gap: '8px', background: 'white', padding: '8px', borderRadius: '16px', marginBottom: '32px', width: 'fit-content', border: '1px solid #e2e8f0' }}>
                    <TabButton id="identity" icon={Landmark} label="Identity" />
                    <TabButton id="finance" icon={DollarSign} label="Finance" />
                    <TabButton id="clinical" icon={Stethoscope} label="Clinical" />
                    <TabButton id="security" icon={Shield} label="Security" />
                </div>

                <div style={{ maxWidth: '900px' }}>
                    {activeTab === 'identity' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ background: 'white', padding: '40px', borderRadius: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                <div style={{ display: 'flex', gap: '32px', alignItems: 'center', marginBottom: '40px' }}>
                                    <div 
                                        style={{ 
                                            width: '120px', height: '120px', borderRadius: '24px', background: '#f8fafc', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #cbd5e1',
                                            overflow: 'hidden', cursor: 'pointer', transition: '0.2s'
                                        }} 
                                        onClick={() => document.getElementById('logo-upload').click()}
                                    >
                                        {config.hospital_logo ? (
                                            <img src={config.hospital_logo} alt="Hospital Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <Globe size={48} color="#94a3b8" />
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Institution Branding</h3>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>Upload your hospital logo for reports and headers.</p>
                                        <input type="file" id="logo-upload" style={{ display: 'none' }} onChange={handleLogoUpload} accept="image/*" />
                                        <button type="button" onClick={() => document.getElementById('logo-upload').click()} style={{ padding: '10px 20px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Change Branding Asset</button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Hospital Name</label>
                                        <input type="text" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }} value={config.hospital_name} onChange={e => setConfig({...config, hospital_name: e.target.value})} placeholder="e.g. St. Andrews General Hospital" />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Slogan / Tagline</label>
                                        <input type="text" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }} value={config.hospital_tagline} onChange={e => setConfig({...config, hospital_tagline: e.target.value})} placeholder="e.g. Care with Compassion" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}><Mail size={14} style={{ verticalAlign: 'middle', marginRight: 4 }}/> Official Email</label>
                                        <input type="email" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }} value={config.hospital_email} onChange={e => setConfig({...config, hospital_email: e.target.value})} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}><Phone size={14} style={{ verticalAlign: 'middle', marginRight: 4 }}/> Support Phone</label>
                                        <input type="text" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }} value={config.hospital_phone} onChange={e => setConfig({...config, hospital_phone: e.target.value})} />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}><MapPin size={14} style={{ verticalAlign: 'middle', marginRight: 4 }}/> Physical Address</label>
                                        <textarea rows={2} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', resize: 'none' }} value={config.hospital_address} onChange={e => setConfig({...config, hospital_address: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'finance' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ background: 'white', padding: '40px', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Percent size={22} color="#10b981" /> Billing & Revenue Parameters
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Currency Symbol</label>
                                        <input type="text" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }} value={config.currency} onChange={e => setConfig({...config, currency: e.target.value})} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Standard VAT Rate (%)</label>
                                        <input type="number" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }} value={config.vat_rate} onChange={e => setConfig({...config, vat_rate: e.target.value})} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>New Patient Registration Fee</label>
                                        <input type="number" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }} value={config.registration_fee} onChange={e => setConfig({...config, registration_fee: e.target.value})} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Standard Consultation Fee</label>
                                        <input type="number" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }} value={config.consultation_fee} onChange={e => setConfig({...config, consultation_fee: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'clinical' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ background: 'white', padding: '40px', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Stethoscope size={22} color="#3b82f6" /> Clinical Protocols
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Free Follow-up Window (Days)</label>
                                        <input type="number" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }} value={config.followup_days} onChange={e => setConfig({...config, followup_days: e.target.value})} />
                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 6 }}>Patients returning within this period are flagged as follow-ups.</p>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Clinical Reporting Standard</label>
                                        <select style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }} disabled>
                                            <option>ICD-10 (International)</option>
                                            <option>SNOMED CT</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ background: 'white', padding: '40px', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Shield size={22} color="#f59e0b" /> Security & Access
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Session Timeout (Hours)</label>
                                        <input type="number" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }} value={config.session_timeout} onChange={e => setConfig({...config, session_timeout: e.target.value})} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Maintenance Mode</label>
                                        <select style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }} value={config.system_status} onChange={e => setConfig({...config, system_status: e.target.value})}>
                                            <option>Online</option>
                                            <option>Maintenance Mode</option>
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Maintenance Notification Message</label>
                                        <textarea rows={2} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', resize: 'none' }} value={config.maintenance_message} onChange={e => setConfig({...config, maintenance_message: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}} />
        </div>
    );
};

export default AdminSettings;

