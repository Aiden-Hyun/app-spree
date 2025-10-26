import { supabase } from '../supabase';
import { 
  GuidedMeditation, 
  MeditationSession, 
  MeditationProgram,
  UserProgramProgress,
  MeditationCategory 
} from '../types';

export class MeditationService {
  // Fetch all guided meditations
  async getMeditations(category?: MeditationCategory) {
    let query = supabase
      .from('guided_meditations')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as GuidedMeditation[];
  }

  // Get a single meditation by ID
  async getMeditationById(id: string) {
    const { data, error } = await supabase
      .from('guided_meditations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as GuidedMeditation;
  }

  // Create a new meditation session
  async createSession(session: Omit<MeditationSession, 'id' | 'completed_at'>) {
    const { data, error } = await supabase
      .from('meditation_sessions')
      .insert(session)
      .select()
      .single();

    if (error) throw error;
    
    // Update user stats
    await this.updateUserStats(session.user_id);
    
    return data as MeditationSession;
  }

  // Update user statistics after a session
  private async updateUserStats(userId: string) {
    // Get all sessions for the user
    const { data: sessions } = await supabase
      .from('meditation_sessions')
      .select('duration_minutes, completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (!sessions) return;

    // Calculate total minutes
    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration_minutes, 0);

    // Calculate streak
    const streak = this.calculateStreak(sessions);

    // Update user record
    await supabase
      .from('users')
      .update({
        total_meditation_minutes: totalMinutes,
        meditation_streak: streak,
      })
      .eq('id', userId);
  }

  // Calculate meditation streak
  private calculateStreak(sessions: Array<{ completed_at: string }>) {
    if (sessions.length === 0) return 0;

    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastSession = new Date(sessions[0].completed_at);
    lastSession.setHours(0, 0, 0, 0);

    // Check if last session was today or yesterday
    const dayDiff = Math.floor((today.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff > 1) return 0;

    // Count consecutive days
    for (let i = 1; i < sessions.length; i++) {
      const currentDate = new Date(sessions[i - 1].completed_at);
      const previousDate = new Date(sessions[i].completed_at);
      
      currentDate.setHours(0, 0, 0, 0);
      previousDate.setHours(0, 0, 0, 0);
      
      const diff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff === 1) {
        streak++;
      } else if (diff > 1) {
        break;
      }
    }

    return streak;
  }

  // Get user's meditation history
  async getUserSessions(userId: string, limit = 30) {
    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as MeditationSession[];
  }

  // Get meditation programs
  async getPrograms() {
    const { data, error } = await supabase
      .from('meditation_programs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as MeditationProgram[];
  }

  // Get user's program progress
  async getUserProgramProgress(userId: string) {
    const { data, error } = await supabase
      .from('user_program_progress')
      .select(`
        *,
        program:program_id (*)
      `)
      .eq('user_id', userId)
      .is('completed_at', null);

    if (error) throw error;
    return data as UserProgramProgress[];
  }

  // Start a program
  async startProgram(userId: string, programId: string) {
    const { data, error } = await supabase
      .from('user_program_progress')
      .insert({
        user_id: userId,
        program_id: programId,
        current_day: 1,
      })
      .select()
      .single();

    if (error) throw error;
    return data as UserProgramProgress;
  }

  // Update program progress
  async updateProgramProgress(progressId: string, currentDay: number, completed = false) {
    const update: any = { current_day: currentDay };
    if (completed) {
      update.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('user_program_progress')
      .update(update)
      .eq('id', progressId)
      .select()
      .single();

    if (error) throw error;
    return data as UserProgramProgress;
  }
}

export const meditationService = new MeditationService();
