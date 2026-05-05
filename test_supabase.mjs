import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('medicine').select('id, med_name, generic_name, med_type, med_cat, stock_qty, buying_price, selling_price, expiry_date, unit, reorder_level, supplier_id, suppliers:supplier_id(name)').order('med_name');
  console.log('Error:', error);
  console.log('Data count:', data ? data.length : 0);
}
test();