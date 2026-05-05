import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yjgtwghapbixmuraresj.supabase.co'; // Updated to user's URL from logs
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5am1naXZxcndtaXphcHBpa3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTgzNjYsImV4cCI6MjA5MzI3NDM2Nn0.qPHCGjaZanCR885Q_Rab_DxNIvLMeR9PJtOWal_HGkw';

// Note: I'm using the URL from the user's error logs!
// The URL in check_schema.js was different.

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
    console.log('--- Inspecting consultations ---');
    const { data, error } = await supabase.from('consultations').select('*').limit(1);
    if (error) {
        console.log('Error:', error.message);
        // Try to get column list by selecting a non-existent one
        const { error: e2 } = await supabase.from('consultations').select('list_columns');
        console.log('Column hint:', e2?.message);
    } else {
        console.log('Columns found:', Object.keys(data[0] || {}).join(', '));
    }
}

inspect();
