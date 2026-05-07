import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLabTechnician() {
    console.log('Checking lab_technician table...');
    const { data, error } = await supabase
        .from('lab_technician')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else if (data) {
        console.log('Table lab_technician exists. Columns:', Object.keys(data[0] || {}));
    }
}

checkLabTechnician();
