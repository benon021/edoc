import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf-8');
const envObj = {};
envFile.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) envObj[key.trim()] = val.trim();
});

const supabase = createClient(envObj.VITE_SUPABASE_URL, envObj.VITE_SUPABASE_ANON_KEY);

async function run() {
    const q1 = await supabase.from('medicine').select('*').limit(1);
    console.log(Object.keys(q1.data[0] || {}));
}
run();