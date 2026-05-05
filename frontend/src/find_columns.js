import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xyjmgivqrwmizappikyh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5am1naXZxcndtaXphcHBpa3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTgzNjYsImV4cCI6MjA5MzI3NDM2Nn0.qPHCGjaZanCR885Q_Rab_DxNIvLMeR9PJtOWal_HGkw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getMedicineColumns() {
  // We can't query information_schema via standard supabase-js anon key easily if RLS is on.
  // But we can try to insert a dummy row and see what the error says about missing columns.
  const { error } = await supabase.from('medicine').insert({ name: 'test' });
  console.log('Error Message:', error?.message);
  
  // Or try to select from a non-existent column to see if it lists valid ones.
  const { error: error2 } = await supabase.from('medicine').select('non_existent_column');
  console.log('Error 2 Message:', error2?.message);
}

getMedicineColumns();
