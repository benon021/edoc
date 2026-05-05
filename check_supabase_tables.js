const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yjjgtwghapbixmuraresj.supabase.co';  // From error URL, note: yjjgtwghap... (fix if wrong)
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5am1naXZxcndtaXphcHBpa3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTgzNjYsImV4cCI6MjA5MzI3NDM2Nn0.qPHCGjaZanCR885Q_Rab_DxNIvLMeR9PJtOWal_HGkw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('--- Checking Supabase Tables ---');
  
  const tables = ['patient', 'patients', 'consultations', 'prescriptions', 'vitals_records', 'lab_reports', 'doctor', 'appointment'];
  
  for (const table of tables) {
    try {
      const { data, error, status, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`[${table}] ❌ Error ${status || error.status || 'unknown'}: ${error.message}`);
      } else {
        console.log(`[${table}] ✅ OK (count: ${count || 0})`);
      }
    } catch (e) {
      console.log(`[${table}] 💥 Exception: ${e.message}`);
    }
  }
  
  // Test PatientProfile queries
  console.log('\n--- Testing Patient 1 ---');
  const pid = 1;
  for (const table of ['patient', 'patients']) {
    try {
      const { data, error } = await supabase.from(table).select('*').eq('pid', pid).single();
      console.log(`${table} pid=1:`, data ? `✅ ${JSON.stringify(data, null, 2)}` : '❌ No data', error ? error.message : '');
    } catch (e) {
      console.log(`${table} pid=1 exception:`, e.message);
    }
  }
  
  // Test consultations for pid=1
  try {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', pid)
      .limit(1);
    console.log('consultations pid=1:', data ? `✅ ${data.length} rows` : '❌ No data', error ? error.message : '');
  } catch (e) {
    console.log('consultations exception:', e.message);
  }
}

checkTables().catch(console.error);
