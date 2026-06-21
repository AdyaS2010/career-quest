export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          total_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          total_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          total_score?: number
          created_at?: string
          updated_at?: string
        }
      }
      careers: {
        Row: {
          id: string
          slug: string
          name: string
          title: string
          description: string
          color_scheme: Json
          icon: string
          estimated_time: number
          order_index: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          title: string
          description: string
          color_scheme?: Json
          icon: string
          estimated_time?: number
          order_index?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          title?: string
          description?: string
          color_scheme?: Json
          icon?: string
          estimated_time?: number
          order_index?: number
          is_active?: boolean
          created_at?: string
        }
      }
      challenges: {
        Row: {
          id: string
          career_id: string
          title: string
          description: string
          order_index: number
          max_score: number
          challenge_type: string
          config: Json
          created_at: string
        }
        Insert: {
          id?: string
          career_id: string
          title: string
          description: string
          order_index?: number
          max_score?: number
          challenge_type: string
          config?: Json
          created_at?: string
        }
        Update: {
          id?: string
          career_id?: string
          title?: string
          description?: string
          order_index?: number
          max_score?: number
          challenge_type?: string
          config?: Json
          created_at?: string
        }
      }
      user_career_progress: {
        Row: {
          id: string
          user_id: string
          career_id: string
          status: string
          score: number
          completed_at: string | null
          started_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          career_id: string
          status?: string
          score?: number
          completed_at?: string | null
          started_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          career_id?: string
          status?: string
          score?: number
          completed_at?: string | null
          started_at?: string
          updated_at?: string
        }
      }
      user_challenge_progress: {
        Row: {
          id: string
          user_id: string
          challenge_id: string
          status: string
          score: number
          attempts: number
          best_score: number
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          challenge_id: string
          status?: string
          score?: number
          attempts?: number
          best_score?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          challenge_id?: string
          status?: string
          score?: number
          attempts?: number
          best_score?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          requirement: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon: string
          requirement?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          requirement?: Json
          created_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          unlocked_at?: string
        }
      }
    }
  }
}

export type Career = Database['public']['Tables']['careers']['Row'];
export type Challenge = Database['public']['Tables']['challenges']['Row'];
export type UserCareerProgress = Database['public']['Tables']['user_career_progress']['Row'];
export type UserChallengeProgress = Database['public']['Tables']['user_challenge_progress']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}
