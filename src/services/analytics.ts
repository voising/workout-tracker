import { WorkoutSession, ExerciseProgress, WorkoutStreak } from '@/types/workout';
import { differenceInDays, parseISO } from 'date-fns';

export const analytics = {
  // Calculate workout streak
  calculateStreak(sessions: WorkoutSession[]): WorkoutStreak {
    if (sessions.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalWorkouts: 0,
        workoutDays: new Set(),
      };
    }

    const workoutDays = new Set(sessions.map(s => s.date));
    const sortedDates = Array.from(workoutDays).sort((a, b) => b.localeCompare(a));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if most recent workout was today or yesterday
    const mostRecent = parseISO(sortedDates[0]);
    const daysSinceLastWorkout = differenceInDays(today, mostRecent);

    if (daysSinceLastWorkout <= 1) {
      currentStreak = 1;

      // Count consecutive days
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = parseISO(sortedDates[i - 1]);
        const currDate = parseISO(sortedDates[i]);
        const diff = differenceInDays(prevDate, currDate);

        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = parseISO(sortedDates[i - 1]);
      const currDate = parseISO(sortedDates[i]);
      const diff = differenceInDays(prevDate, currDate);

      if (diff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return {
      currentStreak,
      longestStreak,
      totalWorkouts: sessions.length,
      workoutDays,
    };
  },

  // Get progress data for a specific exercise
  getExerciseProgress(sessions: WorkoutSession[], exerciseName: string): ExerciseProgress {
    const relevantSessions = sessions
      .filter(s => s.exercises.some(e => e.name === exerciseName))
      .sort((a, b) => a.date.localeCompare(b.date));

    const dates: string[] = [];
    const totalReps: number[] = [];
    const totalVolume: number[] = [];
    const maxWeight: number[] = [];

    relevantSessions.forEach(session => {
      const exercise = session.exercises.find(e => e.name === exerciseName);
      if (!exercise) return;

      dates.push(session.date);

      const reps = exercise.sets.reduce((sum, set) => sum + set.reps, 0);
      totalReps.push(reps);

      const volume = exercise.sets.reduce((sum, set) => sum + (set.reps * (set.weight || 0)), 0);
      totalVolume.push(volume);

      const max = Math.max(...exercise.sets.map(set => set.weight || 0));
      maxWeight.push(max);
    });

    return {
      exerciseName,
      dates,
      totalReps,
      totalVolume,
      maxWeight,
    };
  },

  // Get all unique exercise names
  getAllExercises(sessions: WorkoutSession[]): string[] {
    const exerciseSet = new Set<string>();
    sessions.forEach(session => {
      session.exercises.forEach(exercise => {
        exerciseSet.add(exercise.name);
      });
    });
    return Array.from(exerciseSet).sort();
  },

  // Get the previous session for comparison
  getPreviousSession(sessions: WorkoutSession[], currentDate: string): WorkoutSession | null {
    const sorted = sessions
      .filter(s => s.date < currentDate)
      .sort((a, b) => b.date.localeCompare(a.date));

    return sorted[0] || null;
  },

  // Get summary stats for a session
  getSessionStats(session: WorkoutSession) {
    const totalExercises = session.exercises.length;
    const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const totalReps = session.exercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.reps, 0),
      0
    );
    const totalVolume = session.exercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((s, set) => s + (set.reps * (set.weight || 0)), 0),
      0
    );

    return {
      totalExercises,
      totalSets,
      totalReps,
      totalVolume,
    };
  },
};
