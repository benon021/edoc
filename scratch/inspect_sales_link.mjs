import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yjgtwghapbixmuraresj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZ3R3Z2hhcGJpeG11cmFyZXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzQxMjksImV4cCI6MjA5MzQxMDEyOX0.ANYJOrqrp2jIcTul0vsRL65VYwF7sIrpqPTkibGijfs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSales() {
    const { data: sales, error } = await supabase.from('pharmacy_sale').select('id, pharmacist_id').limit(5);
    if (error) {
        console.error(error);
        return;
    }
    console.log("Sample sales with pharmacist_id:", sales);

    if (sales.length > 0 && sales[0].pharmacist_id) {
        const pid = sales[0].pharmacist_id;
        console.log(`Checking if ID ${pid} is a doctor or pharmacist...`);
        
        const { data: doc } = await supabase.from('doctor').select('docname').eq('docid', pid).maybeSingle();
        const { data: ph } = await supabase.from('pharmacist').select('phname').eq('phid', pid).maybeSingle();
        
        console.log("Doctor match:", doc);
        console.log("Pharmacist match:", ph);
    }
}

inspectSales();
