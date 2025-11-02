import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/supabase/types/database.types.js';

const supabase = createClient<Database>(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default supabase;
