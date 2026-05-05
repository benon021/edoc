import { supabase } from './src/lib/supabase.js';

(async () => {
  const { data, error } = await supabase.from('appointment').select('appoid, status').limit(5);
  console.log('Appointments fetched:', data);
  if (error) console.error('Error:', error);
})();
