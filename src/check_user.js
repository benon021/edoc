import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xyjmgivqrwmizappikyh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5am1naXZxcndtaXphcHBpa3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTgzNjYsImV4cCI6MjA5MzI3NDM2Nn0.qPHCGjaZanCR885Q_Rab_DxNIvLMeR9PJtOWal_HGkw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUser() {
  const email = 'doctor@edoc.com';
  console.log(`--- Checking for user ${email} in webusers table ---`);
  
  const { data, error } = await supabase
    .from('webusers')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('Error:', error.message);
  } else if (data) {
    console.log('User found in webusers:', data);
  } else {
    console.log('User NOT found in webusers table.');
  }
}

checkUser();
