import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xyjmgivqrwmizappikyh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5am1naXZxcndtaXphcHBpa3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTgzNjYsImV4cCI6MjA5MzI3NDM2Nn0.qPHCGjaZanCR885Q_Rab_DxNIvLMeR9PJtOWal_HGkw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRelationships() {
  console.log('Testing patient:pid...');
  const { data: d1, error: e1 } = await supabase.from('appointment').select('appoid, patient:pid(pname)').limit(1);
  if (e1) console.log('patient:pid FAILED:', e1.message);
  else console.log('patient:pid SUCCESS:', d1);

  console.log('Testing patient:patient...');
  const { data: d2, error: e2 } = await supabase.from('appointment').select('appoid, patient:patient(pname)').limit(1);
  if (e2) console.log('patient:patient FAILED:', e2.message);
  else console.log('patient:patient SUCCESS:', d2);
  
  console.log('Testing schedule:scheduleid...');
  const { data: d3, error: e3 } = await supabase.from('appointment').select('appoid, schedule:scheduleid(scheduledate)').limit(1);
  if (e3) console.log('schedule:scheduleid FAILED:', e3.message);
  else console.log('schedule:scheduleid SUCCESS:', d3);

  console.log('Testing schedule:schedule...');
  const { data: d4, error: e4 } = await supabase.from('appointment').select('appoid, schedule:schedule(scheduledate)').limit(1);
  if (e4) console.log('schedule:schedule FAILED:', e4.message);
  else console.log('schedule:schedule SUCCESS:', d4);
}

testRelationships();
