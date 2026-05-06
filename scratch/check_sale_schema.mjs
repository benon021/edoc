import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://yjgtwghapbixmuraresj.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZ3R3Z2hhcGJpeG11cmFyZXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzQxMjksImV4cCI6MjA5MzQxMDEyOX0.ANYJOrqrp2jIcTul0vsRL65VYwF7sIrpqPTkibGijfs';

async function checkSchema() {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log("Checking pharmacy_sale table...");
    const { data: saleData, error: saleError } = await supabase.from('pharmacy_sale').select('*').limit(1);
    if (saleError) {
        console.error("pharmacy_sale error:", saleError);
    } else {
        console.log("pharmacy_sale columns:", Object.keys(saleData[0] || {}));
    }

    console.log("\nChecking pharmacy_sale_item table...");
    const { data: itemData, error: itemError } = await supabase.from('pharmacy_sale_item').select('*').limit(1);
    if (itemError) {
        console.error("pharmacy_sale_item error:", itemError);
    } else {
        console.log("pharmacy_sale_item columns:", Object.keys(itemData[0] || {}));
    }
}

checkSchema();
