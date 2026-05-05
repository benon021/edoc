import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xyjmgivqrwmizappikyh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5am1naXZxcndtaXphcHBpa3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTgzNjYsImV4cCI6MjA5MzI3NDM2Nn0.qPHCGjaZanCR885Q_Rab_DxNIvLMeR9PJtOWal_HGkw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('--- Checking lab_requests ---');
  const { error: e1 } = await supabase.from('lab_requests').select('non_existent');
  console.log('Lab Requests Error:', e1?.message);

  console.log('\n--- Checking prescriptions ---');
  const { error: e2 } = await supabase.from('prescriptions').select('non_existent');
  console.log('Prescriptions Error:', e2?.message);
  
  console.log('\n--- Checking consultations ---');
  const { error: e3 } = await supabase.from('consultations').select('non_existent');
  console.log('Consultations Error:', e3?.message);
}

checkSchema();
