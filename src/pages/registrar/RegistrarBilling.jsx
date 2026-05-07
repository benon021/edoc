// =============================================================
// FILE: RegistrarBilling.jsx
// PURPOSE: Centralized billing and cashier dashboard for Reception
// =============================================================
import React, { useState, useEffect } from 'react';
import { CreditCard, Search, DollarSign, FileText, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const RegistrarBilling = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentForm, setPaymentForm] = useState({
        amount_paid: 0,
        payment_method: 'Cash',
        insurance_provider: '',
        insurance_number: ''
    });

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('invoices')
                .select('*, patient:patient_id(pname, pemail)')
                .order('created_at', { ascending: false });
            
            if (error) {
                // If table doesn't exist, we just get an error. 
                console.error("Error fetching invoices:", error.message);
                setInvoices([]);
            } else {
                setInvoices(data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSettle = (inv) => {
        setSelectedInvoice(inv);
        setPaymentForm({
            amount_paid: Number(inv.total_amount) - Number(inv.amount_paid),
            payment_method: inv.payment_method || 'Cash',
            insurance_provider: inv.insurance_provider || '',
            insurance_number: inv.insurance_number || ''
        });
        setShowPaymentModal(true);
    };

    const processPayment = async () => {
        try {
            const newPaid = Number(selectedInvoice.amount_paid) + Number(paymentForm.amount_paid);
            const status = newPaid >= Number(selectedInvoice.total_amount) ? 'Paid' : 'Partially Paid';
            
            const { error } = await supabase.from('invoices').update({
                amount_paid: newPaid,
                status: status,
                payment_method: paymentForm.payment_method,
                insurance_provider: paymentForm.insurance_provider,
                insurance_number: paymentForm.insurance_number
            }).eq('id', selectedInvoice.id);

            if (error) throw error;
            
            setShowPaymentModal(false);
            fetchInvoices();
        } catch (err) {
            console.error("Payment failed", err);
            alert("Error processing payment");
        }
    };

    const filteredInvoices = invoices.filter(i => 
        (i.receipt_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.patient?.pname || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#3b82f6', color: 'white', padding: '10px', borderRadius: '12px' }}>
                            <CreditCard size={24} />
                        </div>
                        Centralized Billing Desk
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '8px' }}>Manage patient invoices, collect payments, and track outstanding balances.</p>
                </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', color: '#10b981' }}><DollarSign size={24} /></div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Total Collected</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a' }}>
                            KES {invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + Number(i.total_amount), 0).toLocaleString()}
                        </div>
                    </div>
                </div>
                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '12px', color: '#f59e0b' }}><Clock size={24} /></div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Pending Invoices</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a' }}>
                            {invoices.filter(i => i.status === 'Pending').length}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center', background: '#f8fafc' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text" 
                            placeholder="Search invoice by receipt no or patient name..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                        />
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                        <tr>
                            <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '800', color: '#475569' }}>INVOICE / RECEIPT</th>
                            <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '800', color: '#475569' }}>PATIENT</th>
                            <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '0.8rem', fontWeight: '800', color: '#475569' }}>AMOUNT</th>
                            <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '800', color: '#475569' }}>STATUS</th>
                            <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '0.8rem', fontWeight: '800', color: '#475569' }}>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading billing records... (Ensure setup_billing.sql is run in Supabase)</td></tr>
                        ) : filteredInvoices.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No invoices found.</td></tr>
                        ) : filteredInvoices.map(inv => (
                            <tr key={inv.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '16px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <FileText size={18} color="#94a3b8" />
                                        <span style={{ fontWeight: '800', color: '#0f172a' }}>{inv.receipt_no}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '30px' }}>{new Date(inv.created_at).toLocaleDateString()}</div>
                                </td>
                                <td style={{ padding: '16px 24px', fontWeight: '700', color: '#334155' }}>
                                    {inv.patient?.pname || 'Unknown'}
                                </td>
                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                    <div style={{ fontWeight: '800', color: '#0f172a' }}>KES {Number(inv.total_amount).toLocaleString()}</div>
                                    {inv.status !== 'Paid' && <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>Bal: KES {(Number(inv.total_amount) - Number(inv.amount_paid)).toLocaleString()}</div>}
                                </td>
                                <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800',
                                        background: inv.status === 'Paid' ? '#dcfce7' : (inv.status === 'Pending' ? '#fef3c7' : '#e0e7ff'),
                                        color: inv.status === 'Paid' ? '#166534' : (inv.status === 'Pending' ? '#b45309' : '#4338ca')
                                    }}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                    {inv.status !== 'Paid' ? (
                                        <button onClick={() => handleSettle(inv)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                                            Settle Bill
                                        </button>
                                    ) : (
                                        <span style={{ color: '#10b981', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                            <CheckCircle size={16} /> Cleared
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showPaymentModal && selectedInvoice && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '16px' }}>Settle Invoice {selectedInvoice.receipt_no}</h2>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Amount Received (KES)</label>
                            <input 
                                type="number" 
                                value={paymentForm.amount_paid} 
                                onChange={e => setPaymentForm({...paymentForm, amount_paid: e.target.value})}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Payment Method</label>
                            <select 
                                value={paymentForm.payment_method} 
                                onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            >
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                                <option value="M-Pesa">M-Pesa</option>
                                <option value="Insurance">Insurance</option>
                            </select>
                        </div>

                        {paymentForm.payment_method === 'Insurance' && (
                            <>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Provider</label>
                                    <input type="text" value={paymentForm.insurance_provider} onChange={e => setPaymentForm({...paymentForm, insurance_provider: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                </div>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Policy Number</label>
                                    <input type="text" value={paymentForm.insurance_number} onChange={e => setPaymentForm({...paymentForm, insurance_number: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                </div>
                            </>
                        )}

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowPaymentModal(false)} style={{ padding: '10px 16px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={processPayment} style={{ padding: '10px 16px', border: 'none', background: '#10b981', color: 'white', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Process Payment</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistrarBilling;