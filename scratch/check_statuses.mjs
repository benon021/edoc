import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStatuses() {
    console.log('Checking consultation statuses...');
    const { data, error } = await supabase
        .from('consultations')
        .select('status')
        .limit(10);

    if (error) {
        console.error('Error:', error);
    } else if (data) {
        console.log('Statuses:', [...new Set(data.map(d => d.status))]);
    }
}

checkStatuses();
