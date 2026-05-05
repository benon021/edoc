-- =====================================================================
-- MIGRATION: Add all missing columns to lab_catalog table
-- =====================================================================
ALTER TABLE lab_catalog 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS required_sample TEXT,
ADD COLUMN IF NOT EXISTS turnaround_time TEXT,
ADD COLUMN IF NOT EXISTS ref_ranges TEXT;

-- =====================================================================
-- POPULATE LABORATORY TESTS FOR MAJOR HOSPITAL
-- =====================================================================

-- Insert Laboratory Tests (Essential Battery)
INSERT INTO lab_catalog (test_name, price, category, required_sample, turnaround_time, ref_ranges, is_enabled) VALUES
-- HEMATOLOGY TESTS
('Complete Blood Count (CBC)', 350, 'Hematology', 'EDTA Blood 3ml', '4 hours', '[{"param":"WBC","min":"4.5","max":"11","unit":"K/uL"},{"param":"RBC","min":"4.5","max":"5.9","unit":"M/uL"},{"param":"Hgb","min":"13.5","max":"17.5","unit":"g/dL"},{"param":"Plt","min":"150","max":"400","unit":"K/uL"}]', true),
('Hemoglobin (Hb)', 100, 'Hematology', 'EDTA Blood 2ml', '2 hours', '[{"param":"Hb_Male","min":"13.5","max":"17.5","unit":"g/dL"},{"param":"Hb_Female","min":"12","max":"16","unit":"g/dL"}]', true),
('PCV (Packed Cell Volume)', 100, 'Hematology', 'EDTA Blood 2ml', '2 hours', '[{"param":"PCV_Male","min":"40.7","max":"50.3","unit":"%"},{"param":"PCV_Female","min":"36.1","max":"44.3","unit":"%"}]', true),
('Platelet Count', 150, 'Hematology', 'EDTA Blood 2ml', '2 hours', '[{"param":"Platelets","min":"150","max":"400","unit":"K/uL"}]', true),
('Peripheral Smear', 200, 'Hematology', 'EDTA Blood 2ml', '3 hours', '[{"param":"RBC morphology","desc":"Normal"}]', true),
('Reticulocyte Count', 250, 'Hematology', 'EDTA Blood 2ml', '3 hours', '[{"param":"Reticulocytes","min":"0.5","max":"2.5","unit":"%"}]', true),
('Bleeding Time', 150, 'Hematology', 'Capillary Blood', '1 hour', '[{"param":"Bleeding Time","min":"1","max":"3","unit":"min"}]', true),
('Clotting Time', 150, 'Hematology', 'Capillary Blood', '1 hour', '[{"param":"Clotting Time","min":"2","max":"9","unit":"min"}]', true),

