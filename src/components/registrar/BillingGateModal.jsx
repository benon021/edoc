import React, { useState, useEffect } from 'react';
import { X, DollarSign, CheckCircle, Clock, AlertTriangle, FlaskConical, Stethoscope, Scissors, Info, CreditCard, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const BillingGateModal = ({ isOpen, onClose, patient, appointmentId, onUpdate }) => {
    const [loading, setLoading] = useState(true);
    const [appointment, setAppointment] = useState(null);
    const [labs, setLabs] = useState([]);
    const [procedures, setProcedures] = useState([]);
    const [priceMatrix, setPriceMatrix] = useState([]);
    const [labCatalog, setLabCatalog] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [verifiedLabs, setVerifiedLabs] = useState({}); // { labId: boolean }
    const [selectedAdminFees, setSelectedAdminFees] = useState({}); // { feeId: boolean }
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null, type: 'info' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(v => ({ ...v, show: false })), 4000);
    };

    useEffect(() => {
        if (isOpen && appointmentId) {
            fetchBillingItems();
        }
    }, [isOpen, appointmentId]);

    const fetchBillingItems = async () => {
        try {
            setLoading(true);
            const { data: appt } = await supabase.from('appointment').select('*').eq('appoid', appointmentId).single();
            if (appt) setAppointment(appt);

            const { data: labData } = await supabase.from('lab_requests').select('*').eq('appointment_id', appointmentId);
            if (labData) {
                setLabs(labData);
                const initialVerified = {};
                labData.forEach(l => initialVerified[l.id] = l.is_paid);
                setVerifiedLabs(initialVerified);
            }

            const { data: procData } = await supabase.from('procedures').select('*').eq('appointment_id', appointmentId);
            if (procData) setProcedures(procData);

            const { data: matrix } = await supabase.from('pricing_matrix').select('*').eq('is_active', true);
            if (matrix) setPriceMatrix(matrix);

            const { data: catalog } = await supabase.from('lab_catalog').select('test_name, price');
            if (catalog) setLabCatalog(catalog);

        } catch (err) {
            console.error('Error fetching billing items:', err);
        } finally {
            setLoading(false);
        }
    };

    const markConsultationPaid = async () => {
        setConfirmModal({
            show: true,
            title: 'Confirm Payment',
            message: 'Confirm receipt of consultation fees for this patient?',
            type: 'info',
            onConfirm: async () => {
                try {
                    setProcessing(true);
                    await supabase.from('appointment').update({ consultation_fee_paid: true }).eq('appoid', appointmentId);
                    if (onUpdate) onUpdate();
                    fetchBillingItems();
                    showToast('Consultation payment confirmed successfully.');
                } catch (err) {
                    showToast('Failed to update consultation payment', 'error');
                } finally {
                    setProcessing(false);
                    setConfirmModal(v => ({ ...v, show: false }));
                }
            }
        });
    };

    const handleFinalizeAll = async () => {
        const adminTotal = priceMatrix.filter(p => selectedAdminFees[p.id]).reduce((acc, p) => acc + Number(p.price), 0);
        const consultTotal = Number(appointment?.consultation_fee_amount || 0);

        setConfirmModal({
            show: true,
            title: 'Finalize Billing',
            message: `Confirm payment clearance for all selected items? Total: KES ${(adminTotal + consultTotal + labs.reduce((acc, l) => acc + (verifiedLabs[l.id] ? (Number(l.price) || 0) : 0), 0)).toLocaleString()}`,
            type: 'success',
            onConfirm: async () => {
                try {
                    setProcessing(true);

                    // 1. Update Consultation Status
                    if (consultTotal > 0) {
                        await supabase.from('appointment').update({ consultation_fee_paid: true }).eq('appoid', appointmentId);
                    }

                    // 2. Update Lab Requests
                    for (const lab of labs) {
                        const resolvedPrice = Number(lab.price) || 
                                            labCatalog.find(c => c.test_name === lab.test_name)?.price ||
                                            priceMatrix.find(p => p.item_name === lab.test_name)?.price || 
                                            0;
                        
                        await supabase.from('lab_requests').update({ 
                            is_paid: !!verifiedLabs[lab.id],
                            price: resolvedPrice 
                        }).eq('id', lab.id);
                    }

                    if (onUpdate) onUpdate();
                    fetchBillingItems();
                    showToast('Financial clearance successful. Records updated.');
                    onClose(); 
                } catch (err) {
                    showToast('Failed to finalize billing', 'error');
                } finally {
                    setProcessing(false);
                    setConfirmModal(v => ({ ...v, show: false }));
                }
            }
        });
    };

    const markProcedurePaid = async (procId) => {
        setConfirmModal({
            show: true,
            title: 'Confirm Payment',
            message: 'Mark this procedure as paid?',
            type: 'info',
            onConfirm: async () => {
                try {
                    setProcessing(true);
                    await supabase.from('procedures').update({ is_paid: true }).eq('id', procId);
                    if (onUpdate) onUpdate();
                    fetchBillingItems();
                    showToast('Procedure marked as paid.');
                } catch (err) {
                    showToast('Failed to update procedure payment', 'error');
                } finally {
                    setProcessing(false);
                    setConfirmModal(v => ({ ...v, show: false }));
                }
            }
        });
    };

    const reverseProcedurePayment = async (procId) => {
        setConfirmModal({
            show: true,
            title: 'REVERSE PAYMENT?',
            message: 'Are you sure you want to mark this procedure as UNPAID? This should only be used to correct errors.',
            type: 'error',
            onConfirm: async () => {
                try {
                    setProcessing(true);
                    await supabase.from('procedures').update({ is_paid: false }).eq('id', procId);
                    if (onUpdate) onUpdate();
                    fetchBillingItems();
                    showToast('Procedure payment reversed.', 'error');
                } catch (err) {
                    showToast('Failed to reverse payment', 'error');
                } finally {
                    setProcessing(false);
                    setConfirmModal(v => ({ ...v, show: false }));
                }
            }
        });
    };

    const reverseConsultationPayment = async () => {
        setConfirmModal({
            show: true,
            title: 'REVERSE CONSULTATION FEE?',
            message: 'Mark consultation fee as UNPAID? This action will reverse the current payment status.',
            type: 'error',
            onConfirm: async () => {
                try {
                    setProcessing(true);
                    await supabase.from('appointment').update({ consultation_fee_paid: false }).eq('appoid', appointmentId);
                    if (onUpdate) onUpdate();
                    fetchBillingItems();
                    showToast('Consultation payment reversed.', 'error');
                } catch (err) {
                    showToast('Failed to reverse payment', 'error');
                } finally {
                    setProcessing(false);
                    setConfirmModal(v => ({ ...v, show: false }));
                }
            }
        });
    };

    const markLabPaid = async (labId) => {
        setConfirmModal({
            show: true,
            title: 'Confirm Lab Payment',
            message: 'Mark this laboratory investigation as paid?',
            type: 'info',
            onConfirm: async () => {
                try {
                    setProcessing(true);
                    const lab = labs.find(l => l.id == labId);
                    const resolvedPrice = Number(lab?.price) || 
                                        labCatalog.find(c => c.test_name === lab?.test_name)?.price ||
                                        priceMatrix.find(p => p.item_name === lab?.test_name)?.price || 
                                        0;

                    await supabase.from('lab_requests').update({ is_paid: true, price: resolvedPrice }).eq('id', labId);
                    if (onUpdate) onUpdate();
                    fetchBillingItems();
                    showToast('Lab payment confirmed.');
                } catch (err) {
                    showToast('Failed to update lab payment', 'error');
                } finally {
                    setProcessing(false);
                    setConfirmModal(v => ({ ...v, show: false }));
                }
            }
        });
    };

    const reverseLabPayment = async (labId) => {
        setConfirmModal({
            show: true,
            title: 'REVERSE LAB PAYMENT?',
            message: 'Are you sure you want to mark this lab test as UNPAID?',
            type: 'error',
            onConfirm: async () => {
                try {
                    setProcessing(true);
                    await supabase.from('lab_requests').update({ is_paid: false }).eq('id', labId);
                    if (onUpdate) onUpdate();
                    fetchBillingItems();
                    showToast('Lab payment reversed.', 'error');
                } catch (err) {
                    showToast('Failed to reverse payment', 'error');
                } finally {
                    setProcessing(false);
                    setConfirmModal(v => ({ ...v, show: false }));
                }
            }
        });
    };

    const saveLabPayments = async () => {
        try {
            setProcessing(true);
            for (const labId in verifiedLabs) {
                const lab = labs.find(l => l.id == labId);
                const resolvedPrice = Number(lab?.price) || 
                                    labCatalog.find(c => c.test_name === lab?.test_name)?.price ||
                                    priceMatrix.find(p => p.item_name === lab?.test_name)?.price || 
                                    0;

                await supabase.from('lab_requests').update({ 
                    is_paid: verifiedLabs[labId],
                    price: resolvedPrice
                }).eq('id', labId);
            }
            if (onUpdate) onUpdate();
            fetchBillingItems();
            showToast('Lab payments updated successfully.');
        } catch (err) {
            showToast('Failed to update lab payments', 'error');
        } finally {
            setProcessing(false);
        }
    };

    if (!isOpen) return null;

    const consultationRate = priceMatrix.find(p => p.price == appointment?.consultation_fee_amount && p.category === 'Consultation');

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '600px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>Payment Clearance</h2>
                        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Verify payments for {patient?.pname}</p>
                    </div>
                    <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>
                </div>

                <div style={{ padding: '32px', maxHeight: '70vh', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>Loading payment details...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {/* ADMINISTRATION FEES */}
                            {priceMatrix.filter(p => p.category === 'Administration').length > 0 && (
                                <section>
                                    <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Info size={16} color="#3b82f6" /> Administrative Charges
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        {priceMatrix.filter(p => p.category === 'Administration').map(fee => (
                                            <div 
                                                key={fee.id}
                                                onClick={() => setSelectedAdminFees(prev => ({ ...prev, [fee.id]: !prev[fee.id] }))}
                                                style={{ 
                                                    padding: '16px', borderRadius: '16px', border: '2px solid',
                                                    borderColor: selectedAdminFees[fee.id] ? '#3b82f6' : '#f1f5f9',
                                                    background: selectedAdminFees[fee.id] ? '#eff6ff' : 'white',
                                                    cursor: 'pointer', transition: '0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{fee.item_name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 700 }}>KES {Number(fee.price).toLocaleString()}</div>
                                                </div>
                                                {selectedAdminFees[fee.id] ? <CheckCircle size={20} color="#3b82f6" /> : <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #e2e8f0' }} />}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section>
                                <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Stethoscope size={16} /> {consultationRate?.item_name || 'Consultation Rate'}
                                </h3>
                                <div style={{ background: appointment?.consultation_fee_paid ? '#f0fdf4' : 'white', padding: '24px', borderRadius: '16px', border: appointment?.consultation_fee_paid ? '1px solid #bbf7d0' : '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '12px', alignItems: 'end' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#3b82f6', display: 'block', marginBottom: 4 }}>Rate Category</label>
                                            <select 
                                                value={consultationRate?.id || ""} 
                                                disabled={appointment?.consultation_fee_paid}
                                                onChange={async (e) => {
                                                    const selected = priceMatrix.find(p => p.id == e.target.value);
                                                    if (selected) {
                                                        setAppointment({...appointment, consultation_fee_amount: selected.price});
                                                        await supabase.from('appointment').update({ consultation_fee_amount: selected.price }).eq('appoid', appointmentId);
                                                    }
                                                }}
                                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: '0.9rem', fontWeight: '600' }}
                                            >
                                                <option value="">-- Select Rate Type --</option>
                                                {priceMatrix.filter(p => p.category === 'Consultation').map(p => (
                                                    <option key={p.id} value={p.id}>{p.item_name} (KES {p.price})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: 4 }}>Amount</label>
                                            <div style={{ position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800 }}>KES</span>
                                                <input type="number" value={appointment?.consultation_fee_amount || 0} disabled style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: '10px', border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: '1rem', fontWeight: '800', color: '#10b981' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                                        {appointment?.consultation_fee_paid ? (
                                            <button 
                                                onClick={reverseConsultationPayment}
                                                style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', padding: '10px 20px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                            >
                                                <CheckCircle size={18} /> PAID (REVERSE)
                                            </button>
                                        ) : (
                                            <button onClick={markConsultationPaid} style={{ background: '#ff7200', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>Confirm Payment</button>
                                        )}
                                    </div>
                                </div>
                            </section>

                             {labs.length > 0 && (
                                <section>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', margin: 0 }}>Laboratory Investigations</h3>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {labs.map(lab => (
                                            <div 
                                                key={lab.id} 
                                                style={{ 
                                                    background: verifiedLabs[lab.id] ? '#f0fdf4' : 'white', 
                                                    padding: '16px', 
                                                    borderRadius: '16px', 
                                                    border: verifiedLabs[lab.id] ? '2px solid #10b981' : '1px solid #e2e8f0', 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center',
                                                    transition: '0.2s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: verifiedLabs[lab.id] ? '#10b981' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {verifiedLabs[lab.id] ? <CheckCircle size={14} color="white" /> : <Clock size={14} color="#94a3b8" />}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{lab.test_name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>
                                                            KES {(
                                                                Number(lab.price) || 
                                                                labCatalog.find(c => c.test_name === lab.test_name)?.price ||
                                                                priceMatrix.find(p => p.item_name === lab.test_name)?.price || 
                                                                0
                                                            ).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    {verifiedLabs[lab.id] ? (
                                                        <button 
                                                            onClick={() => reverseLabPayment(lab.id)}
                                                            style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', padding: '8px 16px', borderRadius: 10, fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer', letterSpacing: '0.5px' }}
                                                        >
                                                            PAID (REVERSE)
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => markLabPaid(lab.id)} 
                                                            style={{ background: '#0f172a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 10, fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                                        >
                                                            CLEAR PAYMENT
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {procedures.length > 0 && (
                                <section>
                                    <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Scissors size={16} /> Minor Theatre & Procedures
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {procedures.map(proc => (
                                            <div 
                                                key={proc.id} 
                                                style={{ 
                                                    background: proc.is_paid ? '#f0fdf4' : 'white', 
                                                    padding: '16px', 
                                                    borderRadius: '16px', 
                                                    border: proc.is_paid ? '2px solid #10b981' : '1px solid #e2e8f0', 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center',
                                                    transition: '0.2s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: proc.is_paid ? '#10b981' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {proc.is_paid ? <CheckCircle size={14} color="white" /> : <Clock size={14} color="#94a3b8" />}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{proc.procedure_name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>
                                                            KES {Number(proc.price).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    {proc.is_paid ? (
                                                        <button 
                                                            onClick={() => reverseProcedurePayment(proc.id)}
                                                            style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', padding: '8px 16px', borderRadius: 10, fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer', letterSpacing: '0.5px' }}
                                                        >
                                                            PAID (REVERSE)
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => markProcedurePaid(proc.id)} 
                                                            style={{ background: '#0f172a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 10, fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                                        >
                                                            CLEAR PAYMENT
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* TOTAL SUMMARY */}
                            <div style={{ marginTop: '32px', padding: '32px', background: '#f8fafc', borderRadius: '24px', border: '2px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b', fontWeight: '700', fontSize: '0.9rem' }}>Administrative Fees</span>
                                    <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '1rem' }}>
                                        KES {priceMatrix.filter(p => selectedAdminFees[p.id]).reduce((acc, p) => acc + Number(p.price), 0).toLocaleString()}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b', fontWeight: '700', fontSize: '0.9rem' }}>Consultation Fee</span>
                                    <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '1rem' }}>KES {Number(appointment?.consultation_fee_amount || 0).toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b', fontWeight: '700', fontSize: '0.9rem' }}>Laboratory Total</span>
                                    <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '1rem' }}>
                                        KES {labs.reduce((acc, l) => acc + (verifiedLabs[l.id] ? (
                                            Number(l.price) || 
                                            labCatalog.find(c => c.test_name === l.test_name)?.price ||
                                            priceMatrix.find(p => p.item_name === l.test_name)?.price || 
                                            0
                                        ) : 0), 0).toLocaleString()}
                                    </span>
                                </div>
                                
                                {procedures.some(p => p.is_paid) && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                                        <span style={{ color: '#64748b', fontWeight: '700', fontSize: '0.9rem' }}>Procedures Total</span>
                                        <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '1rem' }}>
                                            KES {procedures.reduce((acc, p) => acc + (p.is_paid ? Number(p.price) : 0), 0).toLocaleString()}
                                        </span>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', marginTop: '16px', paddingTop: '20px', borderTop: '2px dashed #cbd5e1' }}>
                                    <div>
                                        <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0f172a', display: 'block' }}>Total Obligation</span>
                                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Amount to be cleared</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '1.5rem', fontWeight: '950', color: '#10b981' }}>
                                            KES {(
                                                priceMatrix.filter(p => selectedAdminFees[p.id]).reduce((acc, p) => acc + Number(p.price), 0) +
                                                (Number(appointment?.consultation_fee_amount) || 0) + 
                                                labs.reduce((acc, l) => acc + (verifiedLabs[l.id] ? (
                                                    Number(l.price) || 
                                                    labCatalog.find(c => c.test_name === l.test_name)?.price ||
                                                    priceMatrix.find(p => p.item_name === l.test_name)?.price || 
                                                    0
                                                ) : 0), 0) +
                                                procedures.reduce((acc, p) => acc + (p.is_paid ? Number(p.price) : 0), 0)
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleFinalizeAll}
                                    style={{ width: '100%', padding: '16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                >
                                    Finalize All & Save Changes
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CUSTOM CONFIRM MODAL */}
            {confirmModal.show && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', animation: 'scaleUp 0.2s ease-out' }}>
                        <div style={{ padding: '24px', textAlign: 'center' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: confirmModal.type === 'error' ? '#fef2f2' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                {confirmModal.type === 'error' ? <AlertTriangle size={28} color="#ef4444" /> : <CreditCard size={28} color="#10b981" />}
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>{confirmModal.title}</h3>
                            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>{confirmModal.message}</p>
                        </div>
                        <div style={{ padding: '16px 24px', background: '#f8fafc', display: 'flex', gap: '12px' }}>
                            <button 
                                onClick={() => setConfirmModal(v => ({ ...v, show: false }))}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: '700', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmModal.onConfirm}
                                disabled={processing}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: confirmModal.type === 'error' ? '#ef4444' : '#0f172a', color: 'white', fontWeight: '700', cursor: 'pointer', opacity: processing ? 0.7 : 1 }}
                            >
                                {processing ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOM TOAST */}
            {toast.show && (
                <div style={{ 
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 4000,
                    background: toast.type === 'error' ? '#ef4444' : '#10b981',
                    color: 'white', padding: '12px 24px', borderRadius: '14px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    animation: 'slideInRight 0.3s ease-out', fontWeight: '700'
                }}>
                    {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default BillingGateModal;
