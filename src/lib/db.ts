import { supabase } from './supabase';

export interface Project {
  id: string;
  name: string;
  created_at?: string;
}

export interface MCQSet {
  id: string;
  project_id: string;
  title: string;
  topic: string;
  level: string;
  count: number;
  share_pin?: string;
  created_at?: string;
}

export interface Question {
  id?: string;
  set_id: string;
  text: string;
  options: string[];
  correct_option_index: number;
  solution: string;
  notes: string;
}

export interface LeaderboardEntry {
  id?: string;
  set_id: string;
  nickname: string;
  score: number;
  total_count: number;
  completed_at?: string;
}

export const DB = {
  getProjects: async (): Promise<Project[]> => {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  },
  
  createProject: async (name: string): Promise<Project | null> => {
    const { data, error } = await supabase.from('projects').insert([{ name }]).select().single();
    if (error) {
      console.error(error);
      return null;
    }
    return data;
  },

  getProject: async (id: string): Promise<Project | null> => {
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
    if (error) {
      console.error(error);
      return null;
    }
    return data;
  },

  getMCQSets: async (projectId?: string): Promise<MCQSet[]> => {
    let query = supabase.from('mcq_sets').select('*').order('created_at', { ascending: false });
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    const { data, error } = await query;
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  },

  getMCQSet: async (id: string): Promise<MCQSet | null> => {
    const { data, error } = await supabase.from('mcq_sets').select('*').eq('id', id).single();
    if (error) {
      console.error(error);
      return null;
    }
    return data;
  },

  getMCQSetByPin: async (pin: string): Promise<MCQSet | null> => {
    const { data, error } = await supabase.from('mcq_sets').select('*').eq('share_pin', pin.toUpperCase()).single();
    if (error) {
      console.error(error);
      return null;
    }
    return data;
  },

  createMCQSet: async (set: Omit<MCQSet, 'id' | 'created_at'>): Promise<MCQSet | null> => {
    const { data, error } = await supabase.from('mcq_sets').insert([set]).select().single();
    if (error) {
      console.error(error);
      return null;
    }
    return data;
  },

  updateMCQSetPin: async (id: string, pin: string): Promise<boolean> => {
    const { error } = await supabase.from('mcq_sets').update({ share_pin: pin }).eq('id', id);
    if (error) {
      console.error(error);
      return false;
    }
    return true;
  },

  getQuestions: async (setId: string): Promise<Question[]> => {
    const { data, error } = await supabase.from('questions').select('*').eq('set_id', setId);
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  },

  createQuestions: async (questions: Question[]): Promise<boolean> => {
    const { error } = await supabase.from('questions').insert(questions);
    if (error) {
      console.error(error);
      return false;
    }
    return true;
  },

  getLeaderboard: async (setId: string): Promise<LeaderboardEntry[]> => {
    const { data, error } = await supabase.from('leaderboard').select('*').eq('set_id', setId).order('score', { ascending: false });
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  },

  submitScore: async (entry: Omit<LeaderboardEntry, 'id' | 'completed_at'>): Promise<boolean> => {
    const { error } = await supabase.from('leaderboard').insert([entry]);
    if (error) {
      console.error(error);
      return false;
    }
    return true;
  }
};
