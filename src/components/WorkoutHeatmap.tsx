import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WorkoutSession } from '@/types/workout';
import { analytics } from '@/services/analytics';
import { subDays, format, startOfWeek, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Flame, Trophy, Calendar } from 'lucide-react';

interface WorkoutHeatmapProps {
  sessions: WorkoutSession[];
}

export function WorkoutHeatmap({ sessions }: WorkoutHeatmapProps) {
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
          <div className="overflow-x-auto">
            <div className="inline-flex flex-col gap-1">
              {/* Day labels */}
              <div className="flex gap-1 mb-1">
                <div className="w-8" /> {/* Spacer for month labels */}
                <div className="text-xs text-muted-foreground grid grid-rows-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <div key={day} className="h-3 flex items-center">
                      {i % 2 === 1 && day.substring(0, 1)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-1">
                {/* Month labels (vertical) */}
                <div className="flex flex-col justify-start text-xs text-muted-foreground mr-1">
                  {weeks.map((week, weekIndex) => {
                    const firstDay = week[0];
                    const showMonth = weekIndex === 0 || format(firstDay, 'MMM') !== format(weeks[weekIndex - 1][0], 'MMM');
                    return (
                      <div key={weekIndex} className="h-3 mb-1 flex items-start">
                        {showMonth && format(firstDay, 'MMM')}
                      </div>
                    );
                  })}
                </div>

                {/* Heatmap grid */}
                <div className="flex gap-1">
                  {weeks.map((week, weekIndex) => (
                    <motion.div
                      key={weekIndex}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: weekIndex * 0.02 }}
                      className="flex flex-col gap-1"
                    >
                      {week.map((date, dayIndex) => {
                        const intensity = getIntensity(date);
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const session = sessions.find(s => s.date === dateStr);
                        const future = isFutureDate(date);

                        return (
                          <motion.div
                            key={dayIndex}
                            whileHover={{ scale: 1.3 }}
                            className={`w-4 h-4 rounded-md ${
                              future ? 'bg-transparent border-2 border-muted/20' : getColor(intensity)
                            } transition-all hover:ring-2 hover:ring-primary cursor-pointer shadow-sm`}
                            title={
                              future
                                ? format(date, 'MMM d, yyyy')
                                : hasWorkout(date)
                                ? `${format(date, 'MMM d, yyyy')} - ${
                                    session ? analytics.getSessionStats(session).totalSets : 0
                                  } sets`
                                : `${format(date, 'MMM d, yyyy')} - No workout`
                            }
                          />
                        );
                      })}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 mt-6 text-sm font-semibold text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map((level) => (
                    <motion.div
                      key={level}
                      whileHover={{ scale: 1.2 }}
                      className={`w-4 h-4 rounded-md ${getColor(level)} shadow-sm`}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
