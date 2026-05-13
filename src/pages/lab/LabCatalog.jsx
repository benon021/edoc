// =============================================================
// FILE: LabCatalog.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Edit2, Trash2, Search, X, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const CATEGORIES = ['Hematology', 'Biochemistry', 'Microbiology', 'Serology', 'Clinical Pathology', 'Immunology', 'Molecular', 'Other'];

const emptyForm = { test_name: '', description: '', price: '', category: 'Hematology', required_sample: '', turnaround_time: '', ref_ranges: '', is_enabled: true };

export default function LabCatalog() {
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('All');
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deletingItem, setDeletingItem] = useState(null);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const fetchCatalog = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('lab_catalog').select('*').order('category').order('test_name');
            if (error) throw error;
            setCatalog(data || []);
        } catch (e) { setCatalog([]); }
        setLoading(false);
    }, []);

    useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

    const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true); };

    const handleDeleteClick = (item) => {
        setDeletingItem(item);
        setDeleteConfirm(true);
    };
const openEdit = (item) => { setEditing(item.id); setForm({ ...item, is_enabled: !!item.is_enabled }); setModal(true); };

    const handleSave = async () => {
        if (!form.test_name || !form.price) return showToast('Test name and price are required', 'error');
        setSaving(true);
        try {
            const payload = {
                test_name: form.test_name,
                description: form.description || '',
                price: form.price,
                category: form.category || 'Hematology',
                required_sample: form.required_sample || '',
                turnaround_time: form.turnaround_time || '',
                ref_ranges: form.ref_ranges || '[]',
                is_enabled: form.is_enabled ? 1 : 0
            };
            if (editing) {
                const { error } = await supabase.from('lab_catalog').update(payload).eq('id', editing);
                if (error) throw error;
                showToast('Test updated ✓');
            } else {
                const { error } = await supabase.from('lab_catalog').insert(payload);
                if (error) throw error;
                showToast('Test added ✓');
            }
            setModal(false);
            fetchCatalog();
        } catch (e) {
            console.error(e);
            showToast('Save failed', 'error');
        } finally {
            setSaving(false);
        }
    };

const confirmDelete = async () => {
    if (!deletingItem) return;
    setDeleteConfirm(false);
    setDeletingItem(null);
    try {
        const { error } = await supabase.from('lab_catalog').delete().eq('id', deletingItem.id);
        if (error) throw error;
        showToast(`Test "${deletingItem.test_name}" removed permanently`);
        fetchCatalog();
    } catch (e) { 
        console.error(e);
        showToast('Remove failed', 'error'); 
    }
};

