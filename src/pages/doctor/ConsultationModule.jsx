// =============================================================
// FILE: ConsultationModule.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import {
    Save, AlertTriangle, Pill, FlaskConical, Clock, ChevronLeft,
    Plus, Trash2, Clipboard, Activity, FileText, User,
    Stethoscope, Thermometer, Heart, Wind, UserCheck,
    LogOut, Calendar, Info, ShieldCheck, MapPin, Search, PlusCircle, X, Scissors, Camera, BookOpen, Droplets, ClipboardCheck
} from 'lucide-react';
import ClinicalModal from '../../components/shared/ClinicalModal';
import { searchIcd10, searchMedicines, getLabCatalog } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const ConsultationModule = () => {
    const [searchParams] = useSearchParams();
    const appoid = searchParams.get('appoid');
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('subjective');
    const [startTime] = useState(new Date());
    const [elapsedTime, setElapsedTime] = useState('00:00');
    const [clinicalModal, setClinicalModal] = useState({ open: false, title: '', message: '', type: 'info', onConfirm: null });
    const [ignoreLabGate, setIgnoreLabGate] = useState(false); // Gate bypass


    // Timer Effect
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const diff = Math.floor((now - startTime) / 1000);
            const mins = Math.floor(diff / 60).toString().padStart(2, '0');
            const secs = (diff % 60).toString().padStart(2, '0');
            setElapsedTime(`${mins}:${secs}`);
        }, 1000);
        return () => clearInterval(timer);
    }, [startTime]);

    // --- FORM STATE ---

    // Subjective
    const [subjective, setSubjective] = useState({
        consultation_type: 'Initial',
        chief_complaints: [], // Changed from chief_complaint: ''
        hpi: '',
        pmh: '',
        surgical_history: '',
        family_history: '',
        social_history: '',
        obstetric_history: '',
        allergies_detailed: '',
        immunization_history: '',
        ros: '',
        symptoms: [] // Array to store multiple symptoms
    });

    // Mock Symptom Database
    const symptomDatabase = [
        "Fever", "Cough", "Headache", "Fatigue", "Nausea", "Vomiting",
        "Diarrhea", "Shortness of breath", "Chest pain", "Abdominal pain",
        "Joint pain", "Muscle ache", "Loss of appetite", "Chills", "Night sweats",
        "Dizziness", "Sore throat", "Runny nose", "Skin rash", "Itching",

        "Back pain", "Swelling", "Weight loss", "Weight gain", "Blurred vision",
        "Double vision", "Ear pain", "Hearing loss", "Sneezing", "Wheezing",
        "Palpitations", "Heartburn", "Constipation", "Frequent urination",
        "Painful urination", "Blood in urine", "Dry mouth", "Excessive thirst",
        "Cold intolerance", "Heat intolerance", "Hair loss", "Brittle nails",

        "Anxiety", "Depression", "Confusion", "Memory loss", "Insomnia",
        "Seizures", "Tremors", "Numbness", "Tingling sensation", "Weakness",

        "Eye redness", "Eye pain", "Sensitivity to light", "Nasal congestion",
        "Post-nasal drip", "Hoarseness", "Difficulty swallowing",

        "Leg pain", "Arm pain", "Neck pain", "Stiffness", "Cramps",
        "Difficulty walking", "Balance problems",

        "Bruising easily", "Bleeding gums", "Pale skin", "Yellowing of skin",
        "Swollen lymph nodes", "Slow wound healing",

        "Sexual dysfunction", "Irregular periods", "Heavy periods",
        "Pelvic pain", "Vaginal discharge",

        "Dry skin", "Oily skin", "Acne", "Burning sensation", "Pins and needles",

        "Loss of smell", "Loss of taste", "Excessive sweating",
        "Dehydration", "Fainting", "Restlessness"
    ];

    const [symptomSearch, setSymptomSearch] = useState('');
    const [symptomResults, setSymptomResults] = useState([]);
    const [showSymptomDropdown, setShowSymptomDropdown] = useState(false);

    useEffect(() => {
        if (!symptomSearch) {
            setSymptomResults([]);
            setShowSymptomDropdown(false);
            return;
        }
        const results = symptomDatabase.filter(s => s.toLowerCase().includes(symptomSearch.toLowerCase()));
        setSymptomResults(results);
        setShowSymptomDropdown(true);
    }, [symptomSearch]);

    const [newComplaint, setNewComplaint] = useState('');


    // Objective
    const [vitals, setVitals] = useState({
        temp: '', bp: '', heart_rate: '', spo2: '', weight: '', height: '',
        respiratory_rate: '',
        bmi: '',
    });
    const [physicalExam, setPhysicalExam] = useState({
        general_appearance: 'Well-looking',
        head_neck: '',
        heent: '',
        cardiovascular: '',
        respiratory: '',
        abdomen: '',
        neurological: '',
        musculoskeletal: '',
        skin_integumentary: '',
        psychiatric: '',
    });

    // Assessment
    const [assessment, setAssessment] = useState({
        primary_diagnosis_code: '',
        diagnosis: '',
        secondary_diagnoses: [],
        differential_diagnoses: [],
        clinical_impression: ''
    });

    // Plan
    const [prescriptions, setPrescriptions] = useState([]);
    const [newDrug, setNewDrug] = useState({
        id: null,
        drug_id: '',
        drug_name: '',
        brand_name: '',
        drug_form: 'Tablet',
        dosage: '500mg',
        frequency: 'Twice a day (BD) [1x2]',
        route: 'By Mouth (Oral)',
        duration: '5 days',
        quantity: '',
        refills: '0',
        food_relation: 'After Food',
        instructions: ''
    });
    const [labRequests, setLabRequests] = useState([]);
    const [labTracker, setLabTracker] = useState([]); // Live tracking of orders
    const [labReports, setLabReports] = useState([]);
    const [catalog, setCatalog] = useState([]); // Past/Finalized lab results
    const [technicians, setTechnicians] = useState([]);
    const [selectedTech, setSelectedTech] = useState(null);
    const [bundles, setBundles] = useState([]); // Clinical Protocols
    const [newLab, setNewLab] = useState({ test_name: '', urgency: 'Routine', clinical_indication: '', specimen_type: '', order_notes: '' });

    // Modal States
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [showLabModal, setShowLabModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showLabResultsModal, setShowLabResultsModal] = useState(false);
    const [selectedLabResult, setSelectedLabResult] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    // Disposition
    const [disposition, setDisposition] = useState({
        status: 'Discharge',
        referral_specialty: '',
        referral_notes: '',
        follow_up_date: ''
    });

    // Additional Management States
    const [managementPlan, setManagementPlan] = useState('');
    const [imagingRequests, setImagingRequests] = useState([]);
    const [procedureOrders, setProcedureOrders] = useState([]);
    const [patientEducation, setPatientEducation] = useState('');
    const [sickLeave, setSickLeave] = useState({ required: false, days: '', notes: '' });

    // ICD-10 Search State
    const [icdSearchTerm, setIcdSearchTerm] = useState('');
    const [icdResults, setIcdResults] = useState([]);
    const [showIcdDropdown, setShowIcdDropdown] = useState(false);
    const [isSearchingIcd, setIsSearchingIcd] = useState(false);

    // Medicine Search State
    const [medSearch, setMedSearch] = useState('');
    const [medResults, setMedResults] = useState([]);
    const [showMedDropdown, setShowMedDropdown] = useState(false);
    const [isSearchingMed, setIsSearchingMed] = useState(false);

    // --- Persistence Logic ---
    const persistenceKey = `consultation_draft_${appoid}`;

    // 1. Recovery on Mount
    useEffect(() => {
        const savedDraft = localStorage.getItem(persistenceKey);
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                if (draft.subjective) setSubjective(draft.subjective);
                if (draft.vitals) setVitals(draft.vitals);
                if (draft.physicalExam) setPhysicalExam(draft.physicalExam);
                if (draft.assessment) setAssessment(draft.assessment);
                if (draft.prescriptions) setPrescriptions(draft.prescriptions);
                if (draft.labRequests) setLabRequests(draft.labRequests);
                if (draft.disposition) setDisposition(draft.disposition);
                if (draft.managementPlan) setManagementPlan(draft.managementPlan);
                if (draft.imagingRequests) setImagingRequests(draft.imagingRequests);
                if (draft.procedureOrders) setProcedureOrders(draft.procedureOrders);
                if (draft.patientEducation) setPatientEducation(draft.patientEducation);
                if (draft.sickLeave) setSickLeave(draft.sickLeave);

                showToast("Previous draft recovered successfully.", "info");
            } catch (e) {
                console.error("Failed to recover draft", e);
            }
        }
    }, [appoid]);

    // 2. Auto-Save Effect
    useEffect(() => {
        const draft = {
            subjective, vitals, physicalExam, assessment, prescriptions,
            labRequests, disposition, managementPlan, imagingRequests,
            procedureOrders, patientEducation, sickLeave
        };
        localStorage.setItem(persistenceKey, JSON.stringify(draft));
    }, [
        subjective, vitals, physicalExam, assessment, prescriptions,
        labRequests, disposition, managementPlan, imagingRequests,
        procedureOrders, patientEducation, sickLeave
    ]);

    // 3. Prevent Accidental Exit
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    useEffect(() => {
        if (icdSearchTerm.length < 2) {
            setIcdResults([]);
            setShowIcdDropdown(false);
            return;
        }

        const fetchResults = async () => {
            setIsSearchingIcd(true);
            try {
                const { data, error } = await searchIcd10(icdSearchTerm);
                if (error) {
                    console.error('Error fetching ICD-10 codes:', error.message);
                    return;
                }
                const mappedResults = data?.map(item => ({
                    code: item.code,
                    description: item.name
                })) || [];
                setIcdResults(mappedResults);
                setShowIcdDropdown(true);
            } catch (error) {
                console.error('Error fetching ICD-10 codes:', error);
            } finally {
                setIsSearchingIcd(false);
            }
        };

        const timer = setTimeout(fetchResults, 300);
        return () => clearTimeout(timer);
    }, [icdSearchTerm]);

    useEffect(() => {
        if (!medSearch || medSearch.length < 2) {
            setMedResults([]);
            setShowMedDropdown(false);
            return;
        }

        const fetchMeds = async () => {
            setIsSearchingMed(true);
            try {
                const { data, error } = await searchMedicines(medSearch);
                if (error) {
                    console.error('Error searching medicines:', error.message);
                    return;
                }
                setMedResults(data || []);
                setShowMedDropdown(true);
            } catch (error) {
                console.error('Error searching medicines:', error);
            } finally {
                setIsSearchingMed(false);
            }
        };

        const timer = setTimeout(fetchMeds, 300);
        return () => clearTimeout(timer);
    }, [medSearch]);

    // POS-Style Smart Quantity Calculator
    useEffect(() => {
        if (!newDrug.drug_name || !newDrug.frequency || !newDrug.duration) return;

        // Extract numeric days (e.g. "5 days" -> 5)
        const days = parseInt(newDrug.duration.replace(/[^0-9]/g, '')) || 0;

        // Map frequency to multiplier
        const freqMap = {
            'Once a day (OD)': 1,
            'Twice a day (BD)': 2,
            'Three times a day (TDS)': 3,
            'Four times a day (QID)': 4,
            'At Night': 1,
            'As needed (PRN)': 1,
            'Immediately (STAT)': 1
        };

        const multiplier = freqMap[newDrug.frequency] || 1;
        const total = days * multiplier;

        if (total > 0 && !newDrug.quantity) {
            setNewDrug(prev => ({ ...prev, quantity: `${total} ${prev.drug_form || 'Units'}` }));
        }
    }, [newDrug.frequency, newDrug.duration, newDrug.drug_name]);

    const handleSelectDiagnosis = (diag) => {
        if (!assessment.primary_diagnosis_code) {
            setAssessment({
                ...assessment,
                primary_diagnosis_code: diag.code,
                diagnosis: diag.description,
                diagnosis_details: diag // Store full object including chapter/category
            });
        } else {
            // Check if it already exists in primary or secondary
            if (assessment.primary_diagnosis_code === diag.code) return;
            if (assessment.secondary_diagnoses.find(d => d.code === diag.code)) return;

            setAssessment({
                ...assessment,
                secondary_diagnoses: [...assessment.secondary_diagnoses, diag]
            });
        }
        setIcdSearchTerm('');
        setShowIcdDropdown(false);
    };

    const handleRemovePrimaryDiagnosis = () => {
        // If there are secondary diagnoses, promote the first one to primary
        if (assessment.secondary_diagnoses.length > 0) {
            const nextPrimary = assessment.secondary_diagnoses[0];
            const remainingSecondary = assessment.secondary_diagnoses.slice(1);
            setAssessment({
                ...assessment,
                primary_diagnosis_code: nextPrimary.code,
                diagnosis: nextPrimary.description,
                diagnosis_details: nextPrimary,
                secondary_diagnoses: remainingSecondary
            });
        } else {
            setAssessment({
                ...assessment,
                primary_diagnosis_code: '',
                diagnosis: '',
                diagnosis_details: null
            });
        }
    };

    const handleRemoveSecondaryDiagnosis = (code) => {
        setAssessment({
            ...assessment,
            secondary_diagnoses: assessment.secondary_diagnoses.filter(d => d.code !== code)
        });
    };

    const fetchCatalog = useCallback(async () => {
        try {
            const { data, error } = await getLabCatalog();
            if (error) throw error;
            setCatalog(data || []);
            console.log('[Consultation] Loaded', data?.length || 0, 'lab tests');
        } catch (e) { 
            console.error("Catalog fetch failed:", e); 
            showToast('Lab catalog unavailable. Check Supabase RLS.', 'error');
        }
    }, [getLabCatalog]);

    const fetchBundles = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('treatment_bundles').select('*').eq('is_active', 1);
            if (error) throw error;
            setBundles(data ? data.map(r => ({ ...r, items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items || [] })) : []);
        } catch (e) { console.error("Bundles fetch failed", e); }
    }, []);

    const fetchTechnicians = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('lab_technician').select('labid, labname');
            if (error) throw error;
            setTechnicians(data || []);
            if (data?.length === 1) {
                setSelectedTech(data[0].labid);
            }
        } catch (e) { console.error("Techs fetch failed", e); }
    }, []);

    const applyProtocol = (bundle) => {
        const labsToAdd = bundle.items.filter(i => i.type === 'lab');
        const medsToAdd = bundle.items.filter(i => i.type === 'medicine');

        setLabRequests([...labRequests, ...labsToAdd.map(l => ({
            test_name: l.name,
            urgency: 'Routine',
            clinical_indication: `Protocol: ${bundle.name}. ${l.instructions || ''}`,
            id: Date.now() + Math.random()
        }))]);

        setPrescriptions([...prescriptions, ...medsToAdd.map(m => {
            // Try to parse dosage/frequency from instructions if they look like "500mg 1x3"
            const parts = (m.instructions || '').split(' ');
            return {
                drug_name: m.name,
                dosage: parts[0] || 'As per protocol',
                frequency: parts[1] || 'Once a day (OD) [1x1]',
                duration: '5 days',
                food_relation: 'After Food',
                route: 'By Mouth (Oral)',
                instructions: m.instructions || '',
                id: Date.now() + Math.random()
            };
        })]);

        showToast(`Applied Protocol: ${bundle.name}`, "success");
    };

    const availableLabs = catalog.filter(t => t.is_enabled).map(t => t.test_name);
    useEffect(() => {
        refreshData();
        fetchCatalog();
        fetchBundles();
        fetchTechnicians();
    }, [appoid, navigate, fetchCatalog, fetchBundles, fetchTechnicians]);

    const refreshData = async () => {
        if (!appoid || appoid === 'null') {
            setLoading(false);
            return;
        }
        try {
            // Get Appointment & Patient Details
            const { data: apptData, error: apptError } = await supabase
                .from('appointment')
                .select('*, patient!inner(*)')
                .eq('appoid', appoid);

            if (apptError) throw apptError;
            const appointment = apptData?.[0];
            
            if (appointment && appointment.patient) {
                const patientData = appointment.patient;
                setPatient(patientData);
                
                // Pre-fill vitals from nursing if available
                setVitals({
                    temp: patientData.ptemp || '',
                    bp: patientData.pbp || '',
                    heart_rate: patientData.pheartrate || '',
                    respiratory_rate: patientData.prespiratory || '',
                    spo2: patientData.pspo2 || '',
                    weight: patientData.pweight || '',
                    height: patientData.pheight || '',
                    bmi: (patientData.pweight && patientData.pheight) ? (patientData.pweight / ((patientData.pheight / 100) ** 2)).toFixed(1) : ''
                });

                // Get Past Consultations History
                const { data: historyData } = await supabase
                    .from('consultations')
                    .select('id, consultation_date, diagnosis, clinical_impression')
                    .eq('pid', patientData.pid) // Changed from patient_id to pid
                    .in('status', ['final', 'completed'])
                    .order('consultation_date', { ascending: false })
                    .range(0, 4);
                
                setHistory(historyData || []);

                // Get Existing Draft
                const { data: draftResults } = await supabase
                    .from('consultations')
                    .select('id, appointment_id, pid, docid, status, consultation_type, chief_complaint, symptoms, hpi, pmh, surgical_history, social_history, obstetric_history, immunization_history, ros, general_appearance, head_neck, eyes_ent, cardiovascular, respiratory, abdomen, neurological, musculoskeletal, skin, psychiatric, primary_diagnosis_code, diagnosis, secondary_diagnoses, differential_diagnoses, clinical_impression, management_plan, disposition')
                    .eq('appointment_id', appoid);

                const draftData = draftResults?.[0];

                if (draftData) {
                    const d = draftData;
                    setSubjective({
                        consultation_type: d.consultation_type || 'Initial',
                        chief_complaints: d.chief_complaint ? d.chief_complaint.split(', ') : [],
                        symptoms: d.symptoms ? d.symptoms.split(', ') : [],
                        hpi: d.hpi || '',
                        pmh: d.pmh || '',
                        surgical_history: d.surgical_history || '',
                        family_history: d.family_history || '',
                        social_history: d.social_history || '',
                        obstetric_history: d.obstetric_history || '',
                        allergies_detailed: d.allergies_detailed || '',
                        immunization_history: d.immunization_history || '',
                        ros: d.ros || ''
                    });
                    setPhysicalExam({
                        general_appearance: d.general_appearance || '',
                        head_neck: d.head_neck || '',
                        heent: d.eyes_ent || '',
                        cardiovascular: d.cardiovascular || '',
                        respiratory: d.respiratory || '',
                        abdomen: d.abdomen || '',
                        neurological: d.neurological || '',
                        musculoskeletal: d.musculoskeletal || '',
                        skin_integumentary: d.skin || '',
                        psychiatric: d.psychiatric || ''
                    });
                    setAssessment({
                        primary_diagnosis_code: d.primary_diagnosis_code || '',
                        diagnosis: d.diagnosis || '',
                        secondary_diagnoses: d.secondary_diagnoses ? JSON.parse(d.secondary_diagnoses) : [],
                        differential_diagnoses: d.differential_diagnoses ? JSON.parse(d.differential_diagnoses) : [],
                        clinical_impression: d.clinical_impression || ''
                    });
                    setManagementPlan(d.management_plan || '');
                    if (d.disposition) {
                       try { setDisposition(JSON.parse(d.disposition)); } catch(e) {}
                    }

                    // Fetch related draft data
                    const [ { data: draftPrescriptions }, { data: draftLabs } ] = await Promise.all([
                        supabase.from('prescriptions').select('id, drug_name, dosage, frequency, duration').eq('consultation_id', d.id),
                        supabase.from('lab_requests').select('id, test_name, status').eq('consultation_id', d.id)
                    ]);

                    if (draftPrescriptions) {
                        setPrescriptions(draftPrescriptions.map(p => ({
                            ...p,
                            id: p.id || (Date.now() + Math.random())
                        })));
                    }
                    // Deliberately NOT loading draftLabs into labRequests. 
                    // labRequests is a temporary "shopping cart" for new orders. 
                    // Once saved to DB, they move to labTracker.
                }

                // Lab Tracker
                const { data: activeLabs, error: labsError } = await supabase
                    .from('lab_requests')
                    .select('id, test_name, status, created_at, appointment_id')
                    .eq('appointment_id', appoid);
                    
                if (activeLabs && activeLabs.length > 0) {
                    setLabTracker(activeLabs);
                    
                    // Fetch reports separately
                    const requestIds = activeLabs.map(l => l.id);
                    const { data: reportsData } = await supabase
                        .from('lab_reports')
                        .select('id, request_id, test_name, results, created_at')
                        .in('request_id', requestIds);
                    
                    setLabReports(reportsData || []);
                }
            }
        } catch (err) {
            console.error("Failed to fetch patient data", err);
        } finally {
            setLoading(false);
        }
    };

    // Auto-save every 2 minutes
    useEffect(() => {
        if (!patient) return;
        const timer = setInterval(() => {
            saveProgress();
        }, 120000);
        return () => clearInterval(timer);
    }, [patient, subjective, physicalExam, assessment, managementPlan, prescriptions, labRequests]);

    const handleSelectMed = (med) => {
        const isExpired = new Date(med.expiry_date) < new Date();
        const isDepleted = med.stock_qty <= 0;

        if (isExpired) {
            setClinicalModal({
                open: true,
                type: 'warning',
                title: 'Expired Medication Warning',
                message: `WARNING: ${med.med_name} has EXPIRED (${med.expiry_date}). While you can still prescribe it for clinical reasons, please note the pharmacy will be blocked from dispensing it until it is replenished.`,
                onConfirm: () => {
                    setNewDrug({
                        ...newDrug,
                        drug_id: med.id,
                        drug_name: med.med_name,
                        brand_name: med.brand_name || '',
                        drug_form: med.med_type || 'Tablet',
                        dosage: med.dosage || '500mg',
                        frequency: 'Twice a day (BD) [1x2]',
                        duration: '5 days',
                        sell_price: med.selling_price,
                        stock: med.stock_qty,
                        food_relation: 'After Food'
                    });
                    setMedSearch(med.med_name);
                    setShowMedDropdown(false);
                }
            });
            return;
        }
        if (isDepleted) {
            showToast(`${med.med_name} is currently out of stock. The pharmacist will need to restock before dispensing.`, "info");
        }

        setNewDrug({
            ...newDrug,
            drug_id: med.id,
            drug_name: med.med_name,
            brand_name: med.brand_name || '',
            drug_form: med.med_type || 'Tablet',
            dosage: med.dosage || '500mg',
            frequency: 'Twice a day (BD) [1x2]',
            duration: '5 days',
            sell_price: med.selling_price,
            stock: med.stock_qty,
            food_relation: 'After Food'
        });
        setMedSearch(med.med_name);
        setShowMedDropdown(false);
    };

    // Handlers
    const handleAddDrug = () => {
        if (!newDrug.drug_name) {
            showToast("Please select or enter a medicine name first.", "error");
            return;
        }

        if (newDrug.id) {
            // Update existing
            setPrescriptions(prescriptions.map(p => p.id === newDrug.id ? { ...newDrug } : p));
        } else {
            // Add new
            setPrescriptions([...prescriptions, { ...newDrug, id: Date.now() }]);
        }

        setNewDrug({
            id: null,
            drug_id: '',
            drug_name: '',
            brand_name: '',
            drug_form: 'Tablet',
            dosage: '500mg',
            frequency: 'Twice a day (BD) [1x2]',
            route: 'By Mouth (Oral)',
            duration: '5 days',
            quantity: '',
            refills: '0',
            food_relation: 'After Food',
            instructions: ''
        });
        setMedSearch(''); // Clear the search bar
    };

    const handleEditDrug = (drug) => {
        setNewDrug({ ...drug });
        setMedSearch(drug.drug_name);
    };

    const handleAddLab = () => {
        if (!newLab.test_name) return;
        setLabRequests([...labRequests, { ...newLab, id: Date.now() }]);
        setNewLab({ test_name: '', clinical_indication: '', specimen_type: 'Blood', urgency: 'Routine', order_notes: '' });
        // showToast("Investigation added to visit plan.", "success"); // Removed to avoid modal clutter
    };


    const saveToSupabase = async (status, options = {}) => {
        const labsToSync = options.labOverride || labRequests;
        if (!patient || !profile) {
            showToast('Missing patient/doctor data. Refresh page.', 'error');
            return false;
        }
        try {
            console.log('[saveToSupabase] Starting save for status:', status, 'appoid:', appoid);
            
            // Build payload using only columns confirmed to exist in the consultations table.
            // Consolidate fields that don't have dedicated columns into the notes/hpi/clinical_impression fields.
            const chiefComplaints = [
                ...subjective.chief_complaints,
                ...subjective.symptoms
            ].join('; ');

            const consultationPayload = {
                appointment_id: Number(appoid), // Ensure integer
                pid: Number(patient.pid),       // Ensure integer
                docid: Number(profile.id),      // Ensure integer
                consultation_date: new Date().toISOString(),
                status: status,
                consultation_type: subjective.consultation_type || 'Initial',
                chief_complaint: (subjective.chief_complaints || []).join(', '),
                symptoms: (subjective.symptoms || []).join(', '),
                hpi: subjective.hpi || '',
                pmh: subjective.pmh,
                surgical_history: subjective.surgical_history,
                family_history: subjective.family_history,
                social_history: subjective.social_history,
                obstetric_history: subjective.obstetric_history,
                immunization_history: subjective.immunization_history,
                ros: subjective.ros,
                general_appearance: physicalExam.general_appearance,
                head_neck: physicalExam.head_neck,
                eyes_ent: physicalExam.heent,
                cardiovascular: physicalExam.cardiovascular,
                respiratory: physicalExam.respiratory,
                abdomen: physicalExam.abdomen,
                neurological: physicalExam.neurological,
                musculoskeletal: physicalExam.musculoskeletal,
                skin: physicalExam.skin_integumentary,
                psychiatric: physicalExam.psychiatric,
                primary_diagnosis_code: assessment.primary_diagnosis_code,
                diagnosis: assessment.diagnosis,
                secondary_diagnoses: JSON.stringify(assessment.secondary_diagnoses || []),
                differential_diagnoses: JSON.stringify(assessment.differential_diagnoses || []),
                clinical_impression: assessment.clinical_impression,
                management_plan: managementPlan,
                disposition: JSON.stringify(disposition || {})
            };

            // Check for existing consultation - using plain select to avoid ':1' bug
            const { data: existingDrafts, error: draftError } = await supabase
                .from('consultations')
                .select('id')
                .eq('appointment_id', appoid);

            if (draftError) {
                console.error('[saveToSupabase] Lookup error:', draftError);
                throw new Error(`Consultation lookup failed: ${draftError.message}`);
            }

            const existingDraft = existingDrafts && existingDrafts.length > 0 ? existingDrafts[0] : null;
            let consultId;
            if (existingDraft) {
                const { error: updateError } = await supabase
                    .from('consultations')
                    .update(consultationPayload)
                    .eq('id', existingDraft.id);
                if (updateError) throw updateError;
                consultId = existingDraft.id;
            } else {
                const { data: newConsults, error: insertError } = await supabase
                    .from('consultations')
                    .insert([consultationPayload])
                    .select('id');
                
                if (insertError) throw insertError;
                consultId = newConsults?.[0]?.id;
                if (!consultId) throw new Error('Failed to retrieve consultation ID after insert');
            }
            console.log('[saveToSupabase] Consultation ID confirmed:', consultId);

            // Prescriptions
            const { error: presDeleteError } = await supabase.from('prescriptions').delete().eq('consultation_id', consultId);
            if (presDeleteError) console.warn('Prescriptions cleanup warning:', presDeleteError.message);
            
            if (prescriptions.length > 0) {
                const rxPayload = prescriptions.map(p => ({
                    consultation_id: Number(consultId),
                    pid: Number(patient.pid),
                    docid: Number(profile.id),
                    appointment_id: Number(appoid),
                    drug_name: p.drug_name,
                    dosage: p.dosage,
                    frequency: p.frequency,
                    duration: p.duration || '7 days',
                    date: new Date().toISOString().split('T')[0]
                }));
                const { error: presError } = await supabase.from('prescriptions').insert(rxPayload);
                if (presError) {
                    console.error('Prescriptions insert failed:', presError);
                    if (presError.message.includes('RLS')) showToast('Prescription save blocked (check RLS policies)', 'error');
                    else showToast(`Prescriptions failed: ${presError.message}`, 'error');
                } else {
                    console.log('[save] Saved', prescriptions.length, 'prescriptions');
                }
            }

            // Lab Requests - Only sync items that haven't been "sent" yet
            // We differentiate by checking if they are in our local 'labRequests' list
            if (labsToSync.length > 0) {
                // Only inserting NEW lab orders from the shopping cart.
                // We no longer delete pending ones, so multiple orders can be placed over time.

                const labPayload = labsToSync.map(l => ({
                    consultation_id: Number(consultId),
                    appointment_id: Number(appoid),
                    test_name: l.test_name,
                    status: 'pending',
                    technician_id: selectedTech ? Number(selectedTech) : null,
                    urgency: l.urgency || 'Routine',
                    clinical_indication: l.clinical_indication || '',
                    specimen_type: l.specimen_type || '',
                    order_notes: l.order_notes || ''
                }));
                console.log('[saveToSupabase] Inserting lab payload:', labPayload);
                const { error: labError } = await supabase.from('lab_requests').insert(labPayload);
                if (labError) {
                    console.error('Lab requests insert failed:', labError);
                    if (labError.message.includes('RLS') || labError.message.includes('policy')) {
                        showToast('🚨 Lab orders blocked - Check Supabase RLS policies for lab_requests (doctor role)', 'error');
                    } else {
                        showToast(`Lab orders failed: ${labError.message.substring(0,100)}`, 'error');
                    }
                } else {
                    console.log('[save] Sent', labsToSync.length, 'lab requests');
                    showToast(`✅ Sent ${labsToSync.length} lab order(s) successfully! Check DoctorLabs page.`, 'success');
                }
            }

            // Vitals (no error handling needed - optional)
            const vitalsPayload = {
                consultation_id: consultId,
                appointment_id: appoid,
                patient_id: patient.pid,
                temp: vitals.temp || null,
                bp: vitals.bp || null,
                heart_rate: vitals.heart_rate || null,
                respiratory_rate: vitals.respiratory_rate || null,
                spo2: vitals.spo2 || null,
                weight: vitals.weight || null,
                height: vitals.height || null,
                bmi: vitals.bmi || null
            };
            await supabase.from('vitals_records').delete().eq('consultation_id', consultId);
            await supabase.from('vitals_records').insert(vitalsPayload);

            if (status === 'final') {
                await supabase.from('appointment').update({status: 'Completed'}).eq('appoid', appoid);
            }
            return true;
        } catch (e) {
            console.error('[saveToSupabase] FULL ERROR:', e);
            const msg = e.message || (typeof e === 'object' ? JSON.stringify(e) : String(e));
            if (msg.includes('RLS') || msg.includes('policy') || msg.includes('permission')) {
                showToast('🚫 RLS Policy Error: Doctor cannot save requests. Fix in Supabase Dashboard.', 'error');
            } else if (msg.includes('Foreign key') || msg.includes('violates foreign key')) {
                showToast('Database FK error - Check doctor/patient IDs.', 'error');
            } else {
                showToast(`Save Error: ${msg.substring(0, 100)}`, 'error');
            }
            return false;
        }
    };

    const handleSaveDraft = async (redirect = true) => {
        const success = await saveToSupabase('draft');
        if (success) {
            if (redirect) {
                showToast("Draft saved successfully. Redirecting...", "success");
                navigate('/doctor/labs');
            }
        } else {
            showToast("Failed to save draft.", "error");
        }
    };

    const saveProgress = async () => {
        if (!patient) return false;
        const success = await saveToSupabase('draft');
        if (success) console.log("Background save complete");
        else console.error("Auto-save failed");
        return success;
    };

    const instantSendLab = async (testItem = null) => {
        if (!patient || !profile) return;
        
        // If it's a specific test from the modal
        if (testItem) {
            // Explicitly build the list to avoid React state race conditions
            const updatedList = [...labRequests, { ...testItem, id: Date.now() }];
            setLabRequests(updatedList);
            
            const success = await saveToSupabase('draft', { labOverride: updatedList });
            if (success) {
                setLabRequests([]); // Clear after sending
                setShowLabModal(false);
                refreshData();
            }
        } else if (labRequests.length > 0) {
            // Sending all currently added but unsent tests
            const success = await saveToSupabase('draft');
            if (success) {
                setLabRequests([]);
                refreshData();
            }
        }
    };

    const handleAddSymptom = (s) => {
        if (!subjective.symptoms.includes(s)) {
            setSubjective({ ...subjective, symptoms: [...subjective.symptoms, s] });
            setTimeout(saveProgress, 100);
        }
        setSymptomSearch('');
        setShowSymptomDropdown(false);
    };

    const handleRemoveSymptom = (s) => {
        setSubjective({ ...subjective, symptoms: subjective.symptoms.filter(item => item !== s) });
        setTimeout(saveProgress, 100);
    };

    const handleAddComplaint = () => {
        if (newComplaint.trim() && !subjective.chief_complaints.includes(newComplaint.trim())) {
            setSubjective({
                ...subjective,
                chief_complaints: [...subjective.chief_complaints, newComplaint.trim()]
            });
            setNewComplaint('');
            setTimeout(saveProgress, 100);
        }
    };

    const handleRemoveComplaint = (c) => {
        setSubjective({
            ...subjective,
            chief_complaints: subjective.chief_complaints.filter(item => item !== c)
        });
        setTimeout(saveProgress, 100);
    };

    const handleSave = async () => {
        const success = await saveToSupabase('final');
        if (success) {
            localStorage.removeItem(persistenceKey);
            showToast("Consultation completed successfully", "success");
            navigate('/doctor');
        } else {
            alert("Failed to save consultation.");
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f1f5f9' }}>
            <Sidebar userType="d" />
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Activity size={48} className="animate-pulse" style={{ color: '#2563eb', marginBottom: '16px' }} />
                    <p>Opening Clinical Case File...</p>
                </div>
            </main>
        </div>
    );

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f1f5f9' }}>
            <Sidebar userType="d" />

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                {/* Modern Clinical Header */}
                <header style={{
                    padding: '16px 32px',
                    background: 'white',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button onClick={() => navigate('/doctor')} style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            border: '1px solid #e2e8f0', background: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: '0.2s'
                        }}>
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            {patient ? (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>{patient.pname}</h2>
                                        <span style={{ padding: '2px 8px', background: '#e2e8f0', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>#{patient.patient_display_id || patient.pid}</span>
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{patient.age}Y • {patient.pdob} • {patient.ptel}</p>
                                </>
                            ) : (
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#64748b' }}>No Patient Selected</h2>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        {patient && (
                            <>
                                <div style={{ textAlign: 'right', borderRight: '1px solid #e2e8f0', paddingRight: '16px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Started At</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                <div style={{ textAlign: 'right', marginRight: '16px', borderRight: '1px solid #e2e8f0', paddingRight: '16px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</div>
                                    <div style={{
                                        fontSize: '0.9rem',
                                        fontWeight: '800',
                                        color: parseInt(elapsedTime.split(':')[0]) >= 20 ? '#ef4444' : '#2563eb',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <Clock size={14} /> {elapsedTime}
                                    </div>
                                </div>
                            </>
                        )}
                        <button onClick={saveProgress} disabled={!patient} style={{
                            background: 'white', border: '1px solid #e2e8f0', padding: '12px 20px',
                            borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                            fontWeight: '600', color: '#64748b', cursor: patient ? 'pointer' : 'not-allowed'
                        }}>
                            <Clipboard size={18} /> Save Draft
                        </button>
                        <button onClick={handleSave} disabled={!patient} className="btn-primary" style={{
                            background: patient ? '#0f172a' : '#94a3b8', border: 'none', padding: '12px 24px',
                            borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                            fontWeight: '600', color: 'white', cursor: patient ? 'pointer' : 'not-allowed'
                        }}>
                            <Save size={18} /> Finalize Encounter
                        </button>
                    </div>
                </header>

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Sidebar: Patient Summary & Quick Access */}
                    <aside style={{
                        width: '320px',
                        background: 'white',
                        borderRight: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '2px 0 8px rgba(0,0,0,0.02)',
                        zIndex: 5
                    }}>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                            {!patient ? (
                                <div style={{ textAlign: 'center', paddingTop: '40px', color: '#94a3b8' }}>
                                    <User size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                    <p style={{ fontSize: '0.875rem' }}>Select a patient from the queue to see their summary.</p>
                                </div>
                            ) : (
                                <>
                                    <div style={{ marginBottom: '24px' }}>
                                        <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Activity size={14} /> Triage Vitals
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Temp</div>
                                                <div style={{ fontSize: '1rem', fontWeight: '700' }}>{vitals.temp || '--'}°C</div>
                                            </div>
                                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>BP</div>
                                                <div style={{ fontSize: '1rem', fontWeight: '700' }}>{vitals.bp || '--/--'}</div>
                                            </div>
                                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>HR</div>
                                                <div style={{ fontSize: '1rem', fontWeight: '700' }}>{vitals.heart_rate || '--'} bpm</div>
                                            </div>
                                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>SpO2</div>
                                                <div style={{ fontSize: '1rem', fontWeight: '700' }}>{vitals.spo2 || '--'}%</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '24px' }}>
                                        <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <AlertTriangle size={14} color="#ef4444" /> Risk Factors
                                        </h4>
                                        <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#991b1b', fontSize: '0.875rem' }}>
                                            <strong>Allergies:</strong> {patient.allergies || 'None recorded'}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Clock size={14} /> History
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {history.length === 0 ? <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No previous visits.</p> : history.map(h => (
                                                <div key={h.id} style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '12px' }}>
                                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{h.consultation_date}</div>
                                                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>{h.diagnosis || 'General Checkup'}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </aside>

                    {/* Main Workspace: Clinical Tabs */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {/* Navigation - Quick Jump Menu */}
                        <div style={{
                            display: 'flex',
                            background: 'white',
                            borderBottom: '1px solid #e2e8f0',
                            padding: '8px 24px',
                            position: 'relative',
                            gap: '4px',
                            alignItems: 'center',
                            boxShadow: '0 4px 6px -4px rgba(0,0,0,0.05)',
                            zIndex: 10
                        }}>
                            {[
                                { id: 'subjective', label: 'History (S)', icon: User },
                                { id: 'objective', label: 'Examination (O)', icon: Stethoscope },
                                { id: 'assessment', label: 'Diagnosis (A)', icon: Clipboard },
                                { id: 'investigations', label: 'Investigations (I)', icon: FlaskConical },
                                { id: 'plan', label: 'Plan (P)', icon: Pill },
                                { id: 'disposition', label: 'Finalize', icon: LogOut },
                            ].map(tab => {
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            const element = document.getElementById(tab.id);
                                            if (element) {
                                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }
                                        }}
                                        disabled={!patient}
                                        style={{
                                            padding: '10px 18px',
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: patient ? 'pointer' : 'not-allowed',
                                            color: '#64748b',
                                            opacity: patient ? 1 : 0.5,
                                            fontWeight: '700',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            transition: 'all 0.25s',
                                            fontSize: '0.85rem',
                                            minWidth: '150px',
                                            justifyContent: 'center'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <tab.icon size={18} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Scrollable Content Area */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', background: '#f8fafc', position: 'relative' }}>
                            {!patient && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(248, 250, 252, 0.8)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                                    <div style={{ textAlign: 'center', background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0', maxWidth: '400px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                                        <Stethoscope size={48} color="#2563eb" style={{ marginBottom: '20px' }} />
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px' }}>Workbench Ready</h3>
                                        <p style={{ color: '#64748b', marginBottom: '24px' }}>Please select a patient from the queue to start a clinical consultation session.</p>
                                        <button onClick={() => navigate('/doctor/appointments')} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                                            Open Queue
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div style={{ maxWidth: '950px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '64px', paddingBottom: '120px' }}>
                                <section id="subjective" style={{ scrollMarginTop: '20px' }}>
                                    {/* SOAP Guidance */}
                                    <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #dcfce7', display: 'flex', gap: '12px' }}>
                                        <Info size={20} color="#166534" />
                                        <p style={{ fontSize: '0.85rem', color: '#166534' }}>
                                            <strong>Subjective (S):</strong> Record the patient's own words. Focus on the Chief Complaint (why they are here) and the History of Presenting Illness (HPI).
                                        </p>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label className="label">Consultation Type</label>
                                            <select className="input-field" value={subjective.consultation_type} onChange={e => setSubjective({ ...subjective, consultation_type: e.target.value })}>
                                                <option>Initial</option><option>Follow-up</option><option>Review</option><option>Emergency</option><option>Ward Round</option>
                                            </select>
                                        </div>
                                    </div>
                                    {/* Clinical Presentation Box */}
                                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                                            <Activity size={18} color="#2563eb" /> Patient Presentation & Symptoms
                                        </h3>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '24px' }}>
                                            {/* Database Search */}
                                            <div>
                                                <label className="label" style={{ color: '#2563eb' }}>Search Clinical Database</label>
                                                <div style={{ position: 'relative' }}>
                                                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                                        <Search size={18} />
                                                    </div>
                                                    <input
                                                        className="input-field"
                                                        style={{ paddingLeft: '40px' }}
                                                        placeholder="Search standard symptoms..."
                                                        value={symptomSearch}
                                                        onChange={e => setSymptomSearch(e.target.value)}
                                                    />
                                                    {showSymptomDropdown && (
                                                        <div style={{
                                                            position: 'absolute', zIndex: 50, top: '100%', left: 0, right: 0,
                                                            background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                                                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', marginTop: '4px',
                                                            maxHeight: '180px', overflowY: 'auto'
                                                        }}>
                                                            {symptomResults.map(res => (
                                                                <div key={res} onClick={() => handleAddSymptom(res)} style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }} onMouseEnter={e => e.target.style.background = '#f0f9ff'} onMouseLeave={e => e.target.style.background = 'white'}>{res}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Manual Entry */}
                                            <div>
                                                <label className="label" style={{ color: '#64748b' }}>Other / Custom Entry</label>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <input
                                                        className="input-field"
                                                        value={newComplaint}
                                                        onChange={e => setNewComplaint(e.target.value)}
                                                        onKeyPress={e => e.key === 'Enter' && handleAddComplaint()}
                                                        placeholder="Type custom observation..."
                                                    />
                                                    <button
                                                        onClick={handleAddComplaint}
                                                        className="btn-primary"
                                                        style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', padding: '0 16px' }}
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Unified Tags Area */}
                                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Recorded Observations</span>
                                                <span>{subjective.chief_complaints.length + subjective.symptoms.length} items</span>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {/* Database Tags */}
                                                {subjective.symptoms.map(s => (
                                                    <span key={s} style={{
                                                        background: '#eff6ff', color: '#1e40af', padding: '6px 14px',
                                                        borderRadius: '100px', fontSize: '0.875rem', fontWeight: '600',
                                                        display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #dbeafe'
                                                    }}>
                                                        <ShieldCheck size={14} /> {s}
                                                        <X size={14} style={{ cursor: 'pointer' }} onClick={() => handleRemoveSymptom(s)} />
                                                    </span>
                                                ))}
                                                {/* Custom Tags */}
                                                {subjective.chief_complaints.map(c => (
                                                    <span key={c} style={{
                                                        background: 'white', color: '#334155', padding: '6px 14px',
                                                        borderRadius: '100px', fontSize: '0.875rem', fontWeight: '600',
                                                        display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0'
                                                    }}>
                                                        <PlusCircle size={14} /> {c}
                                                        <X size={14} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => handleRemoveComplaint(c)} />
                                                    </span>
                                                ))}
                                                {subjective.symptoms.length === 0 && subjective.chief_complaints.length === 0 && (
                                                    <span style={{ color: '#94a3b8', fontSize: '0.875rem', fontStyle: 'italic' }}>No observations recorded yet.</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* History & Background Box */}
                                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                                            <Clipboard size={18} color="#2563eb" /> Clinical History & Background
                                        </h3>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                            <div>
                                                <label className="label">History of Presenting Illness (HPI)</label>
                                                <textarea className="input-field" rows="4" value={subjective.hpi} onChange={e => setSubjective({ ...subjective, hpi: e.target.value })} placeholder="Detailed description of onset, duration, character, radiation..."></textarea>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                                <div>
                                                    <label className="label">Past Medical History (PMH)</label>
                                                    <textarea className="input-field" rows="3" value={subjective.pmh} onChange={e => setSubjective({ ...subjective, pmh: e.target.value })} placeholder="Hypertension, Diabetes, Chronic conditions..."></textarea>
                                                </div>
                                                <div>
                                                    <label className="label">Surgical History</label>
                                                    <textarea className="input-field" rows="3" value={subjective.surgical_history} onChange={e => setSubjective({ ...subjective, surgical_history: e.target.value })} placeholder="Past procedures, dates, complications..."></textarea>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                                <div>
                                                    <label className="label">Social & Family History</label>
                                                    <textarea className="input-field" rows="2" value={subjective.social_history} onChange={e => setSubjective({ ...subjective, social_history: e.target.value })} placeholder="Smoking, Alcohol, Family conditions..."></textarea>
                                                </div>
                                                <div>
                                                    <label className="label">Allergies (Detailed)</label>
                                                    <textarea className="input-field" rows="2" value={subjective.allergies_detailed} onChange={e => setSubjective({ ...subjective, allergies_detailed: e.target.value })} placeholder="Drug/Food reactions & severity..."></textarea>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                                <div>
                                                    <label className="label">Medication History</label>
                                                    <textarea className="input-field" rows="3" value={subjective.medication_history} onChange={e => setSubjective({ ...subjective, medication_history: e.target.value })} placeholder="Current medications, dosage, compliance..."></textarea>
                                                </div>
                                                <div>
                                                    <label className="label">OB/GYN History (If Applicable)</label>
                                                    <textarea className="input-field" rows="3" value={subjective.ob_gyn_history} onChange={e => setSubjective({ ...subjective, ob_gyn_history: e.target.value })} placeholder="LMP, Parity, Gravidity, Cycle..."></textarea>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="label">Review of Systems (ROS)</label>
                                                <textarea className="input-field" rows="2" value={subjective.ros} onChange={e => setSubjective({ ...subjective, ros: e.target.value })} placeholder="Systemic assessment notes..."></textarea>
                                            </div>
                                        </div>
                                    </div>

                                </section>
                                <section id="objective" style={{ scrollMarginTop: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {/* SOAP Guidance */}
                                    <div style={{ background: '#fdfaf1', padding: '16px', borderRadius: '8px', border: '1px solid #fef3c7', display: 'flex', gap: '12px' }}>
                                        <Info size={20} color="#92400e" />
                                        <p style={{ fontSize: '0.85rem', color: '#92400e' }}>
                                            <strong>Objective (O):</strong> Record measurable data. This includes vital signs (BP, Pulse, Temp) and your findings from the physical head-to-toe examination.
                                        </p>
                                    </div>

                                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={18} color="#2563eb" /> Vital Signs & Biometrics</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                            <div><label className="label">Temp (°C)</label><input type="number" className="input-field" value={vitals.temp} onChange={e => setVitals({ ...vitals, temp: e.target.value })} /></div>
                                            <div><label className="label">BP (mmHg)</label><input className="input-field" value={vitals.bp} onChange={e => setVitals({ ...vitals, bp: e.target.value })} /></div>
                                            <div><label className="label">HR (bpm)</label><input type="number" className="input-field" value={vitals.heart_rate} onChange={e => setVitals({ ...vitals, heart_rate: e.target.value })} /></div>
                                            <div><label className="label">SpO2 (%)</label><input type="number" className="input-field" value={vitals.spo2} onChange={e => setVitals({ ...vitals, spo2: e.target.value })} /></div>
                                            <div><label className="label">Resp Rate (/min)</label><input type="number" className="input-field" value={vitals.respiratory_rate} onChange={e => setVitals({ ...vitals, respiratory_rate: e.target.value })} /></div>
                                            <div><label className="label">Weight (kg)</label><input type="number" className="input-field" value={vitals.weight} onChange={e => setVitals({ ...vitals, weight: e.target.value })} /></div>
                                            <div><label className="label">Height (cm)</label><input type="number" className="input-field" value={vitals.height} onChange={e => setVitals({ ...vitals, height: e.target.value })} /></div>
                                        </div>
                                    </div>

                                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '20px' }}>Systemic Physical Examination</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label className="label">General Appearance</label>
                                                <select className="input-field" value={physicalExam.general_appearance} onChange={e => setPhysicalExam({ ...physicalExam, general_appearance: e.target.value })}>
                                                    <option>Well-looking</option><option>Ill-looking</option><option>Pale</option><option>Jaundiced</option><option>Cyanosed</option><option>Dyspnoeic</option><option>Distressed</option>
                                                </select>
                                            </div>
                                            <div><label className="label">Head & Neck</label><input className="input-field" value={physicalExam.head_neck} onChange={e => setPhysicalExam({ ...physicalExam, head_neck: e.target.value })} /></div>
                                            <div><label className="label">HEENT (Eyes/Ears/Nose/Throat)</label><input className="input-field" value={physicalExam.heent} onChange={e => setPhysicalExam({ ...physicalExam, heent: e.target.value })} /></div>
                                            <div><label className="label">Cardiovascular (Heart Sounds)</label><input className="input-field" value={physicalExam.cardiovascular} onChange={e => setPhysicalExam({ ...physicalExam, cardiovascular: e.target.value })} /></div>
                                            <div><label className="label">Respiratory (Breath Sounds)</label><input className="input-field" value={physicalExam.respiratory} onChange={e => setPhysicalExam({ ...physicalExam, respiratory: e.target.value })} /></div>
                                            <div><label className="label">Abdomen (Palpation/Bowel)</label><input className="input-field" value={physicalExam.abdomen} onChange={e => setPhysicalExam({ ...physicalExam, abdomen: e.target.value })} /></div>
                                            <div><label className="label">Neurological (Power/Reflex)</label><input className="input-field" value={physicalExam.neurological} onChange={e => setPhysicalExam({ ...physicalExam, neurological: e.target.value })} /></div>
                                            <div><label className="label">Musculoskeletal</label><input className="input-field" value={physicalExam.musculoskeletal} onChange={e => setPhysicalExam({ ...physicalExam, musculoskeletal: e.target.value })} /></div>
                                            <div><label className="label">Skin & Integumentary</label><input className="input-field" value={physicalExam.skin_integumentary} onChange={e => setPhysicalExam({ ...physicalExam, skin_integumentary: e.target.value })} /></div>
                                            <div><label className="label">Psychiatric (Mood/Affect)</label><input className="input-field" value={physicalExam.psychiatric} onChange={e => setPhysicalExam({ ...physicalExam, psychiatric: e.target.value })} /></div>
                                        </div>
                                    </div>

                                </section>
                                <section id="assessment" style={{ scrollMarginTop: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {/* SOAP Guidance */}
                                    <div style={{ background: '#f5f3ff', padding: '16px', borderRadius: '8px', border: '1px solid #ede9fe', display: 'flex', gap: '12px' }}>
                                        <Info size={20} color="#5b21b6" />
                                        <p style={{ fontSize: '0.85rem', color: '#5b21b6' }}>
                                            <strong>Assessment (A):</strong> Your clinical diagnosis. Use the ICD-10 search to find the standard code. This section summarizes your reasoning for the diagnosis.
                                        </p>
                                    </div>

                                    {/* Diagnosis & Assessment Box */}
                                    <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                                            <Clipboard size={20} color="#2563eb" /> Clinical Assessment
                                        </h3>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                            <div style={{ background: '#eff6ff', padding: '24px', borderRadius: '12px', border: '1px solid #dbeafe', position: 'relative' }}>
                                                <label className="label" style={{ color: '#1e40af' }}>Primary Diagnosis (ICD-10 Coded)</label>

                                                {/* Selected Diagnoses */}
                                                {(assessment.primary_diagnosis_code || assessment.secondary_diagnoses.length > 0) && (
                                                    <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {assessment.primary_diagnosis_code && (
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                    <span style={{ fontSize: '1rem', background: '#1e40af', color: 'white', padding: '4px 8px', borderRadius: '4px', fontWeight: '800' }}>{assessment.primary_diagnosis_code}</span>
                                                                    <div>
                                                                        <p style={{ margin: 0, fontWeight: '600', color: '#1e3a8a' }}>{assessment.diagnosis}</p>
                                                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#2563eb' }}>Primary Diagnosis {assessment.diagnosis_details?.category ? `• ${assessment.diagnosis_details.category}` : ''}</p>
                                                                    </div>
                                                                </div>
                                                                <button onClick={handleRemovePrimaryDiagnosis} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={18} /></button>
                                                            </div>
                                                        )}
                                                        {assessment.secondary_diagnoses.map(diag => (
                                                            <div key={diag.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                    <span style={{ fontSize: '0.9rem', background: '#e2e8f0', color: '#334155', padding: '4px 8px', borderRadius: '4px', fontWeight: '800' }}>{diag.code}</span>
                                                                    <div>
                                                                        <p style={{ margin: 0, fontWeight: '500', color: '#334155' }}>{diag.description}</p>
                                                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Secondary Diagnosis</p>
                                                                    </div>
                                                                </div>
                                                                <button onClick={() => handleRemoveSecondaryDiagnosis(diag.code)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={18} /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div style={{ display: 'flex', gap: '16px' }}>
                                                    <div style={{ flex: 1, position: 'relative' }}>
                                                        <input
                                                            className="input-field"
                                                            style={{ width: '100%', fontSize: '1.1rem', paddingRight: isSearchingIcd ? '40px' : '16px' }}
                                                            placeholder="Search by diagnosis name (e.g. 'Malaria') or ICD-10 code..."
                                                            value={icdSearchTerm}
                                                            onChange={e => setIcdSearchTerm(e.target.value)}
                                                            onFocus={() => { if (icdSearchTerm) setShowIcdDropdown(true); }}
                                                            onBlur={() => setTimeout(() => setShowIcdDropdown(false), 200)}
                                                        />
                                                        {isSearchingIcd && (
                                                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                                                                <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                                                            </div>
                                                        )}
                                                        {showIcdDropdown && icdResults.length > 0 && (
                                                            <div style={{
                                                                position: 'absolute', zIndex: 50, top: '100%', left: 0, right: 0,
                                                                background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                                                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', marginTop: '4px',
                                                                maxHeight: '200px', overflowY: 'auto'
                                                            }}>
                                                                {icdResults.map(res => (
                                                                    <div
                                                                        key={res.code}
                                                                        onClick={() => handleSelectDiagnosis(res)}
                                                                        style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', display: 'flex', gap: '12px', alignItems: 'center' }}
                                                                        onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                                                                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                                    >
                                                                        <span style={{ fontWeight: '800', color: '#2563eb', minWidth: '60px' }}>{res.code}</span>
                                                                        <span style={{ color: '#1e293b' }}>{res.description}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="label">Clinical Impression / Narrative Summary</label>
                                                <textarea className="input-field" rows="6" style={{ fontSize: '1.05rem', lineHeight: '1.6' }} value={assessment.clinical_impression} onChange={e => setAssessment({ ...assessment, clinical_impression: e.target.value })} placeholder="Describe your clinical reasoning here..."></textarea>
                                            </div>

                                            <div>
                                                <label className="label">Differential Diagnoses</label>
                                                <textarea className="input-field" rows="2" style={{ fontSize: '1.05rem' }} value={assessment.differential_diagnoses.join(', ')} onChange={e => setAssessment({ ...assessment, differential_diagnoses: e.target.value.split(',').map(s => s.trim()) })} placeholder="List alternative diagnoses..."></textarea>
                                            </div>
                                        </div>
                                    </div>

                                </section>

                                <section id="investigations" style={{ scrollMarginTop: '20px', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <FlaskConical size={20} color="#0891b2" /> Laboratory Investigations
                                        </h3>
                                    </div>

                                    {/* Render Lab Reports (Inline display) */}
                                    {labReports.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {labReports.map((report, i) => {
                                                let resultsObj = {};
                                                try {
                                                    resultsObj = typeof report.results === 'string' ? JSON.parse(report.results) : (report.results || {});
                                                } catch(e) {}
                                                return (
                                                    <div key={i} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                                        <div style={{ background: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <div style={{ fontWeight: '800', color: '#1e293b' }}>{report.test_name}</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Finalized: {new Date(report.created_at).toLocaleString()}</div>
                                                            </div>
                                                            <div style={{ background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>COMPLETED</div>
                                                        </div>
                                                        <div style={{ padding: '0' }}>
                                                            <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1px solid #e2e8f0' }}>
                                                                <thead>
                                                                    <tr style={{ background: '#f8fafc' }}>
                                                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Parameter</th>
                                                                        <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Result</th>
                                                                        <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Units</th>
                                                                        <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Ref Range</th>
                                                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {Object.entries(resultsObj).map(([key, val], idx) => {
                                                                        const isComplex = typeof val === 'object' && val !== null;
                                                                        const resVal = isComplex ? val.value : val;
                                                                        const resUnit = isComplex ? val.unit : '--';
                                                                        const resRef = isComplex ? val.ref : '--';
                                                                        const resStatus = isComplex ? (val.status || 'Normal') : 'Normal';

                                                                        const getStatusColor = (s) => {
                                                                            const low = s.toLowerCase();
                                                                            if (low.includes('critical') || low.includes('high')) return '#ef4444';
                                                                            if (low.includes('low')) return '#3b82f6';
                                                                            if (low.includes('reactive') && !low.includes('non')) return '#f59e0b';
                                                                            return '#10b981';
                                                                        };

                                                                        return (
                                                                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fcfdfe' }}>
                                                                                <td style={{ padding: '10px 16px', fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
                                                                                    {key === 'undefined' || key.trim() === '' ? 'Unnamed Parameter' : key}
                                                                                </td>
                                                                                <td style={{ padding: '10px 16px', textAlign: 'center', fontSize: '0.9rem', fontWeight: '800', color: '#0f172a' }}>{resVal}</td>
                                                                                <td style={{ padding: '10px 16px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>{resUnit}</td>
                                                                                <td style={{ padding: '10px 16px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>{resRef}</td>
                                                                                <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '900', color: getStatusColor(resStatus) }}>
                                                                                    {resStatus.toUpperCase()}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                            {report.notes && (
                                                                <div style={{ padding: '12px 16px', background: '#fffbeb', borderTop: '1px solid #fde68a', fontSize: '0.8rem', color: '#b45309' }}>
                                                                    <strong>Tech Notes:</strong> {report.notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        labTracker.length === 0 && <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '0.9rem' }}>No past or completed lab results found for this patient.</div>
                                    )}

                                    {/* Lab Order Tracker (Pending) */}
                                    {labTracker.filter(l => l.status !== 'completed').length > 0 && (
                                        <div style={{ marginTop: '0', padding: '20px', background: '#f0fdf4', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                                <Activity size={18} color="#10b981" />
                                                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800', color: '#065f46', textTransform: 'uppercase' }}>Live Laboratory Status</h4>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {labTracker.filter(l => l.status !== 'completed').map((lab, i) => (
                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px 16px', borderRadius: '10px', border: '1px solid #dcfce7' }}>
                                                        <div>
                                                            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.9rem' }}>{lab.test_name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Ordered at {new Date(lab.created_at).toLocaleTimeString()}</div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0891b2', fontSize: '0.75rem', fontWeight: '700' }}>
                                                            <div className="pulse" style={{ width: '8px', height: '8px', background: '#0891b2', borderRadius: '50%' }}></div>
                                                            PROCESSING...
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {labRequests.length > 0 && (
                                        <div style={{ marginTop: '24px', padding: '24px', background: '#f0fdf4', borderRadius: '16px', border: '2px solid #bbf7d0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#065f46', textTransform: 'uppercase' }}>
                                                    📋 {labRequests.length} LAB ORDER(S) READY TO SEND
                                                </div>
                                            </div>
                                            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {labRequests.map((l, i) => (
                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'white', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                                                        <div>
                                                            <div style={{ fontWeight: '700', color: '#1e293b' }}>{l.test_name}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                                {l.urgency} • {l.specimen_type} • {l.clinical_indication?.substring(0,60)}...
                                                            </div>
                                                        </div>
                                                        <button onClick={() => setLabRequests(labRequests.filter((_, idx) => idx !== i))} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }} title="Remove">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (technicians.length > 1 && !selectedTech) {
                                                        showToast("Please select a technician in the Lab Modal before sending.", "error");
                                                        setShowLabModal(true);
                                                        return;
                                                    }
                                                    instantSendLab();
                                                }}
                                                style={{ 
                                                    width: '100%', 
                                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                                                    color: 'white', 
                                                    padding: '16px', 
                                                    borderRadius: '12px', 
                                                    border: 'none', 
                                                    fontWeight: '800', 
                                                    fontSize: '1rem', 
                                                    cursor: 'pointer',
                                                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                            >
                                                🚀 AUTHORIZE & SEND {labRequests.length} ORDER(S) TO LAB NOW
                                            </button>
                                        </div>
                                    )}
                                </section>

                                <section id="plan" style={{ scrollMarginTop: '20px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
                                    {/* Clinical Gate: Test-Before-Treat Logic */}
                                    {labTracker.some(l => l.status === 'pending') && !ignoreLabGate && (
                                        <div style={{
                                            position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.85)',
                                            backdropFilter: 'blur(8px)', zIndex: 100, borderRadius: '24px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px',
                                            textAlign: 'center', border: '2px solid #e2e8f0', minHeight: '400px'
                                        }}>
                                            <div style={{ maxWidth: '400px' }}>
                                                <div style={{ background: '#fef3c7', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid #fbbf24' }}>
                                                    <Clock size={32} color="#92400e" className="animate-pulse" />
                                                </div>
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>Investigations in Progress</h3>
                                                <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
                                                    The laboratory has not yet returned results for the requested tests.
                                                    <strong> Medical best practice</strong> recommends waiting for results before finalizing the treatment plan.
                                                </p>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <button
                                                        onClick={() => document.getElementById('lab-tracker').scrollIntoView({ behavior: 'smooth' })}
                                                        style={{ background: '#0f172a', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: '700', border: 'none', cursor: 'pointer' }}
                                                    >
                                                        Check Live Tracker
                                                    </button>
                                                    <button
                                                        onClick={() => setIgnoreLabGate(true)}
                                                        style={{ background: 'transparent', color: '#64748b', padding: '10px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                                                    >
                                                        Proceed with Empirical Treatment Anyway
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Results Ready Notification */}
                                    {labTracker.some(l => l.status === 'completed') && (
                                        <div style={{
                                            background: '#ecfdf5', padding: '16px 24px', borderRadius: '16px',
                                            border: '1px solid #10b981', marginBottom: '0px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ background: '#10b981', padding: '8px', borderRadius: '10px' }}>
                                                    <FlaskConical color="white" size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '800', color: '#064e3b' }}>RESULTS ARE READY</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#059669' }}>The laboratory has uploaded new results for this encounter.</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => document.getElementById('lab-tracker').scrollIntoView({ behavior: 'smooth' })}
                                                style={{ background: '#064e3b', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
                                            >
                                                VIEW RESULTS
                                            </button>
                                        </div>
                                    )}
                                    {/* Clinical Protocols (Bundles) */}
                                    <div style={{ background: '#f0f9ff', padding: '24px', borderRadius: '16px', border: '1px solid #bae6fd' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                            <Activity size={20} color="#0284c7" />
                                            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#0369a1' }}>Apply Clinical Protocols</h4>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {bundles.map(b => (
                                                <button
                                                    key={b.id}
                                                    onClick={() => applyProtocol(b)}
                                                    style={{
                                                        padding: '10px 16px', background: 'white', border: '1px solid #bae6fd',
                                                        borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', color: '#0369a1',
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#e0f2fe'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                >
                                                    <Plus size={14} /> {b.name}
                                                </button>
                                            ))}
                                            {bundles.length === 0 && <span style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>No protocols defined by Admin.</span>}
                                        </div>
                                    </div>

                                    {/* Clinical Action Buttons */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <button
                                            onClick={() => setShowPrescriptionModal(true)}
                                            style={{
                                                background: 'white', padding: '32px', borderRadius: '16px', border: '2px dashed #2563eb',
                                                color: '#2563eb', fontWeight: '800', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', gap: '12px', transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                        >
                                            <Pill size={32} />
                                            <span>WRITE PRESCRIPTION (RX)</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (labTracker.length > 0 || labReports.length > 0 || labRequests.length > 0) {
                                                    setNewLab({ test_name: '', urgency: 'Urgent', clinical_indication: 'ADDITIONAL/FOLLOW-UP TEST: Required based on preliminary findings.', specimen_type: '', order_notes: '' });
                                                }
                                                setShowLabModal(true);
                                            }}
                                            style={{
                                                background: 'white', padding: '32px', borderRadius: '16px', border: '2px dashed #10b981',
                                                color: '#10b981', fontWeight: '800', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', gap: '12px', transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                        >
                                            <FlaskConical size={32} />
                                            <span>{(labTracker.length > 0 || labReports.length > 0 || labRequests.length > 0) ? 'ORDER ADDITIONAL TEST' : 'ORDER LAB TESTS'}</span>
                                        </button>
                                    </div>

                                    {/* Summary Order List */}
                                    {(prescriptions.length > 0 || labRequests.length > 0) && (
                                        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#64748b', margin: 0, textTransform: 'uppercase' }}>Items Added to Visit</h4>
                                                {prescriptions.length > 0 && (
                                                    <button
                                                        onClick={() => setShowPreviewModal(true)}
                                                        style={{ background: '#f0f9ff', color: '#2563eb', border: '1px solid #bae6fd', padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                    >
                                                        <FileText size={14} /> Preview & Print Rx
                                                    </button>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {prescriptions.map((p, i) => (
                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #2563eb' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '1.05rem' }}>{p.drug_name}</span>
                                                                <span style={{ fontSize: '0.8rem', padding: '2px 8px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontWeight: '700' }}>{p.route}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '6px', fontSize: '0.85rem', color: '#475569' }}>
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={14} /> {p.dosage}</span>
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {p.frequency}</span>
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {p.duration}</span>
                                                                <span style={{ fontWeight: '700', color: '#2563eb' }}>{p.food_relation}</span>
                                                            </div>
                                                            {p.instructions && (
                                                                <div style={{ marginTop: '8px', padding: '8px 12px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                                                                    <strong>Note:</strong> {p.instructions}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button onClick={() => setPrescriptions(prescriptions.filter((_, idx) => idx !== i))} style={{ color: '#ef4444', border: 'none', background: 'white', padding: '8px', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}><Trash2 size={16} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>

                                <section id="disposition" style={{ scrollMarginTop: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ background: '#fff7ed', padding: '16px', borderRadius: '8px', border: '1px solid #ffedd5', display: 'flex', gap: '12px' }}>
                                        <UserCheck size={20} color="#9a3412" />
                                        <p style={{ fontSize: '0.85rem', color: '#9a3412' }}>
                                            <strong>Disposition:</strong> Finalize the visit. Decide if the patient is discharged, referred, or admitted.
                                        </p>
                                    </div>

                                    <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                                        <div style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)', padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ padding: '10px', background: '#0f172a', borderRadius: '12px', color: 'white' }}><Activity size={20} /></div>
                                            <div>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>FINAL VISIT OUTCOME</h3>
                                                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Complete the encounter and update patient status</p>
                                            </div>
                                        </div>
                                        <div style={{ padding: '32px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                                <div>
                                                    <label className="label" style={{ color: '#475569', fontSize: '0.75rem' }}>PATIENT DISPOSITION</label>
                                                    <select className="input-field" style={{ marginTop: '8px', fontWeight: '700', color: '#1e293b', border: '1.5px solid #e2e8f0' }} value={disposition.status} onChange={e => setDisposition({ ...disposition, status: e.target.value })}>
                                                        <option>Discharge</option>
                                                        <option>Follow-up</option>
                                                        <option>Referral</option>
                                                        <option>Admission</option>
                                                    </select>
                                                </div>
                                                {disposition.status === 'Follow-up' && (
                                                    <div className="animate-in fade-in slide-in-from-top-2">
                                                        <label className="label" style={{ color: '#475569', fontSize: '0.75rem' }}>NEXT APPOINTMENT DATE</label>
                                                        <input type="date" className="input-field" style={{ marginTop: '8px' }} value={disposition.follow_up_date} onChange={e => setDisposition({ ...disposition, follow_up_date: e.target.value })} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px' }}>
                                        <button onClick={handleSave} className="btn-primary" style={{ background: '#10b981', color: 'white', padding: '16px 48px', borderRadius: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem' }}>
                                            <Save size={24} /> FINALIZE CLINICAL RECORD
                                        </button>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .label { display: block; font-size: 0.85rem; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.05em; }
                .input-field { width: 100%; padding: 14px 18px; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 1rem; transition: 0.2s; background: white; }
                .input-field:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.15); }
                .btn-primary { cursor: pointer; transition: 0.2s; padding: 14px 36px; border-radius: 12px; }
                .btn-primary:hover { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); }
                .btn-primary:active { transform: translateY(0); }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            `}} />

            {/* MODALS */}
            {showPrescriptionModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '1100px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Pill color="#2563eb" /> Prescription Workspace
                            </h3>
                            <button onClick={() => setShowPrescriptionModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', flex: 1, overflow: 'hidden' }}>
                            {/* LEFT: FORM */}
                            <div style={{ padding: '32px', borderRight: '1px solid #f1f5f9', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ position: 'relative' }}>
                                    <label className="label">Search Medicine</label>
                                    <input
                                        className="input-field"
                                        placeholder="Search Pharmacy Stock..."
                                        value={medSearch || newDrug.drug_name}
                                        onChange={e => {
                                            setMedSearch(e.target.value);
                                            setNewDrug({ ...newDrug, drug_name: e.target.value });
                                        }}
                                        onFocus={() => { if (medResults.length > 0) setShowMedDropdown(true); }}
                                        onBlur={() => setTimeout(() => setShowMedDropdown(false), 200)}
                                        style={{ fontSize: '1.1rem', padding: '16px' }}
                                    />
                                    {showMedDropdown && medResults.length > 0 && (
                                        <div style={{ position: 'absolute', zIndex: 60, top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', marginTop: '4px', maxHeight: '250px', overflowY: 'auto' }}>
                                            {medResults.map(med => {
                                                const expiryDate = new Date(med.expiry_date);
                                                const today = new Date();
                                                const isExpired = expiryDate < today;
                                                const isNearingExpiry = !isExpired && expiryDate < new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
                                                const isDepleted = med.stock_qty <= 0;
                                                const isLowStock = med.stock_qty < 20 && med.stock_qty > 0;

                                                return (
                                                    <div key={med.id} onClick={() => handleSelectMed(med)} style={{
                                                        padding: '16px', cursor: 'pointer', borderBottom: '1px solid #f8fafc',
                                                        display: 'flex', justifyContent: 'space-between',
                                                        opacity: isExpired ? 0.6 : 1,
                                                        background: isExpired ? '#fff5f5' : (isNearingExpiry ? '#fffaf0' : 'white')
                                                    }}>
                                                        <div>
                                                            <div style={{ fontWeight: '700', color: isExpired ? '#dc3545' : (isNearingExpiry ? '#fd7e14' : '#1e293b') }}>
                                                                {med.med_name}
                                                                {isExpired && <span style={{ fontSize: '0.65rem', background: '#dc3545', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>EXPIRED</span>}
                                                                {isNearingExpiry && <span style={{ fontSize: '0.65rem', background: '#fd7e14', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>EXPIRING SOON</span>}
                                                            </div>
                                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{med.generic_name} ({med.med_type || 'Tablet'})</div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{
                                                                fontSize: '0.9rem', fontWeight: '700',
                                                                color: isDepleted ? '#ef4444' : (isLowStock ? '#f59e0b' : '#10b981')
                                                            }}>
                                                                {isDepleted ? 'Out of Stock' : (isLowStock ? `Low Stock (${med.stock_qty})` : `${med.stock_qty} available`)}
                                                            </div>
                                                            <div style={{ fontSize: '0.7rem', color: isExpired ? '#dc3545' : (isNearingExpiry ? '#fd7e14' : '#94a3b8') }}>Exp: {med.expiry_date}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Allergy Alert */}
                                {newDrug.drug_name && patient?.allergies && (patient.allergies || '').toLowerCase().includes((newDrug.drug_name || '').toLowerCase()) && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', color: '#991b1b' }}>
                                        <AlertTriangle size={20} />
                                        <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                                            ALLERGY ALERT: Patient is allergic to {newDrug.drug_name}!
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    <div><label className="label">Dosage</label><input className="input-field" placeholder="e.g. 500mg" value={newDrug.dosage} onChange={e => setNewDrug({ ...newDrug, dosage: e.target.value })} /></div>
                                    <div>
                                        <label className="label">Frequency</label>
                                        <select className="input-field" value={newDrug.frequency} onChange={e => setNewDrug({ ...newDrug, frequency: e.target.value })}>
                                            <option>Once a day (OD) [1x1]</option>
                                            <option>Twice a day (BD) [1x2]</option>
                                            <option>Three times a day (TDS) [1x3]</option>
                                            <option>Four times a day (QID) [1x4]</option>
                                            <option>As needed (PRN)</option>
                                            <option>Immediately (STAT)</option>
                                            <option>At Night</option>
                                            <option value="Custom">Custom Schedule...</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Route</label>
                                        <select className="input-field" value={newDrug.route} onChange={e => setNewDrug({ ...newDrug, route: e.target.value })}>
                                            <option>By Mouth (Oral)</option>
                                            <option>Injection into Vein (IV)</option>
                                            <option>Injection into Muscle (IM)</option>
                                            <option>Under the Skin (SC)</option>
                                            <option>Apply to Skin (Topical)</option>
                                            <option>Breathe in (Inhaler)</option>
                                            <option>Eye Drops (Ophthalmic)</option>
                                        </select>
                                    </div>
                                </div>

                                {newDrug.frequency === 'Custom' && (
                                    <div className="animate-in fade-in slide-in-from-top-1">
                                        <label className="label" style={{ color: '#2563eb' }}>Specify Custom Schedule</label>
                                        <input className="input-field" style={{ borderColor: '#2563eb' }} placeholder="e.g. Every 6 hours for 3 days..." onChange={e => setNewDrug({ ...newDrug, instructions: `Schedule: ${e.target.value}` })} />
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    <div><label className="label">Duration</label><input className="input-field" placeholder="e.g. 5 days" value={newDrug.duration} onChange={e => setNewDrug({ ...newDrug, duration: e.target.value })} /></div>
                                    <div><label className="label">Qty to Dispense</label><input className="input-field" placeholder="e.g. 15 Tablets" value={newDrug.quantity} onChange={e => setNewDrug({ ...newDrug, quantity: e.target.value })} /></div>
                                    <div><label className="label">Refills</label><input type="number" className="input-field" value={newDrug.refills} onChange={e => setNewDrug({ ...newDrug, refills: e.target.value })} /></div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                                    <div>
                                        <label className="label">Food Relation</label>
                                        <select className="input-field" value={newDrug.food_relation} onChange={e => setNewDrug({ ...newDrug, food_relation: e.target.value })}>
                                            <option>Before Food</option><option>After Food</option><option>With Food</option><option>Empty Stomach</option>
                                        </select>
                                    </div>
                                    <div><label className="label">Extra Instructions</label><input className="input-field" placeholder="e.g. Dissolve in water..." value={newDrug.instructions} onChange={e => setNewDrug({ ...newDrug, instructions: e.target.value })} /></div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                    <button
                                        onClick={handleAddDrug}
                                        style={{ flex: 2, background: newDrug.id ? '#10b981' : '#2563eb', color: 'white', padding: '18px', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: 'pointer', fontSize: '1rem', transition: '0.2s' }}
                                    >
                                        {newDrug.id ? 'UPDATE MEDICINE RECORD' : 'CONFIRM & ADD TO LIST'}
                                    </button>
                                    {newDrug.id && (
                                        <button
                                            onClick={() => {
                                                setNewDrug({
                                                    id: null, drug_id: '', drug_name: '', brand_name: '', drug_form: 'Tablet', dosage: '500mg',
                                                    frequency: 'Twice a day (BD) [1x2]', route: 'By Mouth (Oral)', duration: '5 days', quantity: '',
                                                    refills: '0', food_relation: 'After Food', instructions: ''
                                                });
                                                setMedSearch('');
                                            }}
                                            style={{ flex: 1, background: '#f1f5f9', color: '#64748b', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: '700', cursor: 'pointer' }}
                                        >
                                            CANCEL EDIT
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT: LIVE LIST */}
                            <div style={{ background: '#f8fafc', padding: '32px', overflowY: 'auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Added Medications ({prescriptions.length})</h4>
                                    {prescriptions.length > 0 && <button onClick={() => setPrescriptions([])} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>Clear All</button>}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {prescriptions.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '0.9rem', border: '2px dashed #e2e8f0', borderRadius: '16px' }}>
                                            <Pill size={32} style={{ marginBottom: '10px', opacity: 0.3 }} />
                                            <div>No medicines added yet.</div>
                                        </div>
                                    ) : (
                                        prescriptions.map((p, i) => {
                                            const isExpired = p.expiry_date && new Date(p.expiry_date) < new Date();
                                            const isDepleted = p.stock !== undefined && p.stock <= 0;
                                            const isLowStock = p.stock !== undefined && p.stock < 20 && p.stock > 0;

                                            return (
                                                <div key={i} onClick={() => handleEditDrug(p)} style={{
                                                    background: 'white', padding: '16px', borderRadius: '12px',
                                                    border: p.id === newDrug.id ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)', position: 'relative',
                                                    cursor: 'pointer', transition: '0.2s',
                                                    borderLeft: isExpired ? '4px solid #be123c' : (isDepleted ? '4px solid #ef4444' : '1px solid #e2e8f0')
                                                }}>
                                                    <button onClick={(e) => { e.stopPropagation(); setPrescriptions(prescriptions.filter((_, idx) => idx !== i)); }} style={{ position: 'absolute', top: '10px', right: '10px', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                                    <div style={{ fontWeight: '800', color: isExpired ? '#be123c' : '#1e293b', fontSize: '0.95rem', paddingRight: '25px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {p.drug_name}
                                                        {isExpired && <span style={{ fontSize: '0.6rem', background: '#be123c', color: 'white', padding: '2px 4px', borderRadius: '4px' }}>EXPIRED</span>}
                                                        {isDepleted && <span style={{ fontSize: '0.6rem', background: '#ef4444', color: 'white', padding: '2px 4px', borderRadius: '4px' }}>OUT OF STOCK</span>}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>{p.dosage} • {p.frequency}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: '700', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>{p.duration} ({p.food_relation})</span>
                                                        {p.stock !== undefined && !isDepleted && (
                                                            <span style={{ color: isLowStock ? '#f59e0b' : '#10b981', fontSize: '0.75rem' }}>
                                                                {isLowStock ? `Low Stock: ${p.stock}` : `In Stock: ${p.stock}`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}

                                    <style dangerouslySetInnerHTML={{
                                        __html: `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}} />
                                </div>

                                {prescriptions.length > 0 && (
                                    <div style={{ marginTop: '32px', padding: '20px', background: '#e0f2fe', borderRadius: '16px', border: '1px solid #bae6fd' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0369a1', marginBottom: '8px', textTransform: 'uppercase' }}>Quick Action</div>
                                        <button onClick={() => setShowPrescriptionModal(false)} style={{ width: '100%', background: '#0369a1', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Close & Finish Plan</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showLabModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '600px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        {/* Header: Patient & Encounter info */}
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Electronic Lab Order</div>
                                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: '900', color: '#0f172a' }}>{patient?.pname || 'Patient'}</h3>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>Encounter ID: <span style={{ fontWeight: '700', color: '#2563eb' }}>#ENC-{appoid}</span></div>
                            </div>
                            <button onClick={() => setShowLabModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
                                <X size={20} color="#64748b" />
                            </button>
                        </div>

                        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Searchable Select for Test */}
                            <div style={{ position: 'relative' }}>
                                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FlaskConical size={14} color="#10b981" /> Select Investigation
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94a3b8' }} />
                                    <input
                                        type="text"
                                        placeholder="Search for test (e.g. Malaria, CBC...)"
                                        className="input-field"
                                        style={{ paddingLeft: '48px', height: '48px' }}
                                        value={newLab.test_name}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setNewLab({ ...newLab, test_name: val });
                                            // Auto-calc specimen if exact match found
                                            const match = catalog.find(t => (t.test_name || '').toLowerCase() === val.toLowerCase());
                                            if (match) {
                                                setNewLab({ ...newLab, test_name: match.test_name, specimen_type: match.required_sample || '' });
                                            }
                                        }}
                                    />
                                    {catalog.length > 0 && newLab.test_name && (
                                        <div style={{ position: 'absolute', zIndex: 100, top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', marginTop: '4px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
                                            {catalog
                                                .filter(t => (t.test_name || '').toLowerCase().includes((newLab.test_name || '').toLowerCase()) && t.is_enabled)
                                                .slice(0,10)
                                                .map(t => (
                                                    <div
                                                        key={t.id}
                                                        onClick={() => setNewLab({ 
                                                            ...newLab, 
                                                            test_name: t.test_name, 
                                                            specimen_type: t.required_sample || 'Blood',
                                                            clinical_indication: `Test: ${t.test_name} (${t.category})`
                                                        })}
                                                        style={{ 
                                                            padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', 
                                                            fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between',
                                                            background: newLab.test_name === t.test_name ? '#eff6ff' : 'white'
                                                        }}
                                                        title={t.description || ''}
                                                    >
                                                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{t.test_name}</span>
                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                            {t.required_sample} • {t.category}
                                                        </span>
                                                    </div>
                                                ))}
                                            {catalog.filter(t => (t.test_name || '').toLowerCase().includes((newLab.test_name || '').toLowerCase())).length === 0 && (
                                                <div style={{ padding: '12px 16px', color: '#94a3b8', fontStyle: 'italic' }}>
                                                    No matching tests found
                                                </div>
                                            )}
                                        </div>
                                    ) || (catalog.length === 0 && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, padding: '12px 16px', background: '#fee2e2', color: '#991b1b', fontSize: '0.8rem' }}>
                                            Lab catalog loading... (Check console for RLS errors)
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
                                {/* Urgency */}
                                <div>
                                    <label className="label">Urgency Level</label>
                                    <select
                                        className="input-field"
                                        style={{ height: '48px' }}
                                        value={newLab.urgency}
                                        onChange={e => setNewLab({ ...newLab, urgency: e.target.value })}
                                    >
                                        <option>Routine</option>
                                        <option>Urgent (STAT)</option>
                                        <option>Pre-Op</option>
                                    </select>
                                </div>

                                {/* Specimen Details (Auto-calculated) */}
                                <div>
                                    <label className="label">Specimen Requirements</label>
                                    <div style={{
                                        height: '48px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', padding: '0 16px', color: '#0f172a', fontWeight: '700'
                                    }}>
                                        <Droplets size={16} color="#ef4444" style={{ marginRight: '10px' }} />
                                        {newLab.specimen_type || 'Select a test...'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="label">Clinical Notes / ICD-10 Indications</label>
                                <textarea
                                    className="input-field"
                                    rows="3"
                                    placeholder="Brief clinical reason for test..."
                                    value={newLab.clinical_indication}
                                    onChange={e => setNewLab({ ...newLab, clinical_indication: e.target.value })}
                                />
                            </div>

                            {/* Technician Selection */}
                            {technicians.length > 1 && (
                                <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                                    <label className="label" style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <UserCheck size={16} /> Assign to Lab Technician
                                    </label>
                                    <select 
                                        className="input-field" 
                                        style={{ height: '48px', border: '1px solid #0369a1' }}
                                        value={selectedTech || ''}
                                        onChange={e => setSelectedTech(e.target.value)}
                                    >
                                        <option value="">-- Choose Account --</option>
                                        {technicians.map(t => (
                                            <option key={t.labid} value={t.labid}>{t.labname}</option>
                                        ))}
                                    </select>
                                    <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px' }}>Selecting an account ensures the correct lab receives this order.</p>
                                </div>
                            )}
                            {technicians.length === 1 && (
                                <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                                    Target Lab: <span style={{ fontWeight: 700, color: '#10b981' }}>{technicians[0].labname}</span> (Auto-assigned)
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <button
                                    onClick={() => {
                                        if (newLab.test_name) {
                                            setLabRequests([...labRequests, { ...newLab, id: Date.now() }]);
                                            setNewLab({ test_name: '', urgency: 'Routine', clinical_indication: '', specimen_type: '', order_notes: '' });
                                            showToast(`Added ${newLab.test_name} to visit plan.`, "success");
                                        }
                                    }}
                                    style={{
                                        background: '#f1f5f9', color: '#475569', padding: '16px', borderRadius: '16px',
                                        border: '1px solid #e2e8f0', fontWeight: '800', cursor: 'pointer', transition: '0.2s',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                    }}
                                >
                                    <Plus size={20} /> ADD TO PLAN
                                </button>

                                <button
                                    onClick={() => {
                                        if (newLab.test_name) {
                                            instantSendLab(newLab);
                                        }
                                    }}
                                    style={{
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', padding: '16px', borderRadius: '16px',
                                        border: 'none', fontWeight: '800', cursor: 'pointer', transition: '0.2s',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                                    }}
                                >
                                    <Send size={20} /> AUTHORIZE & SEND NOW
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    if (newLab.test_name) {
                                        setLabRequests([...labRequests, { ...newLab, id: Date.now() }]);
                                        setNewLab({ test_name: '', urgency: 'Routine', clinical_indication: '', specimen_type: '', order_notes: '' });
                                    }
                                    setShowLabModal(false);
                                }}
                                style={{
                                    background: '#0f172a', color: 'white', padding: '14px', borderRadius: '16px',
                                    border: 'none', fontWeight: '700', cursor: 'pointer', transition: '0.2s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    marginTop: '8px', opacity: 0.8
                                }}
                            >
                                CLOSE MODAL
                            </button>

                            {labRequests.length > 0 ? (
                                <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #bae6fd', marginTop: '16px' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0369a1', marginBottom: '8px', textTransform: 'uppercase' }}>Queued for Sending ({labRequests.length})</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {labRequests.map((l, i) => (
                                            <span key={i} style={{ background: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', color: '#1e293b', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {l.test_name}
                                                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setLabRequests(labRequests.filter((_, idx) => idx !== i))} />
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                        </div>
                    </div>
                </div>
            )}

            {/* PRESCRIPTION PREVIEW MODAL */}
            {showPreviewModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '850px', height: '90vh', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontWeight: '800' }}>
                                <ShieldCheck size={20} color="#10b981" /> OFFICIAL CLINICAL PRESCRIPTION
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => window.print()} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Print Prescription</button>
                                <button onClick={() => setShowPreviewModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}><X size={16} /></button>
                            </div>
                        </div>

                        <div id="printable-rx" style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                            {/* Hospital Header */}
                            <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #1e293b', paddingBottom: '20px' }}>
                                <h1 style={{ margin: 0, fontSize: '2rem', color: '#1e293b', textTransform: 'uppercase' }}>EDOC SPECIALIST CLINIC</h1>
                                <p style={{ margin: '5px 0', color: '#64748b' }}>123 Clinical Way, Medical District • Tel: +254 700 000 000</p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px', fontSize: '0.85rem', fontWeight: '700' }}>
                                    <span>License: MED-99283-A</span>
                                    <span>Date: {new Date().toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Patient Info Section */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                                <div>
                                    <h5 style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Patient Details</h5>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>{patient?.pname || 'N/A'}</div>
                                    <div style={{ color: '#475569', marginTop: '4px' }}>Age: {patient?.age || 'N/A'} • Gender: {patient?.pgender || 'N/A'}</div>
                                    <div style={{ color: '#475569' }}>PID: {patient?.pid || 'N/A'}</div>
                                </div>
                                <div>
                                    <h5 style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Clinical Context</h5>
                                    <div style={{ fontWeight: '700', color: '#1e293b' }}>Diagnosis: {assessment.diagnosis || 'Clinical Impression'}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>ICD Code: {assessment.primary_diagnosis_code || 'N/A'}</div>
                                    {patient?.allergies && (
                                        <div style={{ color: '#ef4444', fontWeight: '800', marginTop: '5px' }}>⚠️ ALLERGIES: {patient.allergies}</div>
                                    )}
                                </div>
                            </div>

                            {/* Rx Symbol */}
                            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#1e293b', marginBottom: '20px', fontFamily: 'serif' }}>℞</div>

                            {/* Medications Table */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                                        <th style={{ padding: '12px 0', fontSize: '0.9rem' }}>Medication & Dosage</th>
                                        <th style={{ padding: '12px 0', fontSize: '0.9rem' }}>Route & Freq</th>
                                        <th style={{ padding: '12px 0', fontSize: '0.9rem' }}>Duration</th>
                                        <th style={{ padding: '12px 0', fontSize: '0.9rem', textAlign: 'right' }}>Dispense Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prescriptions.map((p, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '16px 0' }}>
                                                <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#1e293b' }}>{p.drug_name}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{p.dosage} • {p.food_relation}</div>
                                                {p.instructions && <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#94a3b8' }}>Inst: {p.instructions}</div>}
                                            </td>
                                            <td style={{ padding: '16px 0', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: '700' }}>{p.route}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{p.frequency}</div>
                                            </td>
                                            <td style={{ padding: '16px 0', verticalAlign: 'top' }}>{p.duration}</td>
                                            <td style={{ padding: '16px 0', textAlign: 'right', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: '800' }}>{p.quantity || 'Course Qty'}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Refills: {p.refills}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Footer / Signature */}
                            <div style={{ marginTop: '60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'end' }}>
                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '40px' }}>Doctor's Signature</div>
                                    <div style={{ fontWeight: '800', color: '#1e293b' }}>Dr. Specialist</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Reg: KMDC-2024-XP</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>This prescription is valid for 7 days from the date of issue.</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '5px' }}>Generated by eDoc Clinical Terminal</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <ClinicalModal
                isOpen={clinicalModal.open}
                onClose={() => setClinicalModal({ ...clinicalModal, open: false })}
                type={clinicalModal.type}
                title={clinicalModal.title}
                message={clinicalModal.message}
                onConfirm={clinicalModal.onConfirm}
                confirmText="Proceed Anyway"
                cancelText="Cancel"
            />
        </div>
    );
};

export default ConsultationModule;
