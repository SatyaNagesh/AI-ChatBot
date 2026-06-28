import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dnstcdkjgcmrhcukrjgw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuc3RjZGtqZ2NtcmhjdWtyamd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MzA1NzksImV4cCI6MjA5ODIwNjU3OX0.FZ5Y5bGw24w0wIEG9VuhhVPJWXXviOOmvLheLuCiTgw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
