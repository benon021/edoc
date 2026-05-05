// =============================================================
// FILE: PharmaInventory.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { 
    Package, Plus, Search, AlertTriangle, CheckCircle, X, ShieldAlert, 
    Warehouse, Briefcase, Zap, Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../components/NotificationContext';

const PharmaInventory = () => {
    const { showNotification } = useNotification();
    const [inventory, setInventory] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    
    const [newMed, setNewMed] = useState({
        med_name: '', 
        generic_name: '',
        category: 'Analgesic', 
        barcode: '',
        prescription_required: false,
        batch_number: '', 
        stock_qty: 0, 
        expiry_date: '', 
        reorder_level: 10,
        supplier_id: '',
        buying_price: 0, 
        selling_price: 0, 
        is_taxable: false,
        unit: 'Tablets'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [invRes, supRes] = await Promise.all([
                supabase.from('medicine').select('id, med_name, generic_name, med_type, category, stock_qty, buying_price, selling_price, expiry_date, unit, reorder_level, supplier_id, suppliers:supplier_id(name)').order('med_name'),
                supabase.from('suppliers').select('id, name')
            ]);
            
            const invData = invRes.data || [];
            const supData = supRes.data || [];
            
            setInventory(invData || []);
            setSuppliers(supData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('medicine').insert({
                med_name: newMed.med_name,
                generic_name: newMed.generic_name,
                category: newMed.category,
                barcode: newMed.barcode || '',
                prescription_required: newMed.prescription_required ? 1 : 0,
                batch_number: newMed.batch_number,
                stock_qty: newMed.stock_qty,
                expiry_date: newMed.expiry_date,
                reorder_level: newMed.reorder_level,
                supplier_id: newMed.supplier_id || null,
                buying_price: newMed.buying_price,
                selling_price: newMed.selling_price,
                is_taxable: newMed.is_taxable ? 1 : 0,
                unit: newMed.unit,
                is_active: true
            });
            
            if (!error) {
                setShowAddModal(false);
                fetchData();
                setNewMed({
                    med_name: '', generic_name: '', category: 'Analgesic', barcode: '', prescription_required: false,
                    batch_number: '', stock_qty: 0, expiry_date: '', reorder_level: 10, supplier_id: '',
                    buying_price: 0, selling_price: 0, is_taxable: false, unit: 'Tablets'
                });
            } else {
                console.error("Insert Error:", error);
                alert(`Database Error: ${error.message}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const filtered = (inventory || []).filter(i => {
        if (!i) return false;
        const search = (searchTerm || '').toLowerCase();
        return (
            (i.med_name || '').toLowerCase().includes(search) || 
            (i.generic_name || '').toLowerCase().includes(search) ||
            (i.category || '').toLowerCase().includes(search)
        );
    });

    const metrics = [
        { label: 'Active Catalog', count: inventory.length, icon: Package },
        { label: 'Depleting Nodes', count: inventory.filter(i => (i.stock_qty || 0) <= (i.reorder_level || 10)).length, icon: Zap },
        { label: 'Revenue Valuation', count: inventory.reduce((acc, i) => acc + ((i.stock_qty || 0) * (i.selling_price || 0)), 0).toLocaleString(), icon: Briefcase },
        { label: 'Healthy Nodes', count: inventory.filter(i => new Date(i.expiry_date) > new Date()).length, icon: ShieldAlert },
    ];

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
                                placeholder="Search ledger by name, formula..." 
                                style={{ width: '100%', padding: '10px 15px 10px 45px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '0.9rem', background: '#f8f9fa' }} 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button style={{ padding: '10px 25px', background: '#e7f2ff', color: '#007bff', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}>Search</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', textAlign: 'right' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#adb5bd', fontWeight: '700' }}>System Date</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#343a40' }}>{todayDate}</div>
                        </div>
                        <div style={{ padding: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px', color: '#343a40' }}>
                            <Calendar size={20} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#343a40' }}>Inventory Hub</h2>
                    <button onClick={() => setShowAddModal(true)} style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Register New Medicine
                    </button>
                </div>

                {/* Edoc Status Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                    {metrics.map((stat, idx) => (
                        <div key={idx} style={{ background: 'white', padding: '20px 25px', borderRadius: '4px', border: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#007bff' }}>{stat.count}</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>{stat.label}</div>
                            </div>
                            <div style={{ padding: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px', color: '#007bff' }}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ background: 'white', borderRadius: '4px', border: '1px solid #dee2e6', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #007bff' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>MEDICINE IDENTITY</th>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>FORMULA</th>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>STOCK</th>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>GATING</th>
                                <th style={{ textAlign: 'right', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>UNIT PRICE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(item => {
                                const expiryDate = new Date(item.expiry_date);
                                const today = new Date();
                                const isExpired = expiryDate < today;
                                const isNearingExpiry = !isExpired && expiryDate < new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
                                const stock = item.stock_qty || 0;
                                const reorder = item.reorder_level || 10;
                                
                                return (
                                    <tr key={item.id} style={{ 
                                        borderBottom: '1px solid #dee2e6',
                                        background: isExpired ? '#fee2e2' : (stock <= 0 ? '#f1f5f9' : (isNearingExpiry ? '#fffaf0' : 'transparent')),
                                        borderLeft: isExpired ? '4px solid #ef4444' : (stock <= 0 ? '4px solid #94a3b8' : 'none')
                                    }}>
                                        <td style={{ padding: '15px 25px' }}>
                                            <div style={{ fontWeight: '700', color: isExpired ? '#dc3545' : (isNearingExpiry ? '#fd7e14' : '#343a40') }}>
                                                {item.med_name}
                                                {isExpired && <span style={{ marginLeft: '8px', fontSize: '0.65rem', background: '#dc3545', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>EXPIRED</span>}
                                                {isNearingExpiry && <span style={{ marginLeft: '8px', fontSize: '0.65rem', background: '#fd7e14', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>EXPIRING SOON</span>}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#6c757d' }}>{item.batch_number} • {item.unit || 'Tablets'}</div>
                                        </td>
                                        <td style={{ padding: '15px 25px', fontSize: '0.85rem', color: '#495057' }}>{item.generic_name || 'N/A'}</td>
                                        <td style={{ padding: '15px 25px' }}>
                                            <div style={{ fontWeight: '700', color: stock <= reorder ? '#dc3545' : '#212529' }}>{stock}</div>
                                            {stock <= reorder && <div style={{ fontSize: '0.65rem', color: '#dc3545', fontWeight: '700' }}>LOW STOCK</div>}
                                        </td>
                                        <td style={{ padding: '15px 25px' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: isExpired ? '#dc3545' : (isNearingExpiry ? '#fd7e14' : '#28a745') }}>
                                                {item.expiry_date}
                                            </div>
                                            <div style={{ fontSize: '0.7rem' }}>
                                                {item.prescription_required ? (
                                                    <span style={{ color: '#ffc107', fontWeight: '700' }}>PRESCRIPTION REQ</span>
                                                ) : (
                                                    <span style={{ color: '#28a745', fontWeight: '700' }}>OTC</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px 25px', textAlign: 'right', fontWeight: '700', color: '#007bff' }}>
                                            LKR {Number(item.selling_price || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Edoc Style Registration Modal */}
                {showAddModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '700px', borderRadius: '4px', padding: '30px', boxShadow: '0 1rem 3rem rgba(0,0,0,.175)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', borderBottom: '1px solid #dee2e6', paddingBottom: '15px' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#343a40' }}>Register New Medication Node</h3>
                                <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#adb5bd' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <input type="text" placeholder="Commercial Name (e.g. Panadol)" className="input-field" required value={newMed.med_name} onChange={e => setNewMed({...newMed, med_name: e.target.value})} />
                                    <input type="text" placeholder="Formula / Generic Name (e.g. Paracetamol)" className="input-field" required value={newMed.generic_name} onChange={e => setNewMed({...newMed, generic_name: e.target.value})} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                    <select className="input-field" value={newMed.category} onChange={e => setNewMed({...newMed, category: e.target.value})}><option>Analgesic</option><option>Antibiotic</option><option>Supplement</option><option>Antimalarial</option></select>
                                    <input type="text" placeholder="Batch / Lot Number" className="input-field" required value={newMed.batch_number} onChange={e => setNewMed({...newMed, batch_number: e.target.value})} />
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '-18px', left: '2px', fontSize: '0.65rem', color: '#adb5bd', fontWeight: '700' }}>EXPIRY DATE</div>
                                        <input type="date" className="input-field" required value={newMed.expiry_date} onChange={e => setNewMed({...newMed, expiry_date: e.target.value})} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '-18px', left: '2px', fontSize: '0.65rem', color: '#adb5bd', fontWeight: '700' }}>STOCK QTY</div>
                                        <input type="number" placeholder="0" className="input-field" required value={newMed.stock_qty || ''} onChange={e => setNewMed({...newMed, stock_qty: parseInt(e.target.value) || 0})} />
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '-18px', left: '2px', fontSize: '0.65rem', color: '#adb5bd', fontWeight: '700' }}>BUYING PRICE</div>
                                        <input type="number" placeholder="0.00" className="input-field" required value={newMed.buying_price || ''} onChange={e => setNewMed({...newMed, buying_price: parseFloat(e.target.value) || 0})} />
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '-18px', left: '2px', fontSize: '0.65rem', color: '#adb5bd', fontWeight: '700' }}>SELLING PRICE</div>
                                        <input type="number" placeholder="0.00" className="input-field" required value={newMed.selling_price || ''} onChange={e => setNewMed({...newMed, selling_price: parseFloat(e.target.value) || 0})} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '-18px', left: '2px', fontSize: '0.65rem', color: '#adb5bd', fontWeight: '700' }}>UNIT (e.g. Tabs)</div>
                                        <input type="text" placeholder="Unit" className="input-field" required value={newMed.unit} onChange={e => setNewMed({...newMed, unit: e.target.value})} />
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '-18px', left: '2px', fontSize: '0.65rem', color: '#adb5bd', fontWeight: '700' }}>REORDER LEVEL</div>
                                        <input type="number" placeholder="10" className="input-field" required value={newMed.reorder_level || ''} onChange={e => setNewMed({...newMed, reorder_level: parseInt(e.target.value) || 0})} />
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '-18px', left: '2px', fontSize: '0.65rem', color: '#adb5bd', fontWeight: '700' }}>SUPPLIER</div>
                                        <select className="input-field" value={newMed.supplier_id} onChange={e => setNewMed({...newMed, supplier_id: e.target.value})}>
                                            <option value="">No Supplier</option>
                                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                                        <input type="checkbox" checked={newMed.prescription_required} onChange={e => setNewMed({...newMed, prescription_required: e.target.checked})} /> Prescription Required
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                                        <input type="checkbox" checked={newMed.is_taxable} onChange={e => setNewMed({...newMed, is_taxable: e.target.checked})} /> VAT (16%)
                                    </label>
                                </div>
                                <button type="submit" style={{ padding: '15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}>INITIALIZE MEDICINE NODE</button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PharmaInventory;
