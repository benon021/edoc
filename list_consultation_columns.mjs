import { supabase } from './src/lib/supabase.js';

(async () => {
  const { data, error } = await supabase.from('consultations').select('*', { count: 'exact', head: true });
  if (error) {
    console.error('Error fetching columns:', error);
    return;
  }
  // Supabase doesn't provide schema directly; use rpc to query information_schema
  const { data: cols, error: colErr } = await supabase.rpc('pg_table_columns', {
    schema_name: 'public',
    table_name: 'consultations'
  });
  if (colErr) {
    console.error('RPC error:', colErr);
    return;
  }
  console.log('Consultations columns:', cols);
})();
