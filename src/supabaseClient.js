import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kdwchczwmtxrugoewtsw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtkd2NoY3p3bXR4cnVnb2V3dHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNDk0MzgsImV4cCI6MjA3OTgyNTQzOH0.vsyOi-Y15EShIQUvbzSRiHJObZK5hY5chKZZkqeZG5Y';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Auth helpers
export const authSignUp = (email, password, options = {}) => supabase.auth.signUp({ email, password }, options);
export const authSignIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
export const authSignInWithProvider = (provider) => supabase.auth.signInWithOAuth({ provider });
export const authSignOut = () => supabase.auth.signOut();
export const getUser = () => supabase.auth.getUser();
export const onAuthStateChange = (handler) => supabase.auth.onAuthStateChange(handler);
