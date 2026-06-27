import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://mtcrmsidsymiehzjcblh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10Y3Jtc2lkc3ltaWVoempjYmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NjkwMTQsImV4cCI6MjA5ODE0NTAxNH0.i8NMWH9T1A3hiuD76-05gQU_4Fhp9j5K1GJ4h6AbYOU'
)
