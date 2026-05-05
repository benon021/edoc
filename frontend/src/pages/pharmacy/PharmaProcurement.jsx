// =============================================================
// FILE: PharmaProcurement.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { 
    Truck, Plus, FileText, CheckCircle, Clock, X, 
    Download, AlertCircle, Warehouse, Users, Search, 
    ArrowRightLeft, PackageCheck, ClipboardList, ShoppingCart,
    History, ShieldCheck, Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PharmaProcurement = () => {
    const [orders, setOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [activeTab, setActiveTab] = useState('PURCHASE ORDERS');
    const [showModal, setShowModal] = useState(false);
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [selectedRestockItems, setSelectedRestockItems] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [newOrder, setNewOrder] = useState({ supplier_id: '', notes: '', items: [{ name: '', qty: 0, cost: 0 }] });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [{ data: oRes }, { data: sRes }, { data: iRes }] = await Promise.all([
                supabase.from('procurement_order').select('*, suppliers:supplier_id(name)').order('created_at', { ascending: false }),
                supabase.from('suppliers').select('*'),
                supabase.from('medicine').select('*')
            ]);
            
            setOrders((oRes || []).map(o => ({ ...o, supplier_name: o.suppliers?.name || 'Unknown' })));
            setSuppliers(sRes || []);
            setInventory(iRes || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleReceive = async (id) => {
        if (!window.confirm("Mark this order as received?")) return;
        try {
            await supabase.from('procurement_order').update({ status: 'received', received_at: new Date().toISOString() }).eq('id', id);
            
            const { data: items } = await supabase.from('procurement_item').select('*').eq('order_id', id);
            
            for (const item of (items || [])) {
                const med = inventory.find(i => i.name === item.medicine_name);
                if (med) {
                    await supabase.from('medicine').update({ quantity: med.quantity + item.quantity }).eq('id', med.id);
                }
            }
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const toggleItemSelection = (id) => {
        setSelectedRestockItems(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const metrics = [
        { label: 'Active Orders', count: orders.filter(o => o.status === 'pending').length, icon: FileText, color: '#007bff' },
        { label: 'Intake Logs', count: orders.filter(o => o.status === 'received').length, icon: History, color: '#28a745' },
        { label: 'Depleted Nodes', count: inventory.filter(i => i.quantity <= i.min_stock).length, icon: AlertCircle, color: '#dc3545' },
        { label: 'Partner Network', count: suppliers.length, icon: Users, color: '#6c757d' },
    ];

    const tabs = ['PURCHASE ORDERS', 'INTAKE (GRN)', 'RESTOCK LIST'];
    const todayDate = new Date().toISOString().split('T')[0];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff' }}>
            <Sidebar userType="ph" />
            <main style={{ flex: 1, padding: '24px 30px' }}>
                
                {/* Edoc Style Header Search & Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '800px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '15px', top: '12px', color: '#adb5bd' }} />
                            <input 
                                type="text" 
                                placeholder="Search procurement ledger..." 
                                style={{ width: '100%', padding: '10px 15px 10px 45px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '0.9rem', background: '#f8f9fa' }} 
                            />
                        </div>
                        <button style={{ padding: '10px 25px', background: '#e7f2ff', color: '#007bff', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}>Search</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', textAlign: 'right' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#adb5bd', fontWeight: '700' }}>Logistics Date</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#343a40' }}>{todayDate}</div>
                        </div>
                        <div style={{ padding: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px', color: '#343a40' }}>
                            <Calendar size={20} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#343a40' }}>Procurement & Logistics</h2>
                    <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Generate Purchase Order
                    </button>
                </div>

                {/* Edoc Status Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                    {metrics.map((stat, idx) => (
                        <div key={idx} style={{ background: 'white', padding: '20px 25px', borderRadius: '4px', border: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: stat.color }}>{stat.count}</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>{stat.label}</div>
                            </div>
                            <div style={{ padding: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px', color: stat.color }}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Edoc Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #dee2e6', marginBottom: '30px' }}>
                    {tabs.map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)}
                            style={{ 
                                padding: '12px 25px', 
                                border: 'none', 
                                background: 'transparent',
                                color: activeTab === tab ? '#007bff' : '#6c757d',
                                borderBottom: activeTab === tab ? '3px solid #007bff' : '3px solid transparent',
                                fontWeight: '700',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div style={{ background: 'white', borderRadius: '4px', border: '1px solid #dee2e6', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #007bff' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>IDENTIFIER</th>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>VENDOR</th>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>DATE</th>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>VALUE</th>
                                <th style={{ textAlign: 'right', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeTab === 'PURCHASE ORDERS' ? (
                                orders.filter(o => o.status !== 'received').map(o => (
                                    <tr key={o.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '15px 25px', fontWeight: '700' }}>#PO-{String(o.id).padStart(5, '0')}</td>
                                        <td style={{ padding: '15px 25px' }}>{o.supplier_name}</td>
                                        <td style={{ padding: '15px 25px' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '15px 25px' }}>KSh {Number(o.total_cost).toLocaleString()}</td>
                                        <td style={{ padding: '15px 25px', textAlign: 'right' }}>
                                            <button onClick={() => handleReceive(o.id)} style={{ padding: '6px 12px', background: '#e7f2ff', color: '#007bff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>Receive</button>
                                        </td>
                                    </tr>
                                ))
                            ) : activeTab === 'INTAKE (GRN)' ? (
                                orders.filter(o => o.status === 'received').map(o => (
                                    <tr key={o.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '15px 25px', fontWeight: '700' }}>#GRN-{String(o.id).padStart(5, '0')}</td>
                                        <td style={{ padding: '15px 25px' }}>{o.supplier_name}</td>
                                        <td style={{ padding: '15px 25px' }}>{new Date(o.updated_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '15px 25px' }}>KSh {Number(o.total_cost).toLocaleString()}</td>
                                        <td style={{ padding: '15px 25px', textAlign: 'right' }}>
                                            <span style={{ color: '#28a745', fontWeight: '700', fontSize: '0.8rem' }}>RECEIVED</span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                inventory.filter(i => i.quantity <= i.min_stock).map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '15px 25px', fontWeight: '700' }}>{item.name}</td>
                                        <td style={{ padding: '15px 25px' }}>{item.category}</td>
                                        <td style={{ padding: '15px 25px', color: '#dc3545', fontWeight: '700' }}>{item.quantity} {item.uom}</td>
                                        <td style={{ padding: '15px 25px' }}>TH: {item.min_stock}</td>
                                        <td style={{ padding: '15px 25px', textAlign: 'right' }}>
                                            <button onClick={() => { setSelectedRestockItems([item.id]); setShowRestockModal(true); }} style={{ padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>Restock</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Edoc Style Modals... (Simplified) */}
            </main>
        </div>
    );
};

export default PharmaProcurement;
