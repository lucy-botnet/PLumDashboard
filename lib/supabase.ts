import { createClient } from '@supabase/supabase-js'
import type { EscalationRow } from '@/types'

// Use placeholder URL during build if env vars not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      escalations: {
        Row: EscalationRow
        Insert: Partial<EscalationRow>
        Update: Partial<EscalationRow>
      }
    }
  }
}
