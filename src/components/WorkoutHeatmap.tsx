import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WorkoutSession } from '@/types/workout';
import { analytics } from '@/services/analytics';
import { subDays, format, startOfWeek, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Flame, Trophy, Calendar, HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface WorkoutHeatmapProps {
  sessions: WorkoutSession[];
}

export function WorkoutHeatmap({ sessions }: WorkoutHeatmapProps) {
  const [showLegend, setShowLegend] = useState(false);
  const streak = analytics.calculateStreak(sessions);

  // Generate last 12 weeks of dates
  const today = new Date();
  const weeks: Date[][] = [];
  const startDate = subDays(today, 83); // ~12 weeks

  let currentWeek: Date[] = [];
  const weekStart = startOfWeek(startDate, { weekStartsOn: 0 }); // Sunday

  for (let i = 0; i < 84; i++) {
    const date = addDays(weekStart, i);
    currentWeek.push(date);

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  const hasWorkout = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return streak.workoutDays.has(dateStr);
  };

  const getIntensity = (date: Date): number => {
    if (!hasWorkout(date)) return 0;

    const dateStr = format(date, 'yyyy-MM-dd');
    const session = sessions.find(s => s.date === dateStr);
    if (!session) return 1;

    const stats = analytics.getSessionStats(session);
    // Base intensity on total sets (simple metric)
    if (stats.totalSets >= 20) return 4;
    if (stats.totalSets >= 15) return 3;
    if (stats.totalSets >= 10) return 2;
    return 1;
  };

  const getColor = (intensity: number): string => {
    switch (intensity) {
      case 0:
        return 'bg-muted/30';
      case 1:
        return 'bg-primary/20';
      case 2:
        return 'bg-primary/40';
      case 3:
        return 'bg-primary/60';
      case 4:
        return 'bg-primary/80';
      default:
        return 'bg-muted/30';
    }
  };

  const isFutureDate = (date: Date): boolean => {
    return date > today;
  };

  return (
    <div className="space-y-8">
      {/* Streak Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0, type: "spring", stiffness: 200 }}
        >
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <CardContent className="pt-8 pb-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Current Streak</p>
                  <motion.p
                    className="text-4xl font-black gradient-text"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  >
                    {streak.currentStreak}
                  </motion.p>
                  <p className="text-sm text-muted-foreground font-medium mt-1">days</p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-4 rounded-2xl gradient-primary shadow-glow"
                >
                  <Flame className="h-10 w-10 text-primary-foreground" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        >
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <CardContent className="pt-8 pb-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Longest Streak</p>
                  <motion.p
                    className="text-4xl font-black gradient-text"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                  >
                    {streak.longestStreak}
                  </motion.p>
                  <p className="text-sm text-muted-foreground font-medium mt-1">days</p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-4 rounded-2xl gradient-primary shadow-glow"
                >
                  <Trophy className="h-10 w-10 text-primary-foreground" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <CardContent className="pt-8 pb-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Total Workouts</p>
                  <motion.p
                    className="text-4xl font-black gradient-text"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                  >
                    {streak.totalWorkouts}
                  </motion.p>
                  <p className="text-sm text-muted-foreground font-medium mt-1">sessions</p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-4 rounded-2xl gradient-primary shadow-glow"
                >
                  <Calendar className="h-10 w-10 text-primary-foreground" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Heatmap */}
      <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-2xl gradient-text">Workout Activity</CardTitle>
          <CardDescription className="text-base font-medium">Last 12 weeks</CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <div className="space-y-6">
            {/* Legend popover - appears on hover */}
            <div className="relative inline-block">
              <button
                onMouseEnter={() => setShowLegend(true)}
                onMouseLeave={() => setShowLegend(false)}
                className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                What do the colors mean?
              </button>

              {showLegend && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  onMouseEnter={() => setShowLegend(true)}
                  onMouseLeave={() => setShowLegend(false)}
                  className="absolute top-full left-0 mt-2 bg-card border border-primary/20 rounded-lg p-4 w-80 shadow-lg z-50"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-primary/80 shadow-sm flex-shrink-0"></div>
                      <span className="text-sm text-muted-foreground"><span className="font-semibold">Dark red</span> = Intense (20+ sets)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-primary/60 shadow-sm flex-shrink-0"></div>
                      <span className="text-sm text-muted-foreground"><span className="font-semibold">Red</span> = Medium (15-19 sets)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-primary/40 shadow-sm flex-shrink-0"></div>
                      <span className="text-sm text-muted-foreground"><span className="font-semibold">Light red</span> = Light (10-14 sets)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-primary/20 shadow-sm flex-shrink-0"></div>
                      <span className="text-sm text-muted-foreground"><span className="font-semibold">Very light red</span> = Minimal (1-9 sets)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-muted/30 shadow-sm flex-shrink-0"></div>
                      <span className="text-sm text-muted-foreground"><span className="font-semibold">Gray</span> = No workout</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* The actual heatmap - cleaner layout */}
            <div className="overflow-x-auto pb-4">
              <div className="inline-block">
                <div className="flex gap-3">
                  {/* Day of week labels on the left */}
                  <div className="flex flex-col gap-0.5 pt-6">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                      <div
                        key={day}
                        className="h-8 w-16 text-xs font-semibold text-muted-foreground flex items-center justify-start"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div>
                    {/* Month labels at the top */}
                    <div className="flex gap-0.5 mb-2">
                      {weeks.map((week, weekIndex) => {
                        const firstDay = week[0];
                        const showMonth = weekIndex === 0 || format(firstDay, 'MMM') !== format(weeks[weekIndex - 1][0], 'MMM');
                        return (
                          <div
                            key={weekIndex}
                            className="w-8 text-xs font-bold text-foreground text-center h-5 flex items-center justify-center"
                          >
                            {showMonth && format(firstDay, 'MMM')}
                          </div>
                        );
                      })}
                    </div>

                    {/* Heatmap grid */}
                    <div className="flex gap-0.5">
                      {weeks.map((week, weekIndex) => (
                        <motion.div
                          key={weekIndex}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: weekIndex * 0.02 }}
                          className="flex flex-col gap-0.5"
                        >
                          {week.map((date, dayIndex) => {
                            const intensity = getIntensity(date);
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const session = sessions.find(s => s.date === dateStr);
                            const future = isFutureDate(date);

                            return (
                              <motion.div
                                key={dayIndex}
                                whileHover={{ scale: 1.5 }}
                                className={`w-8 h-8 rounded-lg transition-all hover:ring-2 hover:ring-primary hover:shadow-lg cursor-pointer font-bold text-xs flex items-center justify-center ${
                                  future
                                    ? 'bg-muted/10 border-2 border-dashed border-muted/30 text-transparent'
                                    : getColor(intensity) + ' text-muted-foreground hover:text-foreground'
                                }`}
                                title={
                                  future
                                    ? format(date, 'eee, MMM d, yyyy')
                                    : hasWorkout(date)
                                    ? `${format(date, 'eee, MMM d, yyyy')}\n${
                                        session ? analytics.getSessionStats(session).totalSets : 0
                                      } sets`
                                    : `${format(date, 'eee, MMM d, yyyy')}\nNo workout`
                                }
                              >
                                {!future && hasWorkout(date) && session ? analytics.getSessionStats(session).totalSets : ''}
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary text */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{streak.totalWorkouts}</span> workouts completed •
                <span className="font-semibold text-foreground ml-2">{streak.currentStreak}</span> day streak 🔥
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
