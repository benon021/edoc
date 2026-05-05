import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xyjmgivqrwmizappikyh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5am1naXZxcndtaXphcHBpa3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTgzNjYsImV4cCI6MjA5MzI3NDM2Nn0.qPHCGjaZanCR885Q_Rab_DxNIvLMeR9PJtOWal_HGkw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAuditLogs() {
  console.log('--- Checking for audit_logs table ---');
  const { data, error, status } = await supabase.from('audit_logs').select('*').limit(1);
  if (error) {
    console.log(`[audit_logs] Error ${status}: ${error.message}`);
  } else {
    console.log(`[audit_logs] OK (Status ${status})`);
  }
}

checkAuditLogs();
