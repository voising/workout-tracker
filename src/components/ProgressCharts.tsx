import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { WorkoutSession } from '@/types/workout';
import { analytics } from '@/services/analytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface ProgressChartsProps {
  sessions: WorkoutSession[];
}

export function ProgressCharts({ sessions }: ProgressChartsProps) {
  const exercises = analytics.getAllExercises(sessions);
  const [selectedExercise, setSelectedExercise] = useState(exercises[0] || '');

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

  const progress = selectedExercise ? analytics.getExerciseProgress(sessions, selectedExercise) : null;

  const chartData = progress
    ? progress.dates.map((date, i) => ({
        date: date.substring(5), // Show MM-DD
        reps: progress.totalReps[i],
        volume: progress.totalVolume[i],
        maxWeight: progress.maxWeight[i],
      }))
    : [];

  return (
    <div className="space-y-6">
      <Card className="border-2 shadow-xl hover:shadow-2xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-2xl gradient-text">Progress Charts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <Label className="text-sm font-bold mb-3 block">Select Exercise</Label>
            <motion.select
              className="mt-2 w-full h-12 rounded-xl bg-card px-4 py-2 text-base font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              whileFocus={{ scale: 1.01 }}
            >
              {exercises.map((exercise) => (
                <option key={exercise} value={exercise}>
                  {exercise}
                </option>
              ))}
            </motion.select>
          </div>

          {progress && chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Total Reps Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/40 shadow-lg"
              >
                <h4 className="text-base font-bold mb-4 text-foreground flex items-center gap-2">
                  <div className="w-1 h-6 gradient-primary rounded-full"></div>
                  Total Reps per Session
                </h4>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
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
                    <Line
                      type="monotone"
                      dataKey="reps"
                      stroke="hsl(var(--primary))"
                      strokeWidth={4}
                      dot={{ fill: 'hsl(var(--primary))', r: 6, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 8, strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Volume Chart (if weights are tracked) */}
              {chartData.some(d => d.volume > 0) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/40 shadow-lg"
                >
                  <h4 className="text-base font-bold mb-4 text-foreground flex items-center gap-2">
                    <div className="w-1 h-6 gradient-primary rounded-full"></div>
                    Total Volume (reps × weight)
                  </h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData}>
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
                      <Line
                        type="monotone"
                        dataKey="volume"
                        stroke="hsl(var(--primary))"
                        strokeWidth={4}
                        dot={{ fill: 'hsl(var(--primary))', r: 6, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 8, strokeWidth: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Max Weight Chart (if weights are tracked) */}
              {chartData.some(d => d.maxWeight > 0) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/40 shadow-lg"
                >
                  <h4 className="text-base font-bold mb-4 text-foreground flex items-center gap-2">
                    <div className="w-1 h-6 gradient-primary rounded-full"></div>
                    Max Weight per Session
                  </h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData}>
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
                      <Line
                        type="monotone"
                        dataKey="maxWeight"
                        stroke="hsl(var(--primary))"
                        strokeWidth={4}
                        dot={{ fill: 'hsl(var(--primary))', r: 6, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 8, strokeWidth: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
