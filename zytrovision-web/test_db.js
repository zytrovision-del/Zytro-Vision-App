import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  console.log("Testing select...");
  const { data, error } = await supabase.from('pacientes').select('*').limit(1);
  console.log("Select Result:", data, error);
  
  console.log("Testing select with empresa_id...");
  const { data: d2, error: e2 } = await supabase.from('pacientes').select('*').eq('empresa_id', 'empresa_demo').limit(1);
  console.log("Select Result 2:", d2, e2);
}

test();
