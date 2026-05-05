import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xyjmgivqrwmizappikyh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5am1naXZxcndtaXphcHBpa3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTgzNjYsImV4cCI6MjA5MzI3NDM2Nn0.qPHCGjaZanCR885Q_Rab_DxNIvLMeR9PJtOWal_HGkw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkMedicineSchema() {
  const { data, error } = await supabase.from('medicine').select('*').limit(1);
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Medicine Schema Columns:', Object.keys(data[0] || {}));
  }
}

checkMedicineSchema();
