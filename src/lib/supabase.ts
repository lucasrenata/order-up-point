
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://twhpdmajnzvwaidlbfzp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aHBkbWFqbnp2d2FpZGxiZnpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDkyMDQsImV4cCI6MjA2ODg4NTIwNH0._tegTywcUtuXRWz2fmFLbaIhtIOW7l7eyetvaE7bI0U'

export const supabase = createClient(supabaseUrl, supabaseKey)
