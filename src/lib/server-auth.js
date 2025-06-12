import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'

export const createServerClient = (context) => {
  return createServerSupabaseClient(context)
}