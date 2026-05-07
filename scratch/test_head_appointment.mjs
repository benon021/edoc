const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://yjgtwghapbixmuraresj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZ3R3Z2hhcGJpeG11cmFyZXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzQxMjksImV4cCI6MjA5MzQxMDEyOX0.ANYJOrqrp2jIcTul0vsRL65VYwF7sIrpqPTkibGijfs';

async function testPost() {
    const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    console.log("Testing POST to appointment:");
    // Try to insert a dummy appointment to see the 400 error
    const dummyAppo = {
        pid: 1, // assuming patient 1 exists
        docid: 1, // assuming doctor 1 exists
        appodate: new Date().toISOString().split('T')[0],
        status: 'waiting',
        scheduleid: 1 // this might be missing or invalid
    };
    
    let res = await fetch(`${supabaseUrl}/rest/v1/appointment?select=*`, {
        method: 'POST',
        headers,
        body: JSON.stringify(dummyAppo)
    });
    let text = await res.text();
    console.log(`POST /appointment -> ${res.status} ${res.statusText}\n${text}`);
}

testPost();
