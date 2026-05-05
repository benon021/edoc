// =============================================================
// FILE: RegistrarRegistration.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { UserPlus, Save, AlertTriangle, Thermometer, Activity, Heart, Wind, Droplets, Info, ShieldCheck, CreditCard, Camera, FileText } from 'lucide-react';
import Select from 'react-select';
import { format } from 'date-fns';
import { addPatient } from '../../lib/api';
import { useNotification } from '../../components/NotificationContext';

const RegistrarRegistration = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', gender: '', dob: '', marital: '',
        phone: '', altPhone: '', email: '', address: '', city: '',
        patientDisplayId: '', nationalId: '', insuranceId: '',
        bloodGroup: '', allergies: '', conditions: '', medications: '', takingMedication: 'No',
        temp: '', weight: '', height: '', bp: '', heartRate: '', respiratory: '', spo2: '',
        disabilities: '', pregnancy: 'N/A', immunization: '',
        emergencyName: '', emergencyPhone: '', emergencyRelation: '',
        guardianName: '', guardianRelation: '', guardianPhone: '', guardianEmail: '', guardianAddress: '',
        guardianId: '', guardianInsurance: '',
        consentBy: '', consentSignature: '', consentDate: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: '', insuranceProvider: '', insuranceNumber: '',
        photo: '', notes: ''
    });

    const [loading, setLoading] = useState(false);

    // Auto-calculate Age
    const age = useMemo(() => {
        if (!formData.dob) return null;
        const birthDate = new Date(formData.dob);
        const today = new Date();
        let ageValue = today.getFullYear() - birthDate.getFullYear();
        if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
            ageValue--;
        }
        return ageValue;
    }, [formData.dob]);

    const isMinor = age !== null && age < 18;

    useEffect(() => {
        const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
        const randomStr = Math.floor(1000 + Math.random() * 9000);
        setFormData(prev => ({ ...prev, patientDisplayId: `PT-${dateStr}-${randomStr}` }));
    }, []);

    const formatPhoneNumber = (value) => {
        const digits = (value || '').replace(/\D/g, '').slice(0, 10);
        return digits;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.toLowerCase().includes('phone')) {
            setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSelectChange = (selectedOption, action) => {
        setFormData(prev => ({ ...prev, [action.name]: selectedOption ? selectedOption.value : '' }));
    };

    const handleDateChange = (type, value) => {
        const [y, m, d] = (formData.dob || '1990-01-01').split('-');
        let newDob = '';
        if (type === 'year') newDob = `${value}-${m}-${d}`;
        else if (type === 'month') newDob = `${y}-${value}-${d}`;
        else if (type === 'day') newDob = `${y}-${m}-${value}`;
        setFormData(prev => ({ ...prev, dob: newDob }));
    };

    const dobParts = formData.dob ? formData.dob.split('-') : ['', '', ''];

    const years = Array.from({ length: 120 }, (_, i) => ({ value: (new Date().getFullYear() - i).toString(), label: (new Date().getFullYear() - i).toString() }));
    const months = [
        { value: '01', label: 'January' }, { value: '02', label: 'February' }, { value: '03', label: 'March' },
        { value: '04', label: 'April' }, { value: '05', label: 'May' }, { value: '06', label: 'June' },
        { value: '07', label: 'July' }, { value: '08', label: 'August' }, { value: '09', label: 'September' },
        { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }
    ];
    const days = Array.from({ length: 31 }, (_, i) => ({ value: (i + 1).toString().padStart(2, '0'), label: (i + 1).toString() }));

    const customSelectStyles = {
        control: (base) => ({
            ...base,
            padding: '4px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            boxShadow: 'none',
            '&:hover': { border: '1px solid #3b82f6' }
        })
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.firstName || !formData.lastName || !formData.phone || !formData.dob) {
            showNotification('Please fill in all required fields (First Name, Last Name, Phone, DOB).', 'error');
            setLoading(false);
            return;
        }

        const fullName = `${formData.firstName} ${formData.lastName}`;
        const patientData = {
            pname: fullName,
            pgender: formData.gender || null,
            pdob: formData.dob || null,
            pmarital: formData.marital || null,
            ptel: formData.phone || null,
            palttel: formData.altPhone || null,
            pemail: formData.email || null,
            paddress: formData.address || null,
            pcity: formData.city || null,
            patient_display_id: formData.patientDisplayId || null,
            pbloodgroup: formData.bloodGroup || null,
            pallergies: formData.allergies || null,
            pconditions: formData.conditions || null,
            ptemp: formData.temp || null,
            pweight: formData.weight || null,
            pheight: formData.height || null,
            pbp: formData.bp || null,
            pheartrate: formData.heartRate || null,
            prespiratory: formData.respiratory || null,
            pspo2: formData.spo2 || null,
            pdisabilities: formData.disabilities || null,
            ppregnancy: formData.pregnancy || null,
            pimmunization: formData.immunization || null,
            pemergency_name: formData.emergencyName || null,
            pemergency_phone: formData.emergencyPhone || null,
            pemergency_relation: formData.emergencyRelation || null,
            pguardian_name: formData.guardianName || null,
            pguardian_relation: formData.guardianRelation || null,
            pguardian_phone: formData.guardianPhone || null,
            pguardian_email: formData.guardianEmail || null,
            pguardian_address: formData.guardianAddress || null,
            pguardian_id: formData.guardianId || null,
            ppayment: formData.paymentMethod || null,
            pinsurance_provider: formData.insuranceProvider || null,
            pinsurance_number: formData.insuranceNumber || null,
            pdate_registered: new Date().toISOString(),
            pstatus: 'active'
        };

        try {
            const { error: apiError } = await addPatient(patientData);
            if (!apiError) {
                showNotification(`Patient successfully registered! ID: ${formData.patientDisplayId}`, 'success');
                setTimeout(() => navigate('/registrar/patients'), 1500);
            } else {
                showNotification(apiError.message || 'Registration failed.', 'error');
            }
        } catch (err) {
            showNotification('Network error. Check your connection.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const SectionHeader = ({ icon: Icon, title }) => (
        <h3 style={{ fontSize: '1.25rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '24px', color: '#334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {Icon && <Icon size={22} color="#2563eb" />} {title}
        </h3>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar userType="r" />
            <main style={{ flex: 1, padding: '48px 64px' }}>
                <header style={{ marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '1.875rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <UserPlus size={28} color="#2563eb" /> Comprehensive Patient Registration
                    </h1>
                    <p style={{ color: '#64748b' }}>Fill all clinical and administrative sections to enroll a new patient.</p>
                </header>

                <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', maxWidth: '1000px', margin: '0 auto' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '48px', padding: '48px', background: 'white', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', background: 'linear-gradient(135deg, #0ea5e9, #34d399)', borderRadius: '50% 50% 50% 10%' }}></div>
                            <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=600" alt="Doctor" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', border: '6px solid white', position: 'relative', zIndex: 1 }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#0f172a', lineHeight: '1.2' }}>Patient<br/>Enrollment</h2>
                            <p style={{ fontSize: '1.1rem', color: '#64748b', marginTop: '8px' }}>Standard Clinical Intake Form</p>
                            <div style={{ background: '#f1f5f9', color: '#334155', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', fontSize: '0.8rem', border: '1px solid #e2e8f0', display: 'inline-block', marginTop: '12px' }}>ID: {formData.patientDisplayId}</div>
                        </div>
                    </div>

                    <div style={{ padding: '48px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
                        
                        {/* 🧑 BASIC INFORMATION */}
                        <section>
                            <SectionHeader title="Basic Information" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label-text">Full Name *</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="input-field" placeholder="First Name" required />
                                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="input-field" placeholder="Last Name" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="label-text">Date of Birth *</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '8px' }}>
                                        <Select options={months} value={months.find(m => m.value === dobParts[1])} onChange={(opt) => handleDateChange('month', opt.value)} styles={customSelectStyles} placeholder="Month" />
                                        <Select options={days} value={days.find(d => d.value === dobParts[2])} onChange={(opt) => handleDateChange('day', opt.value)} styles={customSelectStyles} placeholder="Day" />
                                        <Select options={years} value={years.find(y => y.value === dobParts[0])} onChange={(opt) => handleDateChange('year', opt.value)} styles={customSelectStyles} placeholder="Year" />
                                    </div>
                                    {age !== null && <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#2563eb', fontWeight: '600' }}>Calculated Age: {age} years</div>}
                                </div>
                                <div>
                                    <label className="label-text">Gender</label>
                                    <Select name="gender" options={[{value:'Male',label:'Male'},{value:'Female',label:'Female'},{value:'Other',label:'Other'}]} value={formData.gender ? {value:formData.gender,label:formData.gender} : null} onChange={handleSelectChange} styles={customSelectStyles} placeholder="Select Gender" />
                                </div>
                                {!isMinor && (
                                    <div>
                                        <label className="label-text">Marital Status</label>
                                        <Select name="marital" options={[{value:'Single',label:'Single'},{value:'Married',label:'Married'},{value:'Divorced',label:'Divorced'},{value:'Widowed',label:'Widowed'}]} value={formData.marital ? {value:formData.marital,label:formData.marital} : null} onChange={handleSelectChange} styles={customSelectStyles} placeholder="Select Status" />
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 📞 CONTACT INFORMATION */}
                        <section>
                            <SectionHeader title="Contact Information" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <label className="label-text">Phone Number {isMinor ? '(Optional for Minors)' : '*'}</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field" placeholder="07XXXXXXXX" required={!isMinor} />
                                </div>
                                <div>
                                    <label className="label-text">Alternate Phone</label>
                                    <input type="tel" name="altPhone" value={formData.altPhone} onChange={handleChange} className="input-field" placeholder="07XXXXXXXX" />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label-text">Email Address {isMinor ? '(Optional)' : ''}</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="example@mail.com" />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label-text">Physical Address</label>
                                    <textarea name="address" value={formData.address} onChange={handleChange} className="input-field" rows="2" placeholder="Street, Building, Apartment"></textarea>
                                </div>
                                <div>
                                    <label className="label-text">City / Location</label>
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} className="input-field" />
                                </div>
                            </div>
                        </section>

                        {/* 🆔 IDENTIFICATION */}
                        <section>
                            <SectionHeader title="Identification" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <label className="label-text">National ID / Passport</label>
                                    <input type="text" name="nationalId" value={formData.nationalId} onChange={handleChange} className="input-field" />
                                </div>
                                <div>
                                    <label className="label-text">Insurance ID (Optional)</label>
                                    <input type="text" name="insuranceId" value={formData.insuranceId} onChange={handleChange} className="input-field" />
                                </div>
                            </div>
                        </section>

                        {/* 🧑⚕️ MEDICAL INFORMATION */}
                        <section>
                            <SectionHeader title="Medical Information" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <label className="label-text">Blood Group</label>
                                    <Select name="bloodGroup" options={['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=>({value:g,label:g}))} value={formData.bloodGroup?{value:formData.bloodGroup,label:formData.bloodGroup}:null} onChange={handleSelectChange} styles={customSelectStyles} />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label-text">Known Allergies</label>
                                    <textarea name="allergies" value={formData.allergies} onChange={handleChange} className="input-field" rows="2" placeholder="Drugs, Food, Environmental"></textarea>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label-text">Existing Medical Conditions</label>
                                    <textarea name="conditions" value={formData.conditions} onChange={handleChange} className="input-field" rows="2"></textarea>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label-text">Current Medications</label>
                                    <textarea name="medications" value={formData.medications} onChange={handleChange} className="input-field" rows="2" placeholder="List medications, dose, and frequency"></textarea>
                                </div>
                            </div>
                        </section>

                        {/* 🌡️ VITAL SIGNS (TRIAGE) */}
                        <section style={{ background: '#f0f9ff', padding: '32px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                            <SectionHeader icon={Thermometer} title="Vital Signs (Triage)" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label className="label-text">Temperature (°C)</label>
                                    <input type="text" name="temp" value={formData.temp} onChange={handleChange} className="input-field" placeholder="36.5" />
                                </div>
                                <div>
                                    <label className="label-text">Weight (kg)</label>
                                    <input type="text" name="weight" value={formData.weight} onChange={handleChange} className="input-field" placeholder="70" />
                                </div>
                                <div>
                                    <label className="label-text">Height (cm)</label>
                                    <input type="text" name="height" value={formData.height} onChange={handleChange} className="input-field" placeholder="175" />
                                </div>
                                <div>
                                    <label className="label-text">Blood Pressure</label>
                                    <input type="text" name="bp" value={formData.bp} onChange={handleChange} className="input-field" placeholder="120/80" />
                                </div>
                                <div>
                                    <label className="label-text">Heart Rate (bpm)</label>
                                    <input type="text" name="heartRate" value={formData.heartRate} onChange={handleChange} className="input-field" placeholder="72" />
                                </div>
                                <div>
                                    <label className="label-text">Resp. Rate</label>
                                    <input type="text" name="respiratory" value={formData.respiratory} onChange={handleChange} className="input-field" placeholder="16" />
                                </div>
                                <div>
                                    <label className="label-text">SpO₂ (%)</label>
                                    <input type="text" name="spo2" value={formData.spo2} onChange={handleChange} className="input-field" placeholder="98" />
                                </div>
                            </div>
                        </section>

                        {/* 🧠 ADDITIONAL HEALTH INFO */}
                        <section>
                            <SectionHeader icon={Info} title="Additional Health Info" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label-text">Disabilities (If any)</label>
                                    <input type="text" name="disabilities" value={formData.disabilities} onChange={handleChange} className="input-field" />
                                </div>
                                {(formData.gender === 'Female' && age >= 12) && (
                                    <div>
                                        <label className="label-text">Pregnancy Status</label>
                                        <Select name="pregnancy" options={[{value:'N/A',label:'N/A'},{value:'Pregnant',label:'Pregnant'},{value:'Not Pregnant',label:'Not Pregnant'}]} value={{value:formData.pregnancy,label:formData.pregnancy}} onChange={handleSelectChange} styles={customSelectStyles} />
                                    </div>
                                )}
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label-text">Immunization / Vaccination Status</label>
                                    <textarea name="immunization" value={formData.immunization} onChange={handleChange} className="input-field" rows="2"></textarea>
                                </div>
                            </div>
                        </section>

                        {/* 🚨 EMERGENCY CONTACT */}
                        <section>
                            <SectionHeader title="Emergency Contact" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                                <div>
                                    <label className="label-text">Contact Name</label>
                                    <input type="text" name="emergencyName" value={formData.emergencyName} onChange={handleChange} className="input-field" />
                                </div>
                                <div>
                                    <label className="label-text">Contact Phone</label>
                                    <input type="tel" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} className="input-field" placeholder="07XXXXXXXX" />
                                </div>
                                <div>
                                    <label className="label-text">Relationship</label>
                                    <input type="text" name="emergencyRelation" value={formData.emergencyRelation} onChange={handleChange} className="input-field" />
                                </div>
                            </div>
                        </section>

                        {/* 👨👩👧 GUARDIAN INFORMATION (Minors Only) */}
                        {isMinor && (
                            <section style={{ background: '#fffbeb', padding: '32px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                                <SectionHeader icon={ShieldCheck} title="Guardian Information (Patient is Under 18)" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div>
                                        <label className="label-text">Guardian Full Name *</label>
                                        <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} className="input-field" required />
                                    </div>
                                    <div>
                                        <label className="label-text">Relationship to Patient *</label>
                                        <Select name="guardianRelation" options={[{value:'Mother',label:'Mother'},{value:'Father',label:'Father'},{value:'Legal Guardian',label:'Legal Guardian'},{value:'Other',label:'Other'}]} value={formData.guardianRelation?{value:formData.guardianRelation,label:formData.guardianRelation}:null} onChange={handleSelectChange} styles={customSelectStyles} />
                                    </div>
                                    <div>
                                        <label className="label-text">Guardian Phone *</label>
                                        <input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} className="input-field" required />
                                    </div>
                                    <div>
                                        <label className="label-text">Guardian Email</label>
                                        <input type="email" name="guardianEmail" value={formData.guardianEmail} onChange={handleChange} className="input-field" />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label className="label-text">Guardian Address</label>
                                        <textarea name="guardianAddress" value={formData.guardianAddress} onChange={handleChange} className="input-field" rows="2"></textarea>
                                    </div>
                                    <div style={{ borderTop: '1px solid #fef3c7', gridColumn: 'span 2', paddingTop: '24px', marginTop: '12px' }}>
                                        <SectionHeader title="Guardian Identification" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                            <div>
                                                <label className="label-text">Guardian National ID / Passport</label>
                                                <input type="text" name="guardianId" value={formData.guardianId} onChange={handleChange} className="input-field" />
                                            </div>
                                            <div>
                                                <label className="label-text">Guardian Insurance Details</label>
                                                <input type="text" name="guardianInsurance" value={formData.guardianInsurance} onChange={handleChange} className="input-field" />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ borderTop: '1px solid #fef3c7', gridColumn: 'span 2', paddingTop: '24px', marginTop: '12px' }}>
                                        <SectionHeader title="Consent" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label className="label-text">Consent Given By (Name)</label>
                                                <input type="text" name="consentBy" value={formData.consentBy} onChange={handleChange} className="input-field" />
                                            </div>
                                            <div>
                                                <label className="label-text">Consent Date</label>
                                                <input type="date" name="consentDate" value={formData.consentDate} onChange={handleChange} className="input-field" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* 💳 PAYMENT INFORMATION */}
                        <section>
                            <SectionHeader icon={CreditCard} title="Payment Information" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <label className="label-text">Payment Method</label>
                                    <Select name="paymentMethod" options={[{value:'Cash',label:'Cash'},{value:'Card',label:'Card'},{value:'Insurance',label:'Insurance'}]} value={formData.paymentMethod?{value:formData.paymentMethod,label:formData.paymentMethod}:null} onChange={handleSelectChange} styles={customSelectStyles} />
                                </div>
                                {formData.paymentMethod === 'Insurance' && (
                                    <>
                                        <div>
                                            <label className="label-text">Insurance Provider</label>
                                            <input type="text" name="insuranceProvider" value={formData.insuranceProvider} onChange={handleChange} className="input-field" />
                                        </div>
                                        <div>
                                            <label className="label-text">Insurance Number</label>
                                            <input type="text" name="insuranceNumber" value={formData.insuranceNumber} onChange={handleChange} className="input-field" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>

                        {/* 📸 OPTIONAL EXTRAS */}
                        <section>
                            <SectionHeader icon={Camera} title="Optional Extras" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                                <div>
                                    <label className="label-text">Patient Photo URL (Optional)</label>
                                    <input type="text" name="photo" value={formData.photo} onChange={handleChange} className="input-field" placeholder="Paste image link or upload path" />
                                </div>
                                <div>
                                    <label className="label-text">Additional Notes / Comments</label>
                                    <textarea name="notes" value={formData.notes} onChange={handleChange} className="input-field" rows="3"></textarea>
                                </div>
                            </div>
                        </section>

                    </div>

                    {/* Footer / Submit */}
                    <div style={{ padding: '32px 48px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                        <button type="button" onClick={() => navigate('/registrar')} style={{ padding: '12px 32px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={loading} style={{ width: '100%', padding: '18px', fontSize: '1.1rem', background: loading ? '#94a3b8' : '#ff7200', border: 'none', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 10px 15px -3px rgba(255, 114, 0, 0.2)', marginBottom: '40px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '700' }}>
                            <Save size={20} /> {loading ? 'Registering...' : 'Register Patient & Generate Hospital ID'}
                        </button>
                    </div>
                </form>

                {/* CSS Helpers */}
                <style>{`
                    .label-text {
                        display: block;
                        font-size: 0.875rem;
                        font-weight: 600;
                        margin-bottom: 10px;
                        color: #475569;
                    }
                    .input-field {
                        width: 100%;
                        padding: 12px 16px;
                        border: 1px solid #cbd5e1;
                        border-radius: 8px;
                        font-size: 0.875rem;
                        transition: all 0.2s;
                    }
                    .input-field:focus {
                        outline: none;
                        border-color: #3b82f6;
                        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                    }
                `}</style>
            </main>
        </div>
    );
};

export default RegistrarRegistration;
