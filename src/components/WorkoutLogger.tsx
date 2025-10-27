import { useState, useCallback, useEffect, useMemo } from 'react';
import { Plus, Trash2, Save, Copy, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutSession, Exercise } from '@/types/workout';
import { storage } from '@/services/storage';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkoutLoggerProps {
  selectedDate: string;
  existingSession?: WorkoutSession | null;
  previousSession?: WorkoutSession | null;
  onSave: () => void;
  kanbanMode?: boolean;
}

export function WorkoutLogger({ selectedDate, existingSession, previousSession, onSave, kanbanMode = false }: WorkoutLoggerProps) {
  const [exercises, setExercises] = useState<Exercise[]>(
    existingSession?.exercises || []
  );
  const [currentExerciseName, setCurrentExerciseName] = useState('');
  const [lastInteractedSet, setLastInteractedSet] = useState<{ exerciseIndex: number; setIndex: number } | null>(null);
  const [pendingShortcutTarget, setPendingShortcutTarget] = useState<{ exerciseIndex: number; setIndex: number } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationSeed, setCelebrationSeed] = useState(0);
  const [isSaveDisabled, setIsSaveDisabled] = useState(false);

  useEffect(() => {
    setLastInteractedSet(null);
  }, [selectedDate, existingSession?.id]);

  useEffect(() => {
    setIsSaveDisabled(false);
  }, [exercises]);

  const completeNextIncompleteSet = useCallback(() => {
    let nextTarget: { exerciseIndex: number; setIndex: number } | null = null;

    setExercises((currentExercises) => {
      if (currentExercises.length === 0) {
        return currentExercises;
      }

      // Find the next incomplete set in order
      for (let exerciseIndex = 0; exerciseIndex < currentExercises.length; exerciseIndex++) {
        const setIndex = currentExercises[exerciseIndex].sets.findIndex((set) => !set.completed);

        if (setIndex !== -1) {
          const updatedExercises = [...currentExercises];
          const targetExercise = {
            ...updatedExercises[exerciseIndex],
            sets: [...updatedExercises[exerciseIndex].sets],
          };

          targetExercise.sets[setIndex] = {
            ...targetExercise.sets[setIndex],
            completed: true,
          };

          updatedExercises[exerciseIndex] = targetExercise;
          nextTarget = { exerciseIndex, setIndex };
          return updatedExercises;
        }
      }

      return currentExercises;
    });

    if (nextTarget) {
      setLastInteractedSet(nextTarget);
      setPendingShortcutTarget(nextTarget);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') {
        return;
      }

      const activeElement = document.activeElement as HTMLElement | null;
      const tagName = activeElement?.tagName.toLowerCase();
      const allowsShortcut = activeElement?.getAttribute('data-complete-shortcut') === 'true';
      const isTypingContext =
        activeElement?.isContentEditable ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        activeElement?.getAttribute('data-skip-complete-shortcut') === 'true' ||
        ((tagName === 'input' || tagName === 'button' || tagName === 'a') && !allowsShortcut);

      if (isTypingContext) {
        return;
      }

      event.preventDefault();
      completeNextIncompleteSet();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [completeNextIncompleteSet]);

  useEffect(() => {
    if (!pendingShortcutTarget) {
      return;
    }

    const focusNext = () => {
      const selector = `input[data-exercise-index="${pendingShortcutTarget.exerciseIndex}"][data-set-index="${pendingShortcutTarget.setIndex}"][data-set-field="reps"]`;
      const candidates = Array.from(document.querySelectorAll<HTMLInputElement>(selector));
      const visible = candidates.find((candidate) => {
        const element = candidate as HTMLElement;
        return element.offsetParent !== null;
      });

      if (visible) {
        visible.focus();
        visible.select?.();
      }

      setPendingShortcutTarget(null);
    };

    const frame = requestAnimationFrame(focusNext);
    const timeout = window.setTimeout(focusNext, 150);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [pendingShortcutTarget]);

  const copyEntireWorkout = () => {
    if (!previousSession) return;

    // Deep copy all exercises with all their sets
    const copiedExercises: Exercise[] = previousSession.exercises.map(exercise => ({
      name: exercise.name,
      sets: exercise.sets.map(set => ({
        reps: set.reps,
        weight: set.weight,
        completed: false
      }))
    }));

    setExercises(copiedExercises);
  };

  const addExercise = () => {
    if (!currentExerciseName.trim()) return;

    setExercises([
      ...exercises,
      {
        name: currentExerciseName.trim(),
        sets: [{ reps: 0 }],
      },
    ]);
    setCurrentExerciseName('');
  };

  const copyExerciseFromPrevious = (exerciseName: string) => {
    const prevExercise = previousSession?.exercises.find(e => e.name === exerciseName);
    if (!prevExercise) return;

    const existingIndex = exercises.findIndex(e => e.name === exerciseName);

    // Deep copy the exercise with all its sets
    const copiedExercise: Exercise = {
      name: prevExercise.name,
      sets: prevExercise.sets.map(set => ({
        reps: set.reps,
        weight: set.weight,
        completed: false
      }))
    };

    if (existingIndex >= 0) {
      // Replace existing
      const updated = [...exercises];
      updated[existingIndex] = copiedExercise;
      setExercises(updated);
    } else {
      // Add new
      setExercises([...exercises, copiedExercise]);
    }
  };

  const incrementReps = (exerciseIndex: number, setIndex: number, increment: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex].reps += increment;
    setExercises(updated);
  };

  const incrementAllReps = (exerciseIndex: number, increment: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets.forEach(set => {
      set.reps += increment;
    });
    setExercises(updated);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const addSet = (exerciseIndex: number) => {
    const updated = [...exercises];
    const currentSets = updated[exerciseIndex].sets;

    // If there's a previous set, copy its values
    if (currentSets.length > 0) {
      const lastSet = currentSets[currentSets.length - 1];
      updated[exerciseIndex].sets.push({
        reps: lastSet.reps,
        weight: lastSet.weight
      });
    } else {
      // No previous set, start with defaults
      updated[exerciseIndex].sets.push({ reps: 0 });
    }

    setExercises(updated);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    setExercises(updated);
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight',
    value: string
  ) => {
    const updated = [...exercises];
    const numValue = parseFloat(value) || 0;

    if (field === 'reps') {
      updated[exerciseIndex].sets[setIndex].reps = Math.max(0, Math.floor(numValue));
    } else {
      updated[exerciseIndex].sets[setIndex].weight = numValue > 0 ? numValue : undefined;
    }

    setExercises(updated);
  };

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex].completed = !updated[exerciseIndex].sets[setIndex].completed;
    setExercises(updated);
    setLastInteractedSet({ exerciseIndex, setIndex });
  };

  const markSetCompleteOnInteraction = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    setLastInteractedSet({ exerciseIndex, setIndex });
    if (!updated[exerciseIndex].sets[setIndex].completed) {
      updated[exerciseIndex].sets[setIndex].completed = true;
      setExercises(updated);
    }
  };

  const saveWorkout = () => {
    if (isSaveDisabled) {
      return;
    }

    setIsSaveDisabled(true);

    const session: WorkoutSession = {
      id: existingSession?.id || `session-${selectedDate}-${Date.now()}`,
      date: selectedDate,
      exercises: exercises.filter(e => e.sets.length > 0),
    };

    const isNewSession = !existingSession;

    storage.upsertSession(session);
    if (isNewSession) {
      setCelebrationSeed((seed) => seed + 1);
      setShowCelebration(true);
    }
    onSave();
  };

  useEffect(() => {
    if (!showCelebration) {
      return;
    }
    const timeout = window.setTimeout(() => setShowCelebration(false), 1400);
    return () => window.clearTimeout(timeout);
  }, [showCelebration]);

  const celebrationBursts = useMemo(() => {
    const basePositions = [
      { left: '18%', top: '32%' },
      { left: '82%', top: '30%' },
      { left: '50%', top: '65%' }
    ];

    const colorPalette = ['#BF092F', '#FB7185', '#FBBF24', '#34D399', '#60A5FA'];

    return basePositions.map((position, index) => {
      const particleCount = 10;
      const distance = 120 + index * 20 + (celebrationSeed % 3) * 10;

      const particles = Array.from({ length: particleCount }).map((_, particleIndex) => {
        const angle = ((360 / particleCount) * particleIndex + celebrationSeed * 17) % 360;
        const radians = (Math.PI / 180) * angle;
        return {
          angle,
          x: Math.cos(radians) * distance,
          y: Math.sin(radians) * distance,
          color: colorPalette[(particleIndex + index + celebrationSeed) % colorPalette.length],
        };
      });

      return {
        id: `${celebrationSeed}-${index}`,
        left: position.left,
        top: position.top,
        delay: index * 0.12,
        particles,
      };
    });
  }, [celebrationSeed]);

  return (
    <div className={kanbanMode ? "-mx-4 lg:-mx-8" : "space-y-6"}>
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            key={celebrationSeed}
            className="pointer-events-none fixed inset-0 z-[70] overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {celebrationBursts.map((burst) => (
              <motion.div
                key={burst.id}
                className="absolute"
                style={{ left: burst.left, top: burst.top }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: burst.delay }}
              >
                {burst.particles.map((particle, particleIndex) => (
                  <motion.span
                    key={`${burst.id}-${particleIndex}`}
                    className="absolute h-2 w-2 rounded-full shadow-lg"
                    style={{ backgroundColor: particle.color }}
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.1, 0.6],
                      x: particle.x,
                      y: particle.y,
                    }}
                    transition={{
                      duration: 0.9,
                      ease: 'easeOut',
                      delay: burst.delay + particleIndex * 0.04,
                    }}
                  />
                ))}
              </motion.div>
            ))}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.35, 0] }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                background: 'radial-gradient(circle at center, rgba(255,255,255,0.35), transparent 60%)'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl gradient-text">Log Workout - {selectedDate}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* One-Tap Copy Entire Workout */}
          {previousSession && previousSession.exercises.length > 0 && exercises.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={copyEntireWorkout}
                className="w-full h-12 sm:h-14 text-sm sm:text-lg font-bold gradient-primary shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <Repeat className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                Copy Entire Workout from {previousSession.date}
              </Button>
            </motion.div>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Exercise name (e.g., Pushups)"
                value={currentExerciseName}
                onChange={(e) => setCurrentExerciseName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addExercise()}
                data-skip-complete-shortcut="true"
                className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-primary transition-all duration-300"
              />
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={addExercise} size="icon" className="h-12 w-12 rounded-xl gradient-primary shadow-lg">
                <Plus className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>

          {/* Quick copy from previous session */}
          {previousSession && previousSession.exercises.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-4 bg-gradient-to-br from-primary/5 to-primary/10 shadow-md"
            >
              <Label className="text-sm font-bold mb-3 block flex items-center gap-2 text-primary">
                <Copy className="h-4 w-4" />
                Quick Copy from Previous Session
              </Label>
              <div className="flex flex-wrap gap-2">
                {previousSession.exercises.map((prevExercise) => (
                  <motion.div
                    key={prevExercise.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyExerciseFromPrevious(prevExercise.name)}
                      className="text-xs font-semibold border-2 hover:border-primary hover:bg-primary/10 transition-all duration-300"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {prevExercise.name}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {kanbanMode ? (
            /* Kanban Layout - Full screen width horizontal scroll */
            <div className="overflow-x-auto -mx-6 px-6">
              <div className="flex gap-4 pb-4 min-w-max">
                <AnimatePresence mode="popLayout">
                  {exercises.map((exercise, exerciseIndex) => (
                    <motion.div
                      key={exerciseIndex}
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -100, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="flex-shrink-0 w-auto rounded-2xl p-5 space-y-4 bg-gradient-to-br from-accent/30 to-accent/50 shadow-lg hover:shadow-xl transition-shadow duration-300"
                    >
                      {/* Kanban card content - same structure as normal but in fixed width cards */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-bold text-xl text-foreground">{exercise.name}</h3>
                          <div className="flex gap-2">
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => incrementAllReps(exerciseIndex, 2)}
                                className="h-7 px-3 text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-300"
                                title="Add 2 reps to all sets"
                              >
                                +2 all
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => incrementAllReps(exerciseIndex, 5)}
                                className="h-7 px-3 text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-300"
                                title="Add 5 reps to all sets"
                              >
                                +5 all
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                        <motion.div whileHover={{ scale: 1.1, rotate: 10 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExercise(exerciseIndex)}
                            className="hover:bg-destructive/10 rounded-xl transition-all duration-300"
                          >
                            <Trash2 className="h-5 w-5 text-destructive" />
                          </Button>
                        </motion.div>
                      </div>

                      <div className="space-y-2 sm:space-y-3">
                        {exercise.sets.map((set, setIndex) => {
                          // Get previous session's data for this exercise and set
                          const prevExercise = previousSession?.exercises.find(e => e.name === exercise.name);
                          const prevSet = prevExercise?.sets[setIndex];

                          return (
                          <motion.div
                            key={setIndex}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{
                              opacity: set.completed ? 1 : 0.3,
                              scale: set.completed ? [1, 1.05, 1] : 1
                            }}
                            transition={{
                              opacity: { duration: 0.3 },
                              scale: {
                                duration: 0.25,
                                times: [0, 0.5, 1]
                              }
                            }}
                            className="bg-card/50 p-3 sm:p-3 rounded-xl shadow-md space-y-2 sm:space-y-0"
                          >
                            {/* Mobile Layout - Stacked */}
                            <div className="flex sm:hidden flex-col gap-3">
                              {/* Set number and Use Prev button row */}
                              <div className="flex items-center justify-between">
                                <motion.div
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => toggleSetComplete(exerciseIndex, setIndex)}
                                  className="cursor-pointer"
                                >
                                  <Label className="text-primary font-bold text-base cursor-pointer">
                                    Set {setIndex + 1}
                                  </Label>
                                </motion.div>
                                <div className="flex items-center gap-2">
                                  {prevSet && (!set.reps || !set.weight) && (
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          if (prevSet.reps) updateSet(exerciseIndex, setIndex, 'reps', String(prevSet.reps));
                                          if (prevSet.weight) updateSet(exerciseIndex, setIndex, 'weight', String(prevSet.weight));
                                        }}
                                        className="h-8 px-3 text-xs font-bold hover:bg-primary/10 rounded-lg text-primary"
                                        title="Use previous values"
                                      >
                                        Use Prev
                                      </Button>
                                    </motion.div>
                                  )}
                                  {exercise.sets.length > 1 && (
                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeSet(exerciseIndex, setIndex)}
                                        className="h-8 w-8 hover:bg-destructive/10 rounded-lg"
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </motion.div>
                                  )}
                                </div>
                              </div>

                              {/* Reps input with increment buttons */}
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-semibold text-muted-foreground w-16">Reps</Label>
                                <Input
                                  type="number"
                                  placeholder={prevSet?.reps ? `${prevSet.reps}` : "0"}
                                  value={set.reps || ''}
                                  data-complete-shortcut="true"
                                  data-exercise-index={exerciseIndex}
                                  data-set-index={setIndex}
                                  data-set-field="reps"
                                  onFocus={() => markSetCompleteOnInteraction(exerciseIndex, setIndex)}
                                  onChange={(e) =>
                                    updateSet(exerciseIndex, setIndex, 'reps', e.target.value)
                                  }
                                  className="flex-1 h-12 border-2 font-bold text-center text-lg placeholder:text-muted-foreground/50"
                                />
                                <div className="flex gap-1.5">
                                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                      onClick={() => {
                                        markSetCompleteOnInteraction(exerciseIndex, setIndex);
                                        incrementReps(exerciseIndex, setIndex, 2);
                                      }}
                                      className="h-10 w-10 p-0 text-sm font-bold gradient-primary shadow-md"
                                      title="Add 2 reps"
                                    >
                                      +2
                                    </Button>
                                  </motion.div>
                                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                      onClick={() => {
                                        markSetCompleteOnInteraction(exerciseIndex, setIndex);
                                        incrementReps(exerciseIndex, setIndex, 5);
                                      }}
                                      className="h-10 w-10 p-0 text-sm font-bold gradient-primary shadow-md"
                                      title="Add 5 reps"
                                    >
                                      +5
                                    </Button>
                                  </motion.div>
                                </div>
                              </div>

                              {/* Weight input with increment buttons */}
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-semibold text-muted-foreground w-16">Weight</Label>
                                <Input
                                  type="number"
                                  step="0.5"
                                  placeholder={prevSet?.weight ? `${prevSet.weight}` : "0"}
                                  value={set.weight || ''}
                                  data-complete-shortcut="true"
                                  data-exercise-index={exerciseIndex}
                                  data-set-index={setIndex}
                                  data-set-field="weight"
                                  onFocus={() => markSetCompleteOnInteraction(exerciseIndex, setIndex)}
                                  onChange={(e) =>
                                    updateSet(exerciseIndex, setIndex, 'weight', e.target.value)
                                  }
                                  className="flex-1 h-12 border-2 font-bold text-center text-lg placeholder:text-muted-foreground/50"
                                />
                                <div className="flex gap-1.5">
                                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                      onClick={() => {
                                        markSetCompleteOnInteraction(exerciseIndex, setIndex);
                                        const currentWeight = set.weight || 0;
                                        updateSet(exerciseIndex, setIndex, 'weight', String(currentWeight + 2));
                                      }}
                                      className="h-10 w-10 p-0 text-sm font-bold gradient-primary shadow-md"
                                      title="Add 2kg"
                                    >
                                      +2
                                    </Button>
                                  </motion.div>
                                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                      onClick={() => {
                                        markSetCompleteOnInteraction(exerciseIndex, setIndex);
                                        const currentWeight = set.weight || 0;
                                        updateSet(exerciseIndex, setIndex, 'weight', String(currentWeight + 5));
                                      }}
                                      className="h-10 w-10 p-0 text-sm font-bold gradient-primary shadow-md"
                                      title="Add 5kg"
                                    >
                                      +5
                                    </Button>
                                  </motion.div>
                                </div>
                              </div>
                            </div>

                            {/* Desktop Layout - Horizontal */}
                            <div className="hidden sm:flex gap-2 items-center">
                              <div className="flex items-center gap-1">
                                <motion.div
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => toggleSetComplete(exerciseIndex, setIndex)}
                                  className="cursor-pointer"
                                >
                                  <Label className="w-12 text-primary font-bold text-sm shrink-0 cursor-pointer">
                                    Set {setIndex + 1}
                                  </Label>
                                </motion.div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  placeholder={prevSet?.reps ? `${prevSet.reps}` : "Reps"}
                                  value={set.reps || ''}
                                  data-complete-shortcut="true"
                                  data-exercise-index={exerciseIndex}
                                  data-set-index={setIndex}
                                  data-set-field="reps"
                                  onFocus={() => markSetCompleteOnInteraction(exerciseIndex, setIndex)}
                                  onChange={(e) =>
                                    updateSet(exerciseIndex, setIndex, 'reps', e.target.value)
                                  }
                                  className="w-20 h-10 border-2 font-bold text-center text-base placeholder:text-muted-foreground/50"
                                />
                                <div className="flex gap-1">
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        markSetCompleteOnInteraction(exerciseIndex, setIndex);
                                        incrementReps(exerciseIndex, setIndex, 2);
                                      }}
                                      className="h-8 w-8 p-0 text-xs font-bold gradient-primary shadow-sm"
                                      title="Add 2 reps"
                                    >
                                      +2
                                    </Button>
                                  </motion.div>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        markSetCompleteOnInteraction(exerciseIndex, setIndex);
                                        incrementReps(exerciseIndex, setIndex, 5);
                                      }}
                                      className="h-8 w-8 p-0 text-xs font-bold gradient-primary shadow-sm"
                                      title="Add 5 reps"
                                    >
                                      +5
                                    </Button>
                                  </motion.div>
                                </div>
                              </div>
                              <span className="text-muted-foreground text-xs font-medium shrink-0">reps</span>
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  step="0.5"
                                  placeholder={prevSet?.weight ? `${prevSet.weight}` : "Weight"}
                                  value={set.weight || ''}
                                  data-complete-shortcut="true"
                                  data-exercise-index={exerciseIndex}
                                  data-set-index={setIndex}
                                  data-set-field="weight"
                                  onFocus={() => markSetCompleteOnInteraction(exerciseIndex, setIndex)}
                                  onChange={(e) =>
                                    updateSet(exerciseIndex, setIndex, 'weight', e.target.value)
                                  }
                                  className="w-20 h-10 border-2 font-bold text-center text-base placeholder:text-muted-foreground/50"
                                />
                                <div className="flex gap-1">
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        markSetCompleteOnInteraction(exerciseIndex, setIndex);
                                        const currentWeight = set.weight || 0;
                                        updateSet(exerciseIndex, setIndex, 'weight', String(currentWeight + 2));
                                      }}
                                      className="h-8 w-8 p-0 text-xs font-bold gradient-primary shadow-sm"
                                      title="Add 2kg"
                                    >
                                      +2
                                    </Button>
                                  </motion.div>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        markSetCompleteOnInteraction(exerciseIndex, setIndex);
                                        const currentWeight = set.weight || 0;
                                        updateSet(exerciseIndex, setIndex, 'weight', String(currentWeight + 5));
                                      }}
                                      className="h-8 w-8 p-0 text-xs font-bold gradient-primary shadow-sm"
                                      title="Add 5kg"
                                    >
                                      +5
                                    </Button>
                                  </motion.div>
                                </div>
                              </div>
                              <span className="text-muted-foreground text-xs font-medium shrink-0">kg</span>
                              {exercise.sets.length > 1 && (
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeSet(exerciseIndex, setIndex)}
                                    className="shrink-0 h-9 w-9 hover:bg-destructive/10 rounded-lg"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        );
                        })}
                      </div>

                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addSet(exerciseIndex)}
                          className="w-full border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 h-11 font-semibold"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Add Set
                        </Button>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            /* Normal Column Layout */
            <AnimatePresence mode="popLayout">
              {exercises.map((exercise, exerciseIndex) => (
                <motion.div
                  key={exerciseIndex}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="rounded-2xl p-5 space-y-4 bg-gradient-to-br from-accent/30 to-accent/50 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-xl text-foreground">{exercise.name}</h3>
                      <div className="flex gap-2">
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => incrementAllReps(exerciseIndex, 2)}
                            className="h-7 px-3 text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-300"
                            title="Add 2 reps to all sets"
                          >
                            +2 all
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => incrementAllReps(exerciseIndex, 5)}
                            className="h-7 px-3 text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-300"
                            title="Add 5 reps to all sets"
                          >
                            +5 all
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                    <motion.div whileHover={{ scale: 1.1, rotate: 10 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExercise(exerciseIndex)}
                        className="hover:bg-destructive/10 rounded-xl transition-all duration-300"
                      >
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </motion.div>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    {exercise.sets.map((set, setIndex) => {
                      // Get previous session's data for this exercise and set
                      const prevExercise = previousSession?.exercises.find(e => e.name === exercise.name);
                      const prevSet = prevExercise?.sets[setIndex];

                      return (
                      <motion.div
                        key={setIndex}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{
                          opacity: set.completed ? 1 : 0.3,
                          scale: set.completed ? [1, 1.05, 1] : 1
                        }}
                        transition={{
                          opacity: { duration: 0.3 },
                          scale: {
                            duration: 0.25,
                            times: [0, 0.5, 1]
                          }
                        }}
                        className="bg-card/50 p-3 sm:p-3 rounded-xl shadow-md space-y-2 sm:space-y-0"
                      >
                        {/* Mobile Layout - Stacked */}
                        <div className="flex sm:hidden flex-col gap-3">
                          {/* Set number and Use Prev button row */}
                          <div className="flex items-center justify-between">
                            <motion.div
                              whileTap={{ scale: 0.95 }}
                              onClick={() => toggleSetComplete(exerciseIndex, setIndex)}
                              className="cursor-pointer"
                            >
                              <Label className="text-primary font-bold text-base cursor-pointer">
                                Set {setIndex + 1}
                              </Label>
                            </motion.div>
                            <div className="flex items-center gap-2">
                              {prevSet && (!set.reps || !set.weight) && (
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (prevSet.reps) updateSet(exerciseIndex, setIndex, 'reps', String(prevSet.reps));
                                      if (prevSet.weight) updateSet(exerciseIndex, setIndex, 'weight', String(prevSet.weight));
                                    }}
                                    className="h-8 px-3 text-xs font-bold hover:bg-primary/10 rounded-lg text-primary"
                                    title="Use previous values"
                                  >
                                    Use Prev
                                  </Button>
                                </motion.div>
                              )}
                              {exercise.sets.length > 1 && (
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeSet(exerciseIndex, setIndex)}
                                    className="h-8 w-8 hover:bg-destructive/10 rounded-lg"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </motion.div>
                              )}
                            </div>
                          </div>

                          {/* Reps input with increment buttons */}
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-semibold text-muted-foreground w-16">Reps</Label>
                            <Input
                              type="number"
                              placeholder={prevSet?.reps ? `${prevSet.reps}` : "0"}
                              value={set.reps || ''}
                              data-complete-shortcut="true"
                              data-exercise-index={exerciseIndex}
                              data-set-index={setIndex}
                              data-set-field="reps"
                              onFocus={() => markSetCompleteOnInteraction(exerciseIndex, setIndex)}
                              onChange={(e) =>
                                updateSet(exerciseIndex, setIndex, 'reps', e.target.value)
                              }
                              className="flex-1 h-12 border-2 font-bold text-center text-lg placeholder:text-muted-foreground/50"
                            />
                            <div className="flex gap-1.5">
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  onClick={() => {
                                    markSetCompleteOnInteraction(exerciseIndex, setIndex);
                                    incrementReps(exerciseIndex, setIndex, 2);
                                  }}
                                  className="h-10 w-10 p-0 text-sm font-bold gradient-primary shadow-md"
                                  title="Add 2 reps"
                                >
                                  +2
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  onClick={() => {
                                    markSetCompleteOnInteraction(exerciseIndex, setIndex);
                                    incrementReps(exerciseIndex, setIndex, 5);
                                  }}
                                  className="h-10 w-10 p-0 text-sm font-bold gradient-primary shadow-md"
                                  title="Add 5 reps"
                                >
                                  +5
                                </Button>
                              </motion.div>
                            </div>
                          </div>

                          {/* Weight input with increment buttons */}
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-semibold text-muted-foreground w-16">Weight</Label>
                            <Input
                              type="number"
                              step="0.5"
                              placeholder={prevSet?.weight ? `${prevSet.weight}` : "0"}
                              value={set.weight || ''}
                              data-complete-shortcut="true"
                              data-exercise-index={exerciseIndex}
                              data-set-index={setIndex}
                              data-set-field="weight"
                              onFocus={() => markSetCompleteOnInteraction(exerciseIndex, setIndex)}
                              onChange={(e) =>
                                updateSet(exerciseIndex, setIndex, 'weight', e.target.value)
                              }
                              className="flex-1 h-12 border-2 font-bold text-center text-lg placeholder:text-muted-foreground/50"
                            />
                            <div className="flex gap-1.5">
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  onClick={() => {
                                    markSetCompleteOnInteraction(exerciseIndex, setIndex);
                                    const currentWeight = set.weight || 0;
                                    updateSet(exerciseIndex, setIndex, 'weight', String(currentWeight + 2));
                                  }}
                                  className="h-10 w-10 p-0 text-sm font-bold gradient-primary shadow-md"
                                  title="Add 2kg"
                                >
                                  +2
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  onClick={() => {
                                    markSetCompleteOnInteraction(exerciseIndex, setIndex);
                                    const currentWeight = set.weight || 0;
                                    updateSet(exerciseIndex, setIndex, 'weight', String(currentWeight + 5));
                                  }}
                                  className="h-10 w-10 p-0 text-sm font-bold gradient-primary shadow-md"
                                  title="Add 5kg"
                                >
                                  +5
                                </Button>
                              </motion.div>
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout - Horizontal */}
                        <div className="hidden sm:flex gap-2 items-center">
                          <div className="flex items-center gap-1">
                            <motion.div
                              whileTap={{ scale: 0.95 }}
                              onClick={() => toggleSetComplete(exerciseIndex, setIndex)}
                              className="cursor-pointer"
                            >
                              <Label className="w-12 text-primary font-bold text-sm shrink-0 cursor-pointer">
                                Set {setIndex + 1}
                              </Label>
                            </motion.div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              placeholder={prevSet?.reps ? `${prevSet.reps}` : "Reps"}
                              value={set.reps || ''}
                              data-complete-shortcut="true"
                              data-exercise-index={exerciseIndex}
                              data-set-index={setIndex}
                              data-set-field="reps"
                              onFocus={() => markSetCompleteOnInteraction(exerciseIndex, setIndex)}
                              onChange={(e) =>
                                updateSet(exerciseIndex, setIndex, 'reps', e.target.value)
                              }
                              className="w-20 h-10 border-2 font-bold text-center text-base placeholder:text-muted-foreground/50"
                            />
                            <div className="flex gap-1">
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    markSetCompleteOnInteraction(exerciseIndex, setIndex);
                                    incrementReps(exerciseIndex, setIndex, 2);
                                  }}
                                  className="h-8 w-8 p-0 text-xs font-bold gradient-primary shadow-sm"
                                  title="Add 2 reps"
                                >
                                  +2
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    markSetCompleteOnInteraction(exerciseIndex, setIndex);
                                    incrementReps(exerciseIndex, setIndex, 5);
                                  }}
                                  className="h-8 w-8 p-0 text-xs font-bold gradient-primary shadow-sm"
                                  title="Add 5 reps"
                                >
                                  +5
                                </Button>
                              </motion.div>
                            </div>
                          </div>
                          <span className="text-muted-foreground text-xs font-medium shrink-0">reps</span>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.5"
                              placeholder={prevSet?.weight ? `${prevSet.weight}` : "Weight"}
                              value={set.weight || ''}
                              data-complete-shortcut="true"
                              data-exercise-index={exerciseIndex}
                              data-set-index={setIndex}
                              data-set-field="weight"
                              onFocus={() => markSetCompleteOnInteraction(exerciseIndex, setIndex)}
                              onChange={(e) =>
                                updateSet(exerciseIndex, setIndex, 'weight', e.target.value)
                              }
                              className="w-20 h-10 border-2 font-bold text-center text-base placeholder:text-muted-foreground/50"
                            />
                            <div className="flex gap-1">
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    markSetCompleteOnInteraction(exerciseIndex, setIndex);
                                    const currentWeight = set.weight || 0;
                                    updateSet(exerciseIndex, setIndex, 'weight', String(currentWeight + 2));
                                  }}
                                  className="h-8 w-8 p-0 text-xs font-bold gradient-primary shadow-sm"
                                  title="Add 2kg"
                                >
                                  +2
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    markSetCompleteOnInteraction(exerciseIndex, setIndex);
                                    const currentWeight = set.weight || 0;
                                    updateSet(exerciseIndex, setIndex, 'weight', String(currentWeight + 5));
                                  }}
                                  className="h-8 w-8 p-0 text-xs font-bold gradient-primary shadow-sm"
                                  title="Add 5kg"
                                >
                                  +5
                                </Button>
                              </motion.div>
                            </div>
                          </div>
                          <span className="text-muted-foreground text-xs font-medium shrink-0">kg</span>
                          {exercise.sets.length > 1 && (
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeSet(exerciseIndex, setIndex)}
                                className="shrink-0 h-9 w-9 hover:bg-destructive/10 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    );
                    })}
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addSet(exerciseIndex)}
                      className="w-full border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 h-11 font-semibold"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Set
                    </Button>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="pt-2"
          >
            <Button
              onClick={saveWorkout}
              disabled={isSaveDisabled}
              className="w-full gradient-primary shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60"
              size="lg"
            >
              <Save className="h-5 w-5 mr-2" />
              <span className="font-bold">Save Workout</span>
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
