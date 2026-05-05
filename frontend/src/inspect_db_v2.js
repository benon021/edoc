import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yjgtwghapbixmuraresj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZ3R3Z2hhcGJpeG11cmFyZXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzQxMjksImV4cCI6MjA5MzQxMDEyOX0.ANYJOrqrp2jIcTul0vsRL65VYwF7sIrpqPTkibGijfs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
    console.log('--- Inspecting consultations ---');
    const { data, error } = await supabase.from('consultations').select('*').limit(1);
    if (error) {
        console.log('Error:', error.message);
        // Try to get column list
        const { error: e2 } = await supabase.from('consultations').select('non_existent');
        console.log('Column hint:', e2?.message);
    } else {
        console.log('Columns found:', Object.keys(data[0] || {}).join(', '));
    }
}

inspect();
