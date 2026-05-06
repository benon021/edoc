import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yjgtwghapbixmuraresj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZ3R3Z2hhcGJpeG11cmFyZXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzQxMjksImV4cCI6MjA5MzQxMDEyOX0.ANYJOrqrp2jIcTul0vsRL65VYwF7sIrpqPTkibGijfs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listUsers() {
  console.log('Fetching users from webusers table...');
  const { data, error } = await supabase.from('webusers').select('*');
  
  if (error) {
    console.error('Error fetching webusers:', error.message);
    return;
  }

  console.log('Web Users found:');
  data.forEach(user => {
    console.log(`Email: ${user.email}, Role: ${user.usertype}, ID: ${user.id}`);
  });
}

listUsers();
