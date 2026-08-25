import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  year: string | null;
  bio: string | null;
  avatar_url: string | null;
  interests: string[];
  preferred_roles: string[];
  work_style: string | null;
  communication_preference: 'asynchronous' | 'frequent discussion' | 'mixed' | null;
  collaboration_preference: 'independent' | 'collaborative' | 'mixed' | null;
  leadership_preference: 'prefer leading' | 'shared leadership' | 'prefer specialist role' | null;
  available_hours_per_week: number | null;
  preferred_project_duration_weeks: number | null;
  created_at: string;
  updated_at: string;
}