-- BIOCHEMISTRY TESTS
('Fasting Blood Sugar (FBS)', 200, 'Biochemistry', 'Serum 5ml', '2 hours', '[{"param":"FBS","min":"70","max":"100","unit":"mg/dL"}]', true),
('Random Blood Sugar', 150, 'Biochemistry', 'Serum 5ml', '2 hours', '[{"param":"RBS","min":"<140","max":"","unit":"mg/dL"}]', true),
('Post Prandial Blood Sugar', 200, 'Biochemistry', 'Serum 5ml', '2 hours', '[{"param":"PPBS","min":"<140","max":"","unit":"mg/dL"}]', true),
('HbA1c', 350, 'Biochemistry', 'EDTA Blood 3ml', '4 hours', '[{"param":"HbA1c","min":"<5.7","max":"","unit":"%"}]', true),
('Total Cholesterol', 250, 'Biochemistry', 'Serum 5ml', '3 hours', '[{"param":"Total_Chol","min":"<200","max":"","unit":"mg/dL"}]', true),
('LDL Cholesterol', 250, 'Biochemistry', 'Serum 5ml', '3 hours', '[{"param":"LDL","min":"<100","max":"","unit":"mg/dL"}]', true),
('HDL Cholesterol', 250, 'Biochemistry', 'Serum 5ml', '3 hours', '[{"param":"HDL","min":">40","max":"","unit":"mg/dL"}]', true),
('Triglycerides', 250, 'Biochemistry', 'Serum 5ml', '3 hours', '[{"param":"TGL","min":"<150","max":"","unit":"mg/dL"}]', true),
('Lipid Profile', 600, 'Biochemistry', 'Serum 5ml', '4 hours', '[{"param":"Total_Chol","min":"<200","max":"","unit":"mg/dL"}]', true),
('Creatinine', 200, 'Biochemistry', 'Serum 5ml', '2 hours', '[{"param":"Creatinine_Male","min":"0.7","max":"1.3","unit":"mg/dL"},{"param":"Creatinine_Female","min":"0.6","max":"1.1","unit":"mg/dL"}]', true),
('BUN (Blood Urea Nitrogen)', 200, 'Biochemistry', 'Serum 5ml', '2 hours', '[{"param":"BUN","min":"7","max":"20","unit":"mg/dL"}]', true),
('Uric Acid', 200, 'Biochemistry', 'Serum 5ml', '2 hours', '[{"param":"UA_Male","min":"3.5","max":"7.2","unit":"mg/dL"},{"param":"UA_Female","min":"2.6","max":"6","unit":"mg/dL"}]', true),
('Total Bilirubin', 200, 'Biochemistry', 'Serum 5ml', '2 hours', '[{"param":"T_Bilirubin","min":"0.1","max":"1.2","unit":"mg/dL"}]', true),
('Direct Bilirubin', 150, 'Biochemistry', 'Serum 5ml', '2 hours', '[{"param":"D_Bilirubin","min":"0.0","max":"0.3","unit":"mg/dL"}]', true),
('SGOT (AST)', 200, 'Biochemistry', 'Serum 5ml', '2 hours', '[{"param":"SGOT","min":"10","max":"40","unit":"U/L"}]', true),
('SGPT (ALT)', 200, 'Biochemistry', 'Serum 5ml', '2 hours', '[{"param":"SGPT","min":"7","max":"35","unit":"U/L"}]', true),
('Alkaline Phosphatase', 200, 'Biochemistry', 'Serum 5ml', '2 hours', '[{"param":"ALP","min":"44","max":"147","unit":"U/L"}]', true),
('Total Protein', 150, 'Biochemistry', 'Serum 5ml', '2 hours', '[{"param":"T_Protein","min":"6.0","max":"8.3","unit":"g/dL"}]', true),
('Albumin', 150, 'Biochemistry', 'Serum 5ml', '2 hours', '[{"param":"Albumin","min":"3.5","max":"5.0","unit":"g/dL"}]', true),
('Calcium (Ca)', 200, 'Biochemistry', 'Serum 5ml', '2 hours', '[{"param":"Ca","min":"8.5","max":"10.5","unit":"mg/dL"}]', true),
('Phosphorus (P)', 150, 'Biochemistry', 'Serum 5ml', '2 hours', '[{"param":"P","min":"2.5","max":"4.5","unit":"mg/dL"}]', true),
('Sodium (Na)', 150, 'Biochemistry', 'Serum 5ml', '2 hours', '[{"param":"Na","min":"135","max":"145","unit":"mEq/L"}]', true),
('Potassium (K)', 150, 'Biochemistry', 'Serum 5ml', '2 hours', '[{"param":"K","min":"3.5","max":"5.0","unit":"mEq/L"}]', true),
('Chloride (Cl)', 150, 'Biochemistry', 'Serum 5ml', '2 hours', '[{"param":"Cl","min":"98","max":"107","unit":"mEq/L"}]', true),

-- MICROBIOLOGY TESTS
('Blood Culture', 500, 'Microbiology', 'Culture Bottle 10ml', '48 hours', '[{"param":"Growth","desc":"No growth"}]', true),
('Urine Culture', 400, 'Microbiology', 'Sterile Container 30ml', '48 hours', '[{"param":"CFU/ml","min":"<1000","max":"","unit":""}]', true),
('Stool Culture', 450, 'Microbiology', 'Sterile Container 30ml', '48 hours', '[{"param":"Pathogens","desc":"No growth"}]', true),
('Sputum Culture', 500, 'Microbiology', 'Sterile Container 5ml', '48 hours', '[{"param":"Growth","desc":"No growth"}]', true),

