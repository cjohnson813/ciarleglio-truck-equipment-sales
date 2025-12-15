import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase env not set. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '');

export const INVENTORY_BUCKET = process.env.SUPABASE_BUCKET ?? 'inventory-images';

