import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WorkoutSession } from '@/types/workout';
import { motion } from 'framer-motion';

interface PreviousSessionComparisonProps {
  currentSession: WorkoutSession | null;
  previousSession: WorkoutSession | null;
}

export function PreviousSessionComparison({
  currentSession,
  previousSession,
}: PreviousSessionComparisonProps) {
  if (!previousSession) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl gradient-text">Previous Session</CardTitle>
          <CardDescription className="text-base font-medium">No previous workout found</CardDescription>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-block p-6 rounded-full bg-primary/10 mb-4"
            >
              <Minus className="h-16 w-16 text-primary" />
            </motion.div>
            <p className="text-muted-foreground text-base">Start logging to track your progress</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getExerciseComparison = (exerciseName: string) => {
    const current = currentSession?.exercises.find(e => e.name === exerciseName);
    const previous = previousSession.exercises.find(e => e.name === exerciseName);

    if (!previous) return null;

    const prevTotalReps = previous.sets.reduce((sum, set) => sum + set.reps, 0);
    const prevTotalVolume = previous.sets.reduce(
      (sum, set) => sum + set.reps * (set.weight || 0),
      0
    );
    const prevMaxWeight = Math.max(...previous.sets.map(set => set.weight || 0));

    let currentTotalReps = 0;
    let currentTotalVolume = 0;
    let currentMaxWeight = 0;

    if (current) {
      currentTotalReps = current.sets.reduce((sum, set) => sum + set.reps, 0);
      currentTotalVolume = current.sets.reduce(
        (sum, set) => sum + set.reps * (set.weight || 0),
        0
      );
      currentMaxWeight = Math.max(...current.sets.map(set => set.weight || 0));
    }

    return {
      previous,
      current,
      prevTotalReps,
      prevTotalVolume,
      prevMaxWeight,
      currentTotalReps,
      currentTotalVolume,
      currentMaxWeight,
      repsDiff: currentTotalReps - prevTotalReps,
      volumeDiff: currentTotalVolume - prevTotalVolume,
      weightDiff: currentMaxWeight - prevMaxWeight,
    };
  };

  const ComparisonIndicator = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1 text-green-600 dark:text-green-500 font-bold px-2 py-1 rounded-lg bg-green-100 dark:bg-green-950/30"
        >
          <ArrowUp className="h-4 w-4" />
          {value > 0 ? '+' : ''}{value}
        </motion.span>
      );
    }
    if (value < 0) {
      return (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1 text-orange-600 dark:text-orange-500 font-bold px-2 py-1 rounded-lg bg-orange-100 dark:bg-orange-950/30"
        >
          <ArrowDown className="h-4 w-4" />
          {value}
        </motion.span>
      );
    }
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex items-center gap-1 text-muted-foreground font-semibold px-2 py-1 rounded-lg bg-muted/30"
      >
        <Minus className="h-4 w-4" />
        0
      </motion.span>
    );
  };

  return (
    <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-2xl gradient-text">Previous Session</CardTitle>
        <CardDescription className="text-base font-semibold text-primary">{previousSession.date}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {previousSession.exercises.map((exercise, index) => {
          const comparison = getExerciseComparison(exercise.name);
          if (!comparison) return null;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
              className="rounded-2xl p-5 space-y-4 bg-gradient-to-br from-accent/20 to-accent/40 shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <h4 className="font-bold text-lg text-foreground">{exercise.name}</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div className="space-y-2">
                  <div className="text-muted-foreground font-bold text-xs uppercase tracking-wide">Previous</div>
                  <div className="space-y-1.5">
                    {comparison.previous.sets.map((set, i) => (
                      <div key={i} className="text-sm font-medium bg-card/50 px-3 py-1.5 rounded-lg">
                        {set.reps} reps {set.weight ? `× ${set.weight}kg` : ''}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs font-semibold text-muted-foreground p-2 bg-card/30 rounded-lg">
                    Total: {comparison.prevTotalReps} reps
                    {comparison.prevTotalVolume > 0 && ` · ${comparison.prevTotalVolume.toFixed(0)}kg volume`}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-muted-foreground font-bold text-xs uppercase tracking-wide">Comparison</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Reps:</span>
                      <ComparisonIndicator value={comparison.repsDiff} />
                    </div>
                    {comparison.prevMaxWeight > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Max Weight:</span>
                        <ComparisonIndicator value={comparison.weightDiff} />
                      </div>
                    )}
                    {comparison.prevTotalVolume > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Volume:</span>
                        <ComparisonIndicator value={Math.round(comparison.volumeDiff)} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {previousSession.notes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm rounded-xl p-4 bg-primary/5 shadow-sm"
          >
            <div className="font-bold text-primary mb-2">Notes from last time:</div>
            <div className="italic text-foreground">{previousSession.notes}</div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