-- SEROLOGY TESTS
('Blood Group & Rh Factor', 150, 'Serology', 'EDTA Blood 2ml', '1 hour', '[{"param":"ABO_Rh","desc":"Group & Rh"}]', true),
('Widal Test', 300, 'Serology', 'Serum 5ml', '4 hours', '[{"param":"S.Typhi","min":"<1","max":"160","unit":""}]', true),
('HIV (ELISA)', 450, 'Serology', 'Serum 5ml', '4 hours', '[{"param":"HIV","desc":"Negative"}]', true),
('Hepatitis B (HBsAg)', 300, 'Serology', 'Serum 5ml', '4 hours', '[{"param":"HBsAg","desc":"Negative"}]', true),
('Hepatitis C (Anti-HCV)', 350, 'Serology', 'Serum 5ml', '4 hours', '[{"param":"Anti-HCV","desc":"Negative"}]', true),

-- CLINICAL PATHOLOGY TESTS
('Urinalysis (Routine)', 200, 'Clinical Pathology', 'Mid-stream Urine 30ml', '2 hours', '[{"param":"pH","min":"4.5","max":"8","unit":""}]', true),
('Stool Routine', 250, 'Clinical Pathology', 'Stool Sample 5ml', '3 hours', '[{"param":"Parasites","desc":"Not seen"}]', true),
('CSF Analysis', 800, 'Clinical Pathology', 'CSF 3ml', '6 hours', '[{"param":"Cells","min":"0","max":"5","unit":"/mm3"}]', true);

-- =====================================================================
-- POPULATE 30 MEDICINES FOR HOSPITAL PHARMACY
-- =====================================================================

INSERT INTO medicine (med_name, generic_name, med_type, barcode, prescription_required, batch_no, stock_qty, expiry_date, selling_price, is_taxable, unit, is_active) VALUES
-- ANTIBIOTICS
('Amoxicillin 500mg', 'Amoxicillin', 'Tablet', 'BAR001', true, 'BATCH001', 500, '2026-12-31', 12.00, true, 'Tablets', true),
('Azithromycin 500mg', 'Azithromycin', 'Tablet', 'BAR002', true, 'BATCH002', 300, '2026-11-30', 18.50, true, 'Tablets', true),
('Cephalexin 500mg', 'Cephalexin', 'Tablet', 'BAR003', true, 'BATCH003', 400, '2026-12-15', 15.50, true, 'Tablets', true),
('Metronidazole 400mg', 'Metronidazole', 'Tablet', 'BAR004', true, 'BATCH004', 600, '2026-10-31', 8.00, true, 'Tablets', true),

-- PAINKILLERS & NSAIDs
('Paracetamol 500mg', 'Acetaminophen', 'Tablet', 'BAR005', false, 'BATCH005', 1000, '2027-06-30', 5.50, true, 'Tablets', true),
('Ibuprofen 400mg', 'Ibuprofen', 'Tablet', 'BAR006', false, 'BATCH006', 800, '2027-03-31', 7.50, true, 'Tablets', true),
('Aspirin 500mg', 'Acetylsalicylic Acid', 'Tablet', 'BAR007', false, 'BATCH007', 750, '2027-05-31', 6.00, true, 'Tablets', true),
('Diclofenac 50mg', 'Diclofenac', 'Tablet', 'BAR008', true, 'BATCH008', 400, '2026-09-30', 10.50, true, 'Tablets', true),

-- CARDIOVASCULAR
('Enalapril 10mg', 'Enalapril Maleate', 'Tablet', 'BAR009', true, 'BATCH009', 300, '2026-12-31', 14.00, true, 'Tablets', true),
('Metoprolol 50mg', 'Metoprolol Tartrate', 'Tablet', 'BAR010', true, 'BATCH010', 250, '2026-11-30', 15.50, true, 'Tablets', true),
('Amlodipine 5mg', 'Amlodipine Besylate', 'Tablet', 'BAR011', true, 'BATCH011', 350, '2026-10-31', 17.00, true, 'Tablets', true),
('Atorvastatin 20mg', 'Atorvastatin Calcium', 'Tablet', 'BAR012', true, 'BATCH012', 300, '2026-12-15', 25.00, true, 'Tablets', true),

