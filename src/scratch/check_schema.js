import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  const { data, error } = await supabase.from('lab_catalog').select('*').limit(1)
  if (error) {
    console.error(error)
  } else {
    console.log(Object.keys(data[0]))
  }
  
  const { data: appt, error: apptErr } = await supabase.from('appointment').select('*').limit(1)
  if (apptErr) {
    console.error(apptErr)
  } else {
    console.log(Object.keys(appt[0]))
  }
}

checkSchema()
