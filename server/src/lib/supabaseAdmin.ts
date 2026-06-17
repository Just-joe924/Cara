import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

/**
 * Service-role Supabase client. Bypasses Row Level Security — use ONLY on the
 * server for trusted, validated writes (order finalization, stock updates).
 * Never expose the service-role key to the browser.
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
