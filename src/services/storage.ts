import { WorkoutData, WorkoutSession } from '@/types/workout';

const STORAGE_KEY = 'workout-tracker-data';
const CURRENT_VERSION = 1;

export const storage = {
  // Load all data from localStorage
  loadData(): WorkoutData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return { sessions: [], version: CURRENT_VERSION };
      }
      const data: WorkoutData = JSON.parse(stored);
      // Handle version migrations here if needed in the future
      return data;
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      return { sessions: [], version: CURRENT_VERSION };
    }
  },

  // Save all data to localStorage
  saveData(data: WorkoutData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  },

  // Add or update a workout session
  upsertSession(session: WorkoutSession): void {
    const data = this.loadData();
    const existingIndex = data.sessions.findIndex(s => s.id === session.id);

    if (existingIndex >= 0) {
      data.sessions[existingIndex] = session;
    } else {
      data.sessions.push(session);
    }

    // Sort sessions by date (newest first)
    data.sessions.sort((a, b) => b.date.localeCompare(a.date));

    this.saveData(data);
  },

  // Delete a workout session
  deleteSession(sessionId: string): void {
    const data = this.loadData();
    data.sessions = data.sessions.filter(s => s.id !== sessionId);
    this.saveData(data);
  },

  // Get a specific session by ID
  getSession(sessionId: string): WorkoutSession | undefined {
    const data = this.loadData();
    return data.sessions.find(s => s.id === sessionId);
  },

  // Get session by date
  getSessionByDate(date: string): WorkoutSession | undefined {
    const data = this.loadData();
    return data.sessions.find(s => s.date === date);
  },

  // Export data as plain text (similar to the user's format)
  exportAsText(): string {
    const data = this.loadData();
    let text = 'Workout Log\n\n';

    data.sessions.forEach(session => {
      text += `Date: ${session.date}\n`;
      if (session.notes) {
        text += `Notes: ${session.notes}\n`;
      }
      text += '\n';

      session.exercises.forEach(exercise => {
        text += `${exercise.name}\n`;
        exercise.sets.forEach(set => {
          if (set.weight) {
            text += `${set.reps} x ${set.weight}kg\n`;
          } else {
            text += `${set.reps}\n`;
          }
        });
        text += '\n';
      });

      text += '---\n\n';
    });

    return text;
  },

  // Import data from plain text with UPSERT logic
  importFromText(text: string): { success: boolean; message: string; sessionsImported: number } {
    try {
      const data = this.loadData();
      let sessionsImported = 0;

      // Simple parser for the user's format
      const lines = text.split('\n').map(l => l.trim());
      let currentDate: string | null = null;
      let currentExercises: any[] = [];
      let currentExercise: any = null;
      let currentNotes: string | null = null;

      const saveCurrentSession = () => {
        if (currentDate && currentExercises.length > 0) {
          const session: WorkoutSession = {
            id: `session-${currentDate}-${Date.now()}`,
            date: currentDate,
            exercises: currentExercises,
            notes: currentNotes || undefined,
          };

          // Check if session for this date already exists
          const existingSession = data.sessions.find(s => s.date === currentDate);
          if (existingSession) {
            // UPSERT: merge exercises
            const exerciseMap = new Map(existingSession.exercises.map(e => [e.name, e]));
            currentExercises.forEach(newEx => {
              exerciseMap.set(newEx.name, newEx);
            });
            existingSession.exercises = Array.from(exerciseMap.values());
            if (currentNotes) existingSession.notes = currentNotes;
          } else {
            data.sessions.push(session);
          }

          sessionsImported++;
        }
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (!line || line === '---') {
          if (currentExercise) {
            currentExercises.push(currentExercise);
            currentExercise = null;
          }
          if (line === '---') {
            saveCurrentSession();
            currentDate = null;
            currentExercises = [];
            currentNotes = null;
          }
          continue;
        }

        if (line.startsWith('Date:')) {
          if (currentExercise) {
            currentExercises.push(currentExercise);
            currentExercise = null;
          }
          saveCurrentSession();
          currentDate = line.replace('Date:', '').trim();
          currentExercises = [];
          currentNotes = null;
        } else if (line.startsWith('Notes:')) {
          currentNotes = line.replace('Notes:', '').trim();
        } else if (line.match(/^\d+(\s*x\s*[\d.]+kg)?$/)) {
          // This is a set line
          const match = line.match(/^(\d+)(?:\s*x\s*([\d.]+)kg)?$/);
          if (match && currentExercise) {
            const reps = parseInt(match[1]);
            const weight = match[2] ? parseFloat(match[2]) : undefined;
            currentExercise.sets.push({ reps, weight });
          }
        } else {
          // This is an exercise name
          if (currentExercise) {
            currentExercises.push(currentExercise);
          }
          currentExercise = { name: line, sets: [] };
        }
      }

      // Save any remaining session
      if (currentExercise) {
        currentExercises.push(currentExercise);
      }
      saveCurrentSession();

      // Sort and save
      data.sessions.sort((a, b) => b.date.localeCompare(a.date));
      this.saveData(data);

      return {
        success: true,
        message: `Successfully imported ${sessionsImported} workout session(s)`,
        sessionsImported,
      };
    } catch (error) {
      console.error('Error importing data:', error);
      return {
        success: false,
        message: 'Error parsing import data. Please check the format.',
        sessionsImported: 0,
      };
    }
  },

  // Clear all data (for testing or reset)
  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
