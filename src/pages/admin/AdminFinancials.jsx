// =============================================================
// FILE: AdminFinancials.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { getAdminFinancials, getAdminProfitStats } from '../../lib/api';
import { DollarSign, Download, Calendar, Filter, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const AdminFinancials = () => {
    const [financials, setFinancials] = useState({ pharmacy_sales: [], lab_sales: [] });
    const [profitReport, setProfitReport] = useState({ gross_revenue: 0, cogs: 0, opex: 0, net_profit: 0 });
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        getAdminFinancials()
            .then(data => setFinancials(data))
            .catch(console.error);

        getAdminProfitStats()
            .then(data => setProfitReport(data))
            .catch(console.error);
    }, []);

    const totalPharmacy = financials.pharmacy_sales.reduce((acc, s) => acc + Number(s.total_amount), 0);
    const totalLab = financials.lab_sales.reduce((acc, s) => acc + Number(s.cost || 0), 0);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar userType="a" />
            <main style={{ flex: 1, padding: '48px 64px' }}>
                <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>Profit & Loss Intelligence</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Enterprise-wide fiscal performance and operational burn tracking.</p>
                    </div>
                    <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={18} /> Export Fiscal Report
                    </button>
                </header>

                {/* Profit Control Center */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '48px' }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Gross Revenue</p>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900' }}>KSh {Number(profitReport.gross_revenue).toLocaleString()}</h2>
                    </div>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>COGS (Inventory Cost)</p>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#f59e0b' }}>- KSh {Number(profitReport.cogs).toLocaleString()}</h2>
                    </div>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>OPEX (Expenses)</p>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ef4444' }}>- KSh {Number(profitReport.opex).toLocaleString()}</h2>
                    </div>
                    <div style={{ background: 'var(--primary)', padding: '24px', borderRadius: '24px', color: 'white', boxShadow: '0 20px 25px -5px rgba(14, 165, 233, 0.3)' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: '800', opacity: 0.8, textTransform: 'uppercase', marginBottom: '8px' }}>Net Profit</p>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900' }}>KSh {Number(profitReport.net_profit).toLocaleString()}</h2>
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Transaction Ledger</h3>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <select className="input-field" style={{ width: 'auto', height: '40px' }} value={filter} onChange={e => setFilter(e.target.value)}>
                                <option>All Departments</option>
                                <option>Pharmacy</option>
                                <option>Laboratory</option>
                            </select>
                        </div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '16px 32px', fontSize: '0.875rem', color: '#64748b' }}>TX ID</th>
                                <th style={{ textAlign: 'left', padding: '16px 32px', fontSize: '0.875rem', color: '#64748b' }}>DEPARTMENT</th>
                                <th style={{ textAlign: 'left', padding: '16px 32px', fontSize: '0.875rem', color: '#64748b' }}>CUSTOMER</th>
                                <th style={{ textAlign: 'left', padding: '16px 32px', fontSize: '0.875rem', color: '#64748b' }}>DATE</th>
                                <th style={{ textAlign: 'right', padding: '16px 32px', fontSize: '0.875rem', color: '#64748b' }}>AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {financials.pharmacy_sales.map(s => (
                                <tr key={`ph-${s.sale_id}`} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '16px 32px', fontWeight: '700' }}>#{s.receipt_no || `RX-${s.sale_id}`}</td>
                                    <td style={{ padding: '16px 32px' }}><span style={{ padding: '4px 10px', background: '#f0f9ff', color: '#0ea5e9', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' }}>PHARMACY</span></td>
                                    <td style={{ padding: '16px 32px', fontWeight: '600' }}>{s.customer_name}</td>
                                    <td style={{ padding: '16px 32px', color: '#64748b', fontSize: '0.875rem' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '16px 32px', textAlign: 'right', fontWeight: '800' }}>KSh {Number(s.total_amount).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default AdminFinancials;
