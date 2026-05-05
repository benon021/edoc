const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// REPLACE WITH YOUR CREDENTIALS
const supabaseUrl = 'https://yjjgtwghapbixmuraresj.supabase.co';
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY_HERE';  // Dashboard > Settings > API > service_role

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Full ICD-10 dataset (~70k codes) - download from WHO
async function populateFullICD10() {
  console.log('🚀 Populating FULL ICD-10 dataset...');

  // Option 1: From local CSV/JSON (recommended - download from https://icd.who.int/browse10/2019/en)
  // const data = JSON.parse(fs.readFileSync('icd10_full.json', 'utf8'));
  
  // Option 2: Sample full structure (expand with real data)
  const fullDataset = [
    { full_code: 'A00.0', full_description: 'Cholera due to Vibrio cholerae 01, biovar cholerae', category_code: 'A00', category_title: 'Cholera', chapter: 'Chapter 1' },
    { full_code: 'A00.1', full_description: 'Cholera due to Vibrio cholerae 01, biovar eltor', category_code: 'A00', category_title: 'Cholera', chapter: 'Chapter 1' },
    // ... 70,000+ codes from WHO CSV
    // Download: https://icd.who.int/browse10/2019/en/#/home -> Export
    { full_code: 'Z00.0', full_description: 'Encounter for general adult medical examination', category_code: 'Z00', category_title: 'General exam', chapter: 'Chapter XXI' }
  ];

  // Chunked insert (Supabase limit ~1k/req)
  const chunkSize = 1000;
  for (let i = 0; i < fullDataset.length; i += chunkSize) {
    const chunk = fullDataset.slice(i, i + chunkSize);
    
    const { data, error } = await supabase
      .from('icd10')
      .insert(chunk)
      .select('full_code');

    if (error) {
      console.error(`Chunk ${i/chunkSize + 1} failed:`, error);
    } else {
      console.log(`✅ Chunk ${i/chunkSize + 1}: ${data.length} codes inserted`);
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 1000));
  }

  // Verify
  const { count } = await supabase.from('icd10').select('*', { count: 'exact', head: true });
  console.log(`🎉 TOTAL ICD-10 CODES: ${count}`);
}

// Usage: node populate_full_icd10.js
populateFullICD10().catch(console.error);

// To download full dataset:
// 1. Visit https://icd.who.int/browse10/2019/en
// 2. Export CSV/JSON
// 3. Save as icd10_full.json
// 4. Get service_role key from Supabase Dashboard > Settings > API
// 5. npm install @supabase/supabase-js
// 6. node populate_full_icd10.js

