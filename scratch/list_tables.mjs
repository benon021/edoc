import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
    console.log('Listing tables (via query workaround)...');
    // Supabase doesn't have a direct listTables in JS client easily without RPC or similar
    // But we can try to query common tables or just check the ones we suspect.
    const tables = ['vitals', 'vitals_records', 'patient_vitals', 'vital_signs'];
    for (const t of tables) {
        const { error } = await supabase.from(t).select('id').limit(1);
        if (!error) console.log(`Table exists: ${t}`);
        else if (error.code !== '42P01') console.log(`Table error ${t}: ${error.message}`);
    }
}

listTables();
