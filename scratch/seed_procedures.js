
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const procedures = [
    { item_name: 'Wound Debridement', category: 'Procedure', price: 2500, is_active: true },
    { item_name: 'Abscess Incision & Drainage (I&D)', category: 'Procedure', price: 3500, is_active: true },
    { item_name: 'Suturing - Simple', category: 'Procedure', price: 1500, is_active: true },
    { item_name: 'Suturing - Complex', category: 'Procedure', price: 4500, is_active: true },
    { item_name: 'Foreign Body Removal', category: 'Procedure', price: 3000, is_active: true },
    { item_name: 'Excision of Skin Lesion', category: 'Procedure', price: 5000, is_active: true },
    { item_name: 'Catheterization', category: 'Procedure', price: 1200, is_active: true },
    { item_name: 'Circumcision', category: 'Procedure', price: 15000, is_active: true },
    { item_name: 'Ear Syringing', category: 'Procedure', price: 1000, is_active: true },
    { item_name: 'Nebulization', category: 'Procedure', price: 800, is_active: true },
    { item_name: 'Plaster of Paris (POP) Application', category: 'Procedure', price: 6000, is_active: true },
    { item_name: 'Cervical Pap Smear', category: 'Procedure', price: 2000, is_active: true },
    { item_name: 'NG Tube Insertion', category: 'Procedure', price: 1500, is_active: true }
];

async function seed() {
    console.log('Seeding procedures...');
    for (const proc of procedures) {
        const { data, error } = await supabase
            .from('pricing_matrix')
            .upsert(proc, { onConflict: 'item_name' });
        
        if (error) {
            console.error(`Error seeding ${proc.item_name}:`, error.message);
        } else {
            console.log(`Successfully seeded: ${proc.item_name}`);
        }
    }
    console.log('Seeding complete.');
}

seed();
