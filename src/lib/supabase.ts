import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-ref.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key-temp';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('CRITICAL: Missing Supabase environment variables. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment settings.');
}

const realSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

class MockSupabaseQueryBuilder {
  private tableName: string;
  private realSupabase: any;
  private isMutation: boolean = false;
  private mutationData: any = null;
  private isCurrentUserQuery: boolean = false;
  private eqFilters: { column: string; value: any }[] = [];
  private inFilters: { column: string; values: any[] }[] = [];
  private gtFilters: { column: string; value: any }[] = [];
  private orderColumn: string | null = null;
  private orderOptions: any = null;
  private limitValue: number | null = null;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;
  private selectColumns: string | null = null;
  private selectOptions: any = null;

  constructor(tableName: string, realSupabase: any) {
    this.tableName = tableName;
    this.realSupabase = realSupabase;
  }

  select(columns?: string, options?: any) {
    this.selectColumns = columns || null;
    this.selectOptions = options || null;
    return this;
  }

  insert(data: any) {
    this.isMutation = true;
    this.mutationData = data;
    return this;
  }

  update(data: any) {
    this.isMutation = true;
    this.mutationData = data;
    return this;
  }

  upsert(data: any) {
    this.isMutation = true;
    this.mutationData = data;
    return this;
  }

  eq(column: string, value: any) {
    this.eqFilters.push({ column, value });
    if ((column === 'id' || column === 'user_id') && value === 'guest') {
      this.isCurrentUserQuery = true;
    }
    return this;
  }

  neq(column: string, value: any) {
    return this;
  }

  in(column: string, values: any[]) {
    this.inFilters.push({ column, values });
    return this;
  }

  gt(column: string, value: any) {
    this.gtFilters.push({ column, value });
    return this;
  }

  order(column: string, options?: any) {
    this.orderColumn = column;
    this.orderOptions = options;
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this.execute();
  }

  single() {
    this.isSingle = true;
    return this.execute();
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute() {
    // If it's a query for the leaderboard or not specifically for 'guest', delegate to real Supabase!
    // However, mutations should NEVER go to real Supabase for guest users.
    if (!this.isMutation && !this.isCurrentUserQuery) {
      let query = this.realSupabase.from(this.tableName).select(this.selectColumns || undefined, this.selectOptions || undefined);
      this.eqFilters.forEach(f => { query = query.eq(f.column, f.value); });
      this.gtFilters.forEach(f => { query = query.gt(f.column, f.value); });
      this.inFilters.forEach(f => { query = query.in(f.column, f.values); });
      if (this.orderColumn) { query = query.order(this.orderColumn, this.orderOptions); }
      if (this.limitValue !== null) { query = query.limit(this.limitValue); }
      if (this.isSingle) { query = query.single(); }
      if (this.isMaybeSingle) { query = query.maybeSingle(); }
      return query;
    }

    // Handle guest user specific logic in localStorage
    if (this.tableName === 'profiles') {
      const profileStr = localStorage.getItem('guest_profile');
      let profile = profileStr ? JSON.parse(profileStr) : {
        id: 'guest',
        username: localStorage.getItem('guestUsername') || 'Guest',
        character_name: localStorage.getItem('guestUsername') || 'Guest',
        total_score: 0,
        experience: 0,
        level: 1,
        current_streak: 1,
        last_active: new Date().toISOString(),
        show_on_leaderboard: false,
        created_at: new Date().toISOString()
      };

      if (this.isMutation && this.mutationData) {
        profile = { ...profile, ...this.mutationData };
        localStorage.setItem('guest_profile', JSON.stringify(profile));
      }

      return { data: profile, error: null };
    }

    if (this.tableName === 'user_progress' || this.tableName === 'user_challenge_progress') {
      const progressStr = localStorage.getItem('guest_user_progress') || '[]';
      let progress = JSON.parse(progressStr);

      if (this.isMutation && this.mutationData) {
        const dataArr = Array.isArray(this.mutationData) ? this.mutationData : [this.mutationData];
        dataArr.forEach(item => {
          const index = progress.findIndex((p: any) => p.challenge_id === item.challenge_id);
          if (index !== -1) {
            progress[index] = { ...progress[index], ...item, id: progress[index].id || Math.random().toString() };
          } else {
            progress.push({ id: Math.random().toString(), ...item });
          }
        });
        localStorage.setItem('guest_user_progress', JSON.stringify(progress));
      }

      let filtered = [...progress];
      const challengeIdFilter = this.eqFilters.find(f => f.column === 'challenge_id');
      if (challengeIdFilter) {
        filtered = filtered.filter((p: any) => p.challenge_id === challengeIdFilter.value);
      }
      const inFilter = this.inFilters.find(f => f.column === 'challenge_id');
      if (inFilter) {
        filtered = filtered.filter((p: any) => inFilter.values.includes(p.challenge_id));
      }

      if (this.isSingle || this.isMaybeSingle) {
        return { data: filtered[0] || null, error: null };
      }

      return { data: filtered, error: null };
    }

    if (this.tableName === 'user_career_progress') {
      const careerStr = localStorage.getItem('guest_user_career_progress') || '[]';
      let careerProgress = JSON.parse(careerStr);

      if (this.isMutation && this.mutationData) {
        const dataArr = Array.isArray(this.mutationData) ? this.mutationData : [this.mutationData];
        dataArr.forEach(item => {
          const index = careerProgress.findIndex((p: any) => p.career_id === item.career_id);
          if (index !== -1) {
            careerProgress[index] = { ...careerProgress[index], ...item, id: careerProgress[index].id || Math.random().toString() };
          } else {
            careerProgress.push({ id: Math.random().toString(), ...item });
          }
        });
        localStorage.setItem('guest_user_career_progress', JSON.stringify(careerProgress));
      }

      let filtered = [...careerProgress];
      const careerIdFilter = this.eqFilters.find(f => f.column === 'career_id');
      if (careerIdFilter) {
        filtered = filtered.filter((p: any) => p.career_id === careerIdFilter.value);
      }

      if (this.isSingle || this.isMaybeSingle) {
        return { data: filtered[0] || null, error: null };
      }

      return { data: filtered, error: null };
    }

    return { data: [], error: null };
  }
}

export const supabase = {
  ...realSupabase,
  from(tableName: string) {
    const isGuest = localStorage.getItem('isGuest') === 'true';
    if (isGuest && (
      tableName === 'profiles' || 
      tableName === 'user_progress' || 
      tableName === 'user_challenge_progress' || 
      tableName === 'user_career_progress'
    )) {
      return new MockSupabaseQueryBuilder(tableName, realSupabase);
    }
    return realSupabase.from(tableName as any);
  }
} as any;
