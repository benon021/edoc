
import { supabase } from '../lib/supabase.js';

async function checkKezia() {
    const { data: patients, error: pError } = await supabase
        .from('patient')
        .select('pid, pname')
        .ilike('pname', '%kezia%');
    
    if (pError || !patients?.length) {
        console.log("Patient Kezia not found", pError);
        return;
    }

    const pid = patients[0].pid;
    console.log(`Found patient: ${patients[0].pname} (ID: ${pid})`);

    const { data: appointments, error: aError } = await supabase
        .from('appointment')
        .select('*')
        .eq('pid', pid)
        .order('appoid', { ascending: false });

    if (aError) {
        console.log("Error fetching appointments", aError);
        return;
    }

    console.log("Appointments:", appointments.map(a => ({ id: a.appoid, status: a.status, date: a.appodate })));

    if (appointments.length > 0) {
        const { data: labs, error: lError } = await supabase
            .from('lab_requests')
            .select('*')
            .eq('appointment_id', appointments[0].appoid);
        
        console.log("Lab Requests for latest appointment:", labs?.map(l => ({ id: l.id, test: l.test_name, status: l.status, paid: l.is_paid })));
    }
}

checkKezia();