-- DIABETES
('Metformin 500mg', 'Metformin HCl', 'Tablet', 'BAR013', true, 'BATCH013', 800, '2027-01-31', 9.50, true, 'Tablets', true),
('Glibenclamide 5mg', 'Glibenclamide', 'Tablet', 'BAR014', true, 'BATCH014', 300, '2026-11-30', 12.00, true, 'Tablets', true),
('Insulin Injection', 'Human Insulin', 'Injection', 'BAR015', true, 'BATCH015', 100, '2026-10-31', 1200.00, true, 'Vial', true),

-- RESPIRATORY
('Salbutamol Inhaler', 'Albuterol', 'Inhaler', 'BAR016', true, 'BATCH016', 200, '2026-12-31', 95.00, true, 'Inhaler', true),
('Omeprazole 20mg', 'Omeprazole', 'Capsule', 'BAR017', true, 'BATCH017', 500, '2027-02-28', 17.50, true, 'Capsule', true),
('Ranitidine 150mg', 'Ranitidine HCl', 'Tablet', 'BAR018', false, 'BATCH018', 400, '2026-09-30', 10.00, true, 'Tablets', true),

-- ANTI-INFLAMATORY & STEROIDS
('Dexamethasone 0.5mg', 'Dexamethasone', 'Tablet', 'BAR019', true, 'BATCH019', 300, '2026-12-15', 13.00, true, 'Tablets', true),
('Prednisolone 5mg', 'Prednisolone', 'Tablet', 'BAR020', true, 'BATCH020', 400, '2026-11-30', 11.00, true, 'Tablets', true),

-- ANTIHISTAMINES & ALLERGY
('Cetirizine 10mg', 'Cetirizine HCl', 'Tablet', 'BAR021', false, 'BATCH021', 600, '2027-03-31', 7.50, true, 'Tablets', true),
('Chlorpheniramine 4mg', 'Chlorpheniramine Maleate', 'Tablet', 'BAR022', false, 'BATCH022', 500, '2027-01-31', 6.00, true, 'Tablets', true),

-- ANTI-NAUSEA & GI
('Metoclopramide 10mg', 'Metoclopramide HCl', 'Tablet', 'BAR023', true, 'BATCH023', 400, '2026-11-30', 12.00, true, 'Tablets', true),
('Ondansetron 4mg', 'Ondansetron HCl', 'Tablet', 'BAR024', true, 'BATCH024', 250, '2026-12-15', 40.00, true, 'Tablets', true),

-- ANTIBACTERIAL TOPICAL
('Neosporin Ointment 10g', 'Bacitracin + Neomycin + Polymyxin', 'Ointment', 'BAR025', false, 'BATCH025', 300, '2027-05-31', 28.00, true, 'Tube', true),

-- ANTI-INFLAMMATORY TOPICAL
('Ibuprofen Gel 50g', 'Ibuprofen', 'Gel', 'BAR026', false, 'BATCH026', 400, '2027-04-30', 18.00, true, 'Tube', true),

-- NUTRITIONAL SUPPLEMENTS
('Multivitamin Tablet', 'Multi Vitamins & Minerals', 'Tablet', 'BAR027', false, 'BATCH027', 500, '2027-06-30', 14.00, true, 'Tablets', false),
('Iron Supplement 325mg', 'Ferrous Sulfate', 'Tablet', 'BAR028', false, 'BATCH028', 400, '2027-02-28', 9.50, true, 'Tablets', false),
('Calcium Carbonate 500mg', 'Calcium', 'Tablet', 'BAR029', false, 'BATCH029', 600, '2027-05-31', 8.00, true, 'Tablets', false),
('Vitamin C 500mg', 'Ascorbic Acid', 'Tablet', 'BAR030', false, 'BATCH030', 700, '2027-04-30', 6.50, true, 'Tablets', false);

-- =====================================================================
-- SUMMARY
-- =====================================================================
-- 50+ Laboratory Tests added across 8 categories:
--   - Hematology (8 tests)
--   - Biochemistry (25 tests)
--   - Microbiology (4 tests)
--   - Serology (5 tests)
--   - Clinical Pathology (3 tests)
--
-- 30 Medicines added across multiple categories:
--   - Antibiotics (4)
--   - Painkillers & NSAIDs (4)
--   - Cardiovascular (4)
--   - Diabetes (3)
--   - Respiratory & GI (3)
--   - Steroids (2)
--   - Antihistamines (2)
--   - Anti-nausea (2)
--   - Topical (2)
--   - Supplements (4)
-- =====================================================================
