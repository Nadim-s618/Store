// Supabase admin client setup will be added here.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// SERVER-SIDE ONLY. Never import this into a client component.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}