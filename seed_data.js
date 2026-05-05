
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../frontend/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('🚀 Starting Data Injection...');

    // 1. ICD-10
    const icdData = [
        {full_code: 'A09.9', full_description: 'Gastroenteritis and colitis of infectious origin, unspecified', category_code: 'A09', category_title: 'Intestinal infectious diseases'},
        {full_code: 'E11.9', full_description: 'Type 2 diabetes mellitus without complications', category_code: 'E11', category_title: 'Diabetes mellitus'},
        {full_code: 'I10', full_description: 'Essential (primary) hypertension', category_code: 'I10', category_title: 'Hypertensive diseases'},
        {full_code: 'J06.9', full_description: 'Acute upper respiratory infection, unspecified', category_code: 'J06', category_title: 'Acute upper respiratory infections'},
        {full_code: 'J45.909', full_description: 'Unspecified asthma, uncomplicated', category_code: 'J45', category_title: 'Asthma'},
        {full_code: 'K21.9', full_description: 'Gastro-esophageal reflux disease without esophagitis', category_code: 'K21', category_title: 'Diseases of esophagus, stomach and duodenum'},
        {full_code: 'M54.5', full_description: 'Low back pain', category_code: 'M54', category_title: 'Dorsalgia'},
        {full_code: 'N39.0', full_description: 'Urinary tract infection, site not specified', category_code: 'N39', category_title: 'Other disorders of urinary system'},
        {full_code: 'R05', full_description: 'Cough', category_code: 'R05', category_title: 'Symptoms and signs involving circulatory/respiratory'},
        {full_code: 'R50.9', full_description: 'Fever, unspecified', category_code: 'R50', category_title: 'Fever of unknown origin'},
        {full_code: 'B34.9', full_description: 'Viral infection, unspecified', category_code: 'B34', category_title: 'Viral infections'},
        {full_code: 'G43.909', full_description: 'Migraine, unspecified', category_code: 'G43', category_title: 'Migraine'},
        {full_code: 'L20.9', full_description: 'Atopic dermatitis, unspecified', category_code: 'L20', category_title: 'Dermatitis'},
        {full_code: 'M17.9', full_description: 'Osteoarthritis of knee, unspecified', category_code: 'M17', category_title: 'Osteoarthritis'},
        {full_code: 'H10.9', full_description: 'Unspecified conjunctivitis', category_code: 'H10', category_title: 'Conjunctivitis'},
        {full_code: 'K29.70', full_description: 'Gastritis, unspecified', category_code: 'K29', category_title: 'Gastritis'},
        {full_code: 'J01.90', full_description: 'Acute sinusitis, unspecified', category_code: 'J01', category_title: 'Acute sinusitis'},
        {full_code: 'E03.9', full_description: 'Hypothyroidism, unspecified', category_code: 'E03', category_title: 'Other hypothyroidism'},
        {full_code: 'F41.1', full_description: 'Generalized anxiety disorder', category_code: 'F41', category_title: 'Other anxiety disorders'},
        {full_code: 'R51', full_description: 'Headache', category_code: 'R51', category_title: 'Nervous/musculoskeletal symptoms'}
    ];

    console.log('Inserting ICD-10...');
    await supabase.from('icd10').upsert(icdData, { onConflict: 'full_code' });

    // 2. MEDICINES
    const medData = [
        {med_name: 'Panadol 500mg', generic_name: 'Paracetamol', stock_qty: 500, selling_price: 10, expiry_date: '2026-12-31', batch_no: 'BN001', med_type: 'Tablet', unit: 'Pcs', barcode: '700001', is_taxable: true, prescription_required: false, is_active: true},
        {med_name: 'Amoxil 500mg', generic_name: 'Amoxicillin', stock_qty: 200, selling_price: 25, expiry_date: '2025-10-15', batch_no: 'BN002', med_type: 'Capsule', unit: 'Pcs', barcode: '700002', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Flagyl 400mg', generic_name: 'Metronidazole', stock_qty: 300, selling_price: 15, expiry_date: '2025-08-20', batch_no: 'BN003', med_type: 'Tablet', unit: 'Pcs', barcode: '700003', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Augmentin 625mg', generic_name: 'Amoxicillin + Clavulanate', stock_qty: 150, selling_price: 85, expiry_date: '2025-11-30', batch_no: 'BN004', med_type: 'Tablet', unit: 'Pcs', barcode: '700004', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Zinnat 500mg', generic_name: 'Cefuroxime', stock_qty: 100, selling_price: 120, expiry_date: '2025-12-15', batch_no: 'BN005', med_type: 'Tablet', unit: 'Pcs', barcode: '700005', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Brufen 400mg', generic_name: 'Ibuprofen', stock_qty: 400, selling_price: 12, expiry_date: '2026-06-30', batch_no: 'BN006', med_type: 'Tablet', unit: 'Pcs', barcode: '700006', is_taxable: true, prescription_required: false, is_active: true},
        {med_name: 'Voltaren 50mg', generic_name: 'Diclofenac Sodium', stock_qty: 250, selling_price: 18, expiry_date: '2026-05-10', batch_no: 'BN007', med_type: 'Tablet', unit: 'Pcs', barcode: '700007', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Cataflam 50mg', generic_name: 'Diclofenac Potassium', stock_qty: 200, selling_price: 22, expiry_date: '2026-04-25', batch_no: 'BN008', med_type: 'Tablet', unit: 'Pcs', barcode: '700008', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Nexium 40mg', generic_name: 'Esomeprazole', stock_qty: 120, selling_price: 95, expiry_date: '2025-09-12', batch_no: 'BN009', med_type: 'Tablet', unit: 'Pcs', barcode: '700009', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Omeprazole 20mg', generic_name: 'Omeprazole', stock_qty: 500, selling_price: 15, expiry_date: '2026-01-20', batch_no: 'BN010', med_type: 'Capsule', unit: 'Pcs', barcode: '700010', is_taxable: true, prescription_required: false, is_active: true},
        {med_name: 'Ventolin Inhaler', generic_name: 'Salbutamol', stock_qty: 50, selling_price: 850, expiry_date: '2026-03-15', batch_no: 'BN011', med_type: 'Inhaler', unit: 'Unit', barcode: '700011', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Piriton 4mg', generic_name: 'Chlorphenamine', stock_qty: 600, selling_price: 5, expiry_date: '2026-11-10', batch_no: 'BN013', med_type: 'Tablet', unit: 'Pcs', barcode: '700013', is_taxable: true, prescription_required: false, is_active: true},
        {med_name: 'Cetirizine 10mg', generic_name: 'Cetirizine', stock_qty: 400, selling_price: 10, expiry_date: '2026-08-18', batch_no: 'BN014', med_type: 'Tablet', unit: 'Pcs', barcode: '700014', is_taxable: true, prescription_required: false, is_active: true},
        {med_name: 'Metformin 500mg', generic_name: 'Metformin', stock_qty: 1000, selling_price: 8, expiry_date: '2027-02-28', batch_no: 'BN016', med_type: 'Tablet', unit: 'Pcs', barcode: '700016', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Amlodipine 5mg', generic_name: 'Amlodipine', stock_qty: 800, selling_price: 10, expiry_date: '2027-01-15', batch_no: 'BN019', med_type: 'Tablet', unit: 'Pcs', barcode: '700019', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Losartan 50mg', generic_name: 'Losartan Potassium', stock_qty: 500, selling_price: 25, expiry_date: '2026-12-10', batch_no: 'BN020', med_type: 'Tablet', unit: 'Pcs', barcode: '700020', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Atorvastatin 20mg', generic_name: 'Atorvastatin', stock_qty: 400, selling_price: 45, expiry_date: '2026-11-20', batch_no: 'BN021', med_type: 'Tablet', unit: 'Pcs', barcode: '700021', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Rocephin 1g', generic_name: 'Ceftriaxone', stock_qty: 100, selling_price: 650, expiry_date: '2025-06-15', batch_no: 'BN022', med_type: 'Injection', unit: 'Vial', barcode: '700022', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Gaviscon Liquid', generic_name: 'Sodium Alginate', stock_qty: 60, selling_price: 450, expiry_date: '2026-02-14', batch_no: 'BN026', med_type: 'Syrup', unit: 'Bottle', barcode: '700026', is_taxable: true, prescription_required: false, is_active: true},
        {med_name: 'Ascoril Syrup', generic_name: 'Salbutamol + Bromhexine', stock_qty: 100, selling_price: 380, expiry_date: '2026-01-10', batch_no: 'BN027', med_type: 'Syrup', unit: 'Bottle', barcode: '700027', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Prednisolone 5mg', generic_name: 'Prednisolone', stock_qty: 300, selling_price: 15, expiry_date: '2025-11-25', batch_no: 'BN028', med_type: 'Tablet', unit: 'Pcs', barcode: '700028', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Lasix 40mg', generic_name: 'Furosemide', stock_qty: 400, selling_price: 12, expiry_date: '2026-07-20', batch_no: 'BN030', med_type: 'Tablet', unit: 'Pcs', barcode: '700030', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Azithromycin 500mg', generic_name: 'Azithromycin', stock_qty: 150, selling_price: 150, expiry_date: '2026-05-15', batch_no: 'BN031', med_type: 'Tablet', unit: 'Pcs', barcode: '700031', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Ciprofloxacin 500mg', generic_name: 'Ciprofloxacin', stock_qty: 200, selling_price: 45, expiry_date: '2026-03-20', batch_no: 'BN032', med_type: 'Tablet', unit: 'Pcs', barcode: '700032', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Doxycycline 100mg', generic_name: 'Doxycycline', stock_qty: 300, selling_price: 30, expiry_date: '2026-08-10', batch_no: 'BN033', med_type: 'Capsule', unit: 'Pcs', barcode: '700033', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Metoclopramide 10mg', generic_name: 'Metoclopramide', stock_qty: 250, selling_price: 10, expiry_date: '2026-10-15', batch_no: 'BN034', med_type: 'Tablet', unit: 'Pcs', barcode: '700034', is_taxable: true, prescription_required: true, is_active: true},
        {med_name: 'Domperidone 10mg', generic_name: 'Domperidone', stock_qty: 300, selling_price: 12, expiry_date: '2026-11-20', batch_no: 'BN035', med_type: 'Tablet', unit: 'Pcs', barcode: '700035', is_taxable: true, prescription_required: false, is_active: true},
        {med_name: 'Loperamide 2mg', generic_name: 'Loperamide', stock_qty: 400, selling_price: 15, expiry_date: '2026-12-01', batch_no: 'BN036', med_type: 'Capsule', unit: 'Pcs', barcode: '700036', is_taxable: true, prescription_required: false, is_active: true},
        {med_name: 'ORS Sachet', generic_name: 'Oral Rehydration Salts', stock_qty: 1000, selling_price: 50, expiry_date: '2027-06-30', batch_no: 'BN037', med_type: 'Powder', unit: 'Sachet', barcode: '700037', is_taxable: true, prescription_required: false, is_active: true},
        {med_name: 'Zinc 20mg', generic_name: 'Zinc Sulfate', stock_qty: 500, selling_price: 10, expiry_date: '2026-09-15', batch_no: 'BN038', med_type: 'Tablet', unit: 'Pcs', barcode: '700038', is_taxable: true, prescription_required: false, is_active: true}
    ];

    console.log('Inserting Medicines...');
    await supabase.from('medicine').upsert(medData, { onConflict: 'med_name' });

    // 3. LAB CATALOG
    const labData = [
        {test_name: 'Full Blood Count (FBC)', description: 'Hb, WBC, Platelets', price: 1500, category: 'Hematology', required_sample: 'Whole Blood (EDTA)', turnaround_time: '2-4 Hours', ref_ranges: JSON.stringify([{field:'Hb',unit:'g/dL',ref:'12-16'},{field:'WBC',unit:'x10^9/L',ref:'4-10'}]), is_enabled: 1},
        {test_name: 'Lipid Profile', description: 'Cholesterol, LDL, HDL', price: 2500, category: 'Biochemistry', required_sample: 'Serum', turnaround_time: '6-8 Hours', ref_ranges: JSON.stringify([{field:'Total Chol',unit:'mmol/L',ref:'<5.2'}]), is_enabled: 1},
        {test_name: 'Liver Function (LFT)', description: 'Liver enzymes', price: 3200, category: 'Biochemistry', required_sample: 'Serum', turnaround_time: '6-8 Hours', ref_ranges: JSON.stringify([{field:'ALT',unit:'U/L',ref:'<41'}]), is_enabled: 1},
        {test_name: 'Renal Function (RFT)', description: 'Kidney health', price: 2800, category: 'Biochemistry', required_sample: 'Serum', turnaround_time: '6-8 Hours', ref_ranges: JSON.stringify([{field:'Creatinine',unit:'umol/L',ref:'62-106'}]), is_enabled: 1},
        {test_name: 'Fasting Blood Sugar', description: 'Glucose level', price: 500, category: 'Biochemistry', required_sample: 'Fluoride Blood', turnaround_time: '2 Hours', ref_ranges: JSON.stringify([{field:'Glucose',unit:'mmol/L',ref:'3.9-5.6'}]), is_enabled: 1},
        {test_name: 'HbA1c', description: '3-month average sugar', price: 1800, category: 'Biochemistry', required_sample: 'Whole Blood (EDTA)', turnaround_time: '24 Hours', ref_ranges: JSON.stringify([{field:'HbA1c',unit:'%',ref:'4.0-5.6'}]), is_enabled: 1},
        {test_name: 'Urinalysis', description: 'Urine analysis', price: 800, category: 'Clinical Pathology', required_sample: 'Urine', turnaround_time: '2 Hours', ref_ranges: JSON.stringify([{field:'Pus Cells',unit:'/hpf',ref:'0-5'}]), is_enabled: 1},
        {test_name: 'Stool Test', description: 'Parasites detection', price: 800, category: 'Clinical Pathology', required_sample: 'Stool', turnaround_time: '4 Hours', ref_ranges: JSON.stringify([{field:'Consistency',unit:'',ref:'Formed'}]), is_enabled: 1},
        {test_name: 'Malaria Test (MP)', description: 'Blood film', price: 1200, category: 'Microbiology', required_sample: 'Whole Blood', turnaround_time: '2 Hours', ref_ranges: JSON.stringify([{field:'MP',unit:'',ref:'Not Seen'}]), is_enabled: 1},
        {test_name: 'Thyroid (TFT)', description: 'TSH, T3, T4', price: 4500, category: 'Immunology', required_sample: 'Serum', turnaround_time: '24 Hours', ref_ranges: JSON.stringify([{field:'TSH',unit:'mIU/L',ref:'0.4-4.2'}]), is_enabled: 1}
    ];

    console.log('Inserting Lab Catalog...');
    await supabase.from('lab_catalog').upsert(labData, { onConflict: 'test_name' });

    console.log('✅ All data injected successfully!');
}

seed().catch(err => {
    console.error('❌ Error seeding data:', err);
    process.exit(1);
});
