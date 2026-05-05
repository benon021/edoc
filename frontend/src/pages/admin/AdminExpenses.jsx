// =============================================================
// FILE: AdminExpenses.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { getAdminExpenses, createExpense } from '../../lib/api';
import { CreditCard, Plus, Receipt, Trash2, Calendar, Filter, X } from 'lucide-react';

const AdminExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ category: 'Utilities', amount: '', description: '' });

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        const { data, error } = await getAdminExpenses();
        if (!error) setExpenses(data || []);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { error } = await createExpense(formData);
        if (!error) {
            setShowModal(false);
            fetchExpenses();
            setFormData({ category: 'Utilities', amount: '', description: '' });
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar userType="a" />
            <main style={{ flex: 1, padding: '48px 64px' }}>
                <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>Operational Expenses</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Track hospital OPEX, salaries, and utility overheads.</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Log New Expense
                    </button>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    {expenses.map(e => (
                        <div key={e.id} style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ padding: '8px 12px', background: '#fef2f2', color: '#ef4444', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800' }}>
                                    {e.category.toUpperCase()}
                                </div>
                                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Calendar size={14} /> {new Date(e.expense_date).toLocaleDateString()}
                                </div>
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px' }}>KSh {Number(e.amount).toLocaleString()}</h3>
                            <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: '1.5' }}>{e.description}</p>
                        </div>
                    ))}
                </div>

                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '32px', padding: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Log OPEX Expense</h3>
                                <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '8px' }}>Expense Category</label>
                                    <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                        <option>Utilities (Power/Water)</option>
                                        <option>Staff Salaries</option>
                                        <option>Facility Rent</option>
                                        <option>Medical Supplies</option>
                                        <option>Maintenance</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '8px' }}>Amount (KSh)</label>
                                    <input type="number" className="input-field" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '8px' }}>Description / Memo</label>
                                    <textarea className="input-field" style={{ height: '100px', padding: '12px' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                </div>
                                <button type="submit" className="btn-primary" style={{ padding: '16px', marginTop: '12px' }}>Record Expense</button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminExpenses;
