import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yjgtwghapbixmuraresj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZ3R3Z2hhcGJpeG11cmFyZXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzQxMjksImV4cCI6MjA5MzQxMDEyOX0.ANYJOrqrp2jIcTul0vsRL65VYwF7sIrpqPTkibGijfs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPharmacist() {
    console.log("Checking pharmacist table...");
    const { data, error } = await supabase.from('pharmacist').select('*').limit(1);
    if (error) {
        console.log("Pharmacist table error:", error.message);
    } else {
        console.log("Pharmacist columns:", Object.keys(data[0] || {}));
    }
}

checkPharmacist();
