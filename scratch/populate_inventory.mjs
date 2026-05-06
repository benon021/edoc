import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yjgtwghapbixmuraresj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZ3R3Z2hhcGJpeG11cmFyZXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzQxMjksImV4cCI6MjA5MzQxMDEyOX0.ANYJOrqrp2jIcTul0vsRL65VYwF7sIrpqPTkibGijfs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function populateLowStock() {
    console.log('Populating low stock items...');
    
    const lowStockMeds = [
        {med_name: 'Amoxil 250mg', generic_name: 'Amoxicillin', stock_qty: 5, selling_price: 20, buying_price: 15, expiry_date: '2026-10-15', batch_no: 'BN099', med_type: 'Capsule', unit: 'Pcs', barcode: '800002', is_taxable: true, prescription_required: true, is_active: true, reorder_level: 50},
        {med_name: 'Flagyl 200mg', generic_name: 'Metronidazole', stock_qty: 2, selling_price: 12, buying_price: 8, expiry_date: '2025-08-20', batch_no: 'BN100', med_type: 'Tablet', unit: 'Pcs', barcode: '800003', is_taxable: true, prescription_required: true, is_active: true, reorder_level: 30},
        {med_name: 'Ventolin Syrup', generic_name: 'Salbutamol', stock_qty: 0, selling_price: 350, buying_price: 280, expiry_date: '2026-03-15', batch_no: 'BN101', med_type: 'Syrup', unit: 'Bottle', barcode: '800011', is_taxable: true, prescription_required: true, is_active: true, reorder_level: 10}
    ];
    
    const { data, error } = await supabase.from('medicine').insert(lowStockMeds);
    
    if (error) {
        console.error('Population error:', error.message);
    } else {
        console.log('Successfully populated low stock items.');
    }
}

populateLowStock();
