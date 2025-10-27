import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutSession } from '@/types/workout';
import { analytics } from '@/services/analytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface ProgressChartsProps {
  sessions: WorkoutSession[];
}

const ChartTooltip = () => (
  <Tooltip
    contentStyle={{
      backgroundColor: 'hsl(var(--card))',
      border: '2px solid hsl(var(--primary))',
      borderRadius: '12px',
      padding: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}
    labelStyle={{ fontWeight: 'bold', color: 'hsl(var(--foreground))' }}
  />
);

const ChartSection = ({
  title,
  data,
  dataKey,
  delay = 0
}: {
  title: string;
  data: any[];
  dataKey: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className="p-5 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/40 shadow-lg"
  >
    <h4 className="text-base font-bold mb-4 text-foreground flex items-center gap-2">
      <div className="w-1 h-6 gradient-primary rounded-full"></div>
      {title}
    </h4>
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
        <XAxis
          dataKey="date"
          className="text-xs"
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '12px', fontWeight: 600 }}
        />
        <YAxis
          className="text-xs"
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '12px', fontWeight: 600 }}
        />
        <ChartTooltip />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke="hsl(var(--primary))"
          strokeWidth={4}
          dot={{ fill: 'hsl(var(--primary))', r: 6, strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 8, strokeWidth: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </motion.div>
);

export function ProgressCharts({ sessions }: ProgressChartsProps) {
  const exercises = useMemo(() => analytics.getAllExercises(sessions), [sessions]);

  if (exercises.length === 0) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl gradient-text">Progress Charts</CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-block p-6 rounded-full bg-primary/10 mb-4"
            >
              <LineChart className="h-16 w-16 text-primary" />
            </motion.div>
            <p className="text-muted-foreground text-lg">No workout data yet. Start logging workouts to see your progress!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get today's total reps by exercise
  const today = new Date().toISOString().split('T')[0];
  const todaysSessions = sessions.filter(s => s.date === today);
  const todaysReps = useMemo(() => {
    const repsMap: { [exercise: string]: number } = {};
    exercises.forEach(ex => {
      repsMap[ex] = 0;
    });

    todaysSessions.forEach(session => {
      session.exercises.forEach(exercise => {
        const reps = exercise.sets.reduce((sum, set) => sum + set.reps, 0);
        repsMap[exercise.name] = (repsMap[exercise.name] || 0) + reps;
      });
    });

    return Object.entries(repsMap)
      .filter(([_, reps]) => reps > 0)
      .map(([name, reps]) => ({ exercise: name, reps }));
  }, [exercises, todaysSessions]);

  return (
    <div className="space-y-6">
      {/* Today's Total Reps Chart */}
      {todaysReps.length > 0 && (
        <Card className="border-2 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl gradient-text">Today's Total Reps by Exercise</CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="p-5 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/40 shadow-lg"
            >
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={todaysReps}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis
                    dataKey="exercise"
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '11px', fontWeight: 600 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px', fontWeight: 600 }}
                  />
                  <ChartTooltip />
                  <Line
                    type="linear"
                    dataKey="reps"
                    stroke="hsl(var(--primary))"
                    strokeWidth={4}
                    dot={{ fill: 'hsl(var(--primary))', r: 8, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 10, strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </CardContent>
        </Card>
      )}

      {/* Per-Exercise Progress Charts */}
      {exercises.map((exerciseName, idx) => {
        const progress = analytics.getExerciseProgress(sessions, exerciseName);
        const chartData = progress.dates.map((date, i) => ({
          date: date.substring(5), // Show MM-DD
          reps: progress.totalReps[i],
          volume: progress.totalVolume[i],
          maxWeight: progress.maxWeight[i],
        }));

        if (chartData.length === 0) return null;

        const hasVolume = chartData.some(d => d.volume > 0);
        const hasWeight = chartData.some(d => d.maxWeight > 0);

        return (
          <Card key={exerciseName} className="border-2 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-xl gradient-text">{exerciseName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Total Reps for this exercise */}
              <ChartSection
                title="Total Reps per Session"
                data={chartData}
                dataKey="reps"
                delay={0.1 + idx * 0.05}
              />

              {/* Volume Chart if weights are tracked */}
              {hasVolume && (
                <ChartSection
                  title="Total Volume (reps × weight)"
                  data={chartData}
                  dataKey="volume"
                  delay={0.2 + idx * 0.05}
                />
              )}

              {/* Max Weight Chart if weights are tracked */}
              {hasWeight && (
                <ChartSection
                  title="Max Weight per Session"
                  data={chartData}
                  dataKey="maxWeight"
                  delay={0.3 + idx * 0.05}
                />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
