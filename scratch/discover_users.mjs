import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yjgtwghapbixmuraresj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZ3R3Z2hhcGJpeG11cmFyZXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzQxMjksImV4cCI6MjA5MzI3NDM2Nn0.ANYJOrqrp2jIcTul0vsRL65VYwF7sIrpqPTkibGijfs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listAllTables() {
  console.log('Testing common table names...');
  const commonTables = ['webusers', 'users', 'staff', 'doctor', 'patient', 'patients', 'admin'];
  
  for (const table of commonTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table [${table}]: Not found or Error: ${error.message}`);
    } else {
      console.log(`Table [${table}]: EXISTS! (First row: ${data.length > 0 ? JSON.stringify(data[0]) : 'Empty'})`);
      if (data.length > 0) {
          const { data: allData } = await supabase.from(table).select('email').limit(10);
          console.log(`Emails in [${table}]:`, allData?.map(u => u.email).filter(Boolean));
      }
    }
  }
}

listAllTables();
