import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env file manually since dotenv might not be in the workspace or configured for node
const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectLabRequests() {
    console.log('Inspecting lab_requests columns...');
    const { data, error } = await supabase
        .from('lab_requests')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
    } else {
        console.log('No data in lab_requests table to inspect columns.');
        // Try to get columns by inserting a dummy record if possible (risky) or using a different method
        // Let's try to select from a single record if we know one exists
        const { data: allData, error: allErr } = await supabase.from('lab_requests').select('*').limit(1);
        if (allData && allData.length > 0) {
             console.log('Columns:', Object.keys(allData[0]));
        } else {
            console.log('Table might be empty.');
        }
    }
}

inspectLabRequests();
