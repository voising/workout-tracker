export interface WorkoutSet {
  reps: number;
  weight?: number; // optional weight in kg/lbs
}

export interface Exercise {
  name: string;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  exercises: Exercise[];
  notes?: string;
}

export interface WorkoutData {
  sessions: WorkoutSession[];
  version: number; // for future data migrations
}

export interface ExerciseProgress {
  exerciseName: string;
  dates: string[];
  totalReps: number[];
  totalVolume: number[]; // reps * weight
  maxWeight: number[];
}

export interface WorkoutStreak {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  workoutDays: Set<string>; // Set of ISO date strings
}