const handleToggle = async (item) => {
    try {
        const { error } = await supabase.from('lab_catalog').update({ is_enabled: item.is_enabled ? 0 : 1 }).eq('id', item.id);
        if (error) throw error;
        fetchCatalog();
    } catch (e) { console.error(e); }
};

    const categories = ['All', ...CATEGORIES];
    const filtered = catalog.filter(t => {
        const ms = !search || t.test_name?.toLowerCase().includes(search.toLowerCase());
        const mc = catFilter === 'All' || t.category === catFilter;
        return ms && mc;
    });

    const catColors = { Hematology: '#3b82f6', Biochemistry: '#10b981', Microbiology: '#f59e0b', Serology: '#8b5cf6', 'Clinical Pathology': '#ef4444', Immunology: '#0ea5e9', Molecular: '#ec4899', Other: '#6b7280' };

    return (
        <div style={{ padding: '40px 56px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
                {toast && <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : '#10b981', color: 'white', padding: '12px 24px', borderRadius: 12, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>{toast.msg}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Tag size={28} color="var(--primary)" /> Test Catalog
                        </h1>
                        <p style={{ color: '#64748b', marginTop: 4 }}>Manage available laboratory tests, pricing, and reference ranges.</p>
                    </div>
                    <button onClick={openAdd} style={{ padding: '12px 20px', borderRadius: 12, background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={16} /> Add New Test
                    </button>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search test name..." style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {categories.map(c => (
                            <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '8px 14px', borderRadius: 8, border: catFilter === c ? `2px solid ${catColors[c] || '#3b82f6'}` : '1px solid #e2e8f0', background: catFilter === c ? `${catColors[c] || '#3b82f6'}15` : 'white', color: catFilter === c ? (catColors[c] || '#3b82f6') : '#64748b', fontWeight: catFilter === c ? 700 : 500, fontSize: '0.78rem', cursor: 'pointer', transition: '0.15s' }}>
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                    {[
                        { label: 'Total Tests', value: catalog.length, color: '#3b82f6' },
                        { label: 'Active Tests', value: catalog.filter(t => t.is_enabled).length, color: '#10b981' },
                        { label: 'Disabled', value: catalog.filter(t => !t.is_enabled).length, color: '#94a3b8' },
                        { label: 'Categories', value: new Set(catalog.map(t => t.category)).size, color: '#8b5cf6' },
                    ].map((s, i) => (
                        <div key={i} style={{ background: 'white', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>{s.label}</div>
                            </div>
                            <Tag size={20} color={s.color} opacity={0.3} />
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                {['Test Name', 'Category', 'Specimen', 'TAT', 'Price (KES)', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '14px 20px', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 64, color: '#94a3b8' }}>Loading catalog...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 64, color: '#94a3b8' }}>No tests in this category</td></tr>
                            ) : filtered.map((t, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f8fafc', opacity: t.is_enabled ? 1 : 0.5, transition: '0.15s' }}
                                    onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseOut={e => e.currentTarget.style.background = 'white'}>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{t.test_name}</div>
                                        {t.description && <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{t.description}</div>}
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: `${catColors[t.category] || '#6b7280'}18`, color: catColors[t.category] || '#6b7280' }}>
                                            {t.category}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 20px', fontSize: '0.875rem', color: '#475569' }}>{t.required_sample || '—'}</td>
                                    <td style={{ padding: '16px 20px', fontSize: '0.875rem', color: '#475569' }}>{t.turnaround_time || '—'}</td>
                                    <td style={{ padding: '16px 20px', fontWeight: 700, color: '#1e293b' }}>
                                        {t.price ? Number(t.price).toLocaleString() : '—'}
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <button onClick={() => handleToggle(t)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: t.is_enabled ? '#10b981' : '#94a3b8', fontWeight: 600, fontSize: '0.78rem' }}>
                                            {t.is_enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                            {t.is_enabled ? 'Active' : 'Disabled'}
                                        </button>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => openEdit(t)} style={{ padding: '6px 12px', borderRadius: 8, background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                                                <Edit2 size={12} />
                                            </button>
                                            <button onClick={() => handleDeleteClick(t)} style={{ padding: '6px 12px', borderRadius: 8, background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && deletingItem && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 2001, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: 20, width: 480, boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '24px 28px', background: '#1e293b', borderRadius: '20px 20px 0 0', color: 'white', textAlign: 'center' }}>
                            <Trash2 size={48} style={{ margin: '0 auto 16px', opacity: 0.8 }} />
                            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>Delete Test?</h2>
                            <p style={{ fontSize: '0.95rem', opacity: 0.9 }}>This action cannot be undone.</p>
                        </div>
                        <div style={{ padding: '28px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: 12, marginBottom: 20 }}>
                                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem', marginBottom: 8 }}>{deletingItem.test_name}</div>
                                <div style={{ display: 'flex', gap: 16, fontSize: '0.9rem', color: '#64748b' }}>
                                    <span>KES {Number(deletingItem.price || 0).toLocaleString()}</span>
                                    <span style={{ color: catColors[deletingItem.category] || '#6b7280' }}>{deletingItem.category}</span>
                                </div>
                            </div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: 8 }}>Reason for deletion (optional):</label>
                            <textarea rows={2} placeholder="e.g. Test discontinued, superseded by new method..." style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} readOnly />
                        </div>
                        <div style={{ padding: '20px 28px', display: 'flex', gap: 12 }}>
                            <button onClick={() => { setDeleteConfirm(false); setDeletingItem(null); }} style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#f1f5f9', color: '#64748b', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={confirmDelete} style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#ef4444', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                                Permanently Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {modal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: 20, width: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{editing ? 'Edit Test' : 'Add New Test'}</h2>
                            <button onClick={() => setModal(false)} style={{ background: '#f1f5f9', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}><X size={16} /></button>
                        </div>
                        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {[
                                { label: 'Test Name *', key: 'test_name', type: 'text', placeholder: 'e.g. Blood Sugar or Malaria' },
                                { label: 'About this Test', key: 'description', type: 'text', placeholder: 'Explain what this test checks for' },
                                { label: 'Price (KES) *', key: 'price', type: 'number', placeholder: 'Enter amount' },
                                { label: 'Sample Needed', key: 'required_sample', type: 'text', placeholder: 'e.g. Blood, Urine, or Swab' },
                                { label: 'Time to Results', key: 'turnaround_time', type: 'text', placeholder: 'How long until results are ready?' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>{f.label}</label>
                                    <input type={f.type} value={form[f.key] || ''} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} placeholder={f.placeholder}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                                </div>
                            ))}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Category</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ position: 'relative' }}>
                                        <select 
                                            value={CATEGORIES.includes(form.category) ? form.category : 'Other'} 
                                            onChange={e => setForm(v => ({ ...v, category: e.target.value === 'Other' ? '' : e.target.value }))} 
                                            style={{ width: '100%', padding: '10px 36px 10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.9rem', appearance: 'none' }}
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: 12, color: '#64748b', pointerEvents: 'none' }} />
                                    </div>
                                    
                                    {(!CATEGORIES.includes(form.category) || form.category === 'Other') && (
                                        <input 
                                            placeholder="Type custom category name..." 
                                            value={form.category === 'Other' ? '' : form.category} 
                                            onChange={e => setForm(v => ({ ...v, category: e.target.value }))}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: '0.9rem', boxSizing: 'border-box', background: '#fffbeb', border: '1px solid #fef3c7' }} 
                                        />
                                    )}
                                </div>
                            </div>
                             <div>
                                <label style={{ display: 'flex', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 12, justifyContent: 'space-between', alignItems: 'center' }}>
                                    Test Parameters (Fields)
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setForm(v => ({ ...v, ref_ranges: '[]' }));
                                            }}
                                            style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700 }}
                                        >
                                            - Clear Fields
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                let currentFields = [];
                                                try { currentFields = form.ref_ranges ? JSON.parse(form.ref_ranges) : []; } catch(e) { currentFields = []; }
                                                if (!Array.isArray(currentFields)) currentFields = [];
                                                const updated = [...currentFields, { field: '', unit: '', min: '', max: '', type: 'Number' }];
                                                setForm(v => ({ ...v, ref_ranges: JSON.stringify(updated) }));
                                            }}
                                            style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700 }}
                                        >
                                            + Add Field
                                        </button>
                                    </div>
                                </label>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 250, overflowY: 'auto', padding: '4px' }}>
                                    {(() => {
                                        let fields = [];
                                        try { 
                                            const raw = form.ref_ranges;
                                            if (raw) {
                                                if (typeof raw === 'string') {
                                                    fields = JSON.parse(raw);
                                                } else {
                                                    fields = raw;
                                                }
                                            } else {
                                                fields = [];
                                            }
                                        } catch(e) { 
                                            console.error("Error parsing ref_ranges:", e);
                                            fields = []; 
                                        }
                                        if (!Array.isArray(fields)) fields = [];
                                        
                                        if (fields.length === 0) return <div style={{ textAlign: 'center', padding: '12px', border: '1px dashed #e2e8f0', borderRadius: 10, fontSize: '0.75rem', color: '#94a3b8' }}>No parameters defined yet. Click "Add Field" above.</div>;

                                        return fields.map((f, idx) => (
                                            <div key={idx} style={{ background: '#f8fafc', padding: '16px', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 8 }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.8fr 1fr 40px', gap: 12, alignItems: 'end' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>What are we measuring?</label>
                                                        <input placeholder="e.g. Sugar Level" value={f.field || ''} onChange={e => {
                                                            const updated = [...fields];
                                                            updated[idx].field = e.target.value;
                                                            setForm(v => ({ ...v, ref_ranges: JSON.stringify(updated) }));
                                                        }} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.8rem', boxSizing: 'border-box', background: 'white' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Answer Type</label>
                                                        <select value={f.type || 'Number'} onChange={e => {
                                                            const updated = [...fields];
                                                            updated[idx].type = e.target.value;
                                                            setForm(v => ({ ...v, ref_ranges: JSON.stringify(updated) }));
                                                        }} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.75rem', background: 'white' }}>
                                                            <option value="Number">Number</option>
                                                            <option value="Text">Notes/Text</option>
                                                            <option value="Pos/Neg">Positive or Negative</option>
                                                            <option value="React/Non">Reactive or Non-Reactive</option>
                                                            <option value="Normal/Abnormal">Normal or Abnormal</option>
                                                            <option value="Levels">Graded Levels (+, ++, +++)</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Unit</label>
                                                        <input placeholder="e.g. mg/dL" value={f.unit || ''} onChange={e => {
                                                            const updated = [...fields];
                                                            updated[idx].unit = e.target.value;
                                                            setForm(v => ({ ...v, ref_ranges: JSON.stringify(updated) }));
                                                        }} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.8rem', boxSizing: 'border-box', background: 'white' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Normal Range</label>
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <input placeholder="Min" value={f.min || ''} onChange={e => {
                                                                const updated = [...fields];
                                                                updated[idx].min = e.target.value;
                                                                setForm(v => ({ ...v, ref_ranges: JSON.stringify(updated) }));
                                                            }} style={{ width: '50%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.8rem', boxSizing: 'border-box', background: 'white' }} />
                                                            <input placeholder="Max" value={f.max || ''} onChange={e => {
                                                                const updated = [...fields];
                                                                updated[idx].max = e.target.value;
                                                                setForm(v => ({ ...v, ref_ranges: JSON.stringify(updated) }));
                                                            }} style={{ width: '50%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.8rem', boxSizing: 'border-box', background: 'white' }} />
                                                        </div>
                                                    </div>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => {
                                                            const updated = fields.filter((_, i) => i !== idx);
                                                            setForm(v => ({ ...v, ref_ranges: JSON.stringify(updated) }));
                                                        }} 
                                                        style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', height: '35px', width: '35px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        title="Remove"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
                            <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                                {saving ? 'Saving...' : editing ? 'Update Test' : 'Add Test'}
                            </button>
                            <button onClick={() => setModal(false)} style={{ padding: '12px 20px', borderRadius: 10, background: '#f1f5f9', color: '#64748b', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
