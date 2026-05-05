import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xyjmgivqrwmizappikyh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5am1naXZxcndtaXphcHBpa3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTgzNjYsImV4cCI6MjA5MzI3NDM2Nn0.qPHCGjaZanCR885Q_Rab_DxNIvLMeR9PJtOWal_HGkw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('--- Testing Database Tables ---');
  
  const tables = ['patient', 'doctor', 'registrar', 'lab_technician', 'pharmacist', 'profiles'];
  
  for (const table of tables) {
    const { data, error, status } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`[${table}] Error ${status}: ${error.message}`);
    } else {
      console.log(`[${table}] OK (Status ${status})`);
    }
  }
}

testConnection();
