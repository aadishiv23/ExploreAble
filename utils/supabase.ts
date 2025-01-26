import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://rfgxwslemuautusuecrs.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmZ3h3c2xlbXVhdXR1c3VlY3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk0Mzg0MjUsImV4cCI6MjA0NTAxNDQyNX0.hc3cIW6UCBIFf_54bldNEPBkak8IySOmbKMJXe8de1g";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
