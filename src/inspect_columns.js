import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yjgtwghapbixmuraresj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZ3R3Z2hhcGJpeG11cmFyZXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzQxMjksImV4cCI6MjA5MzQxMDEyOX0.ANYJOrqrp2jIcTul0vsRL65VYwF7sIrpqPTkibGijfs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
    console.log('--- Inspecting column names ---');
    // Selecting a non-existent column often reveals valid columns in the error message
    const { error: e1 } = await supabase.from('consultations').select('debug_columns');
    console.log('Consultations:', e1?.message);

    const { error: e2 } = await supabase.from('lab_requests').select('debug_columns');
    console.log('Lab Requests:', e2?.message);
}

inspect();
