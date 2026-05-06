import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

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
