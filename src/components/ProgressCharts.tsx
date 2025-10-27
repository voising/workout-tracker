import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutSession } from '@/types/workout';
import { analytics } from '@/services/analytics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Target, Zap, Calendar, TrendingDown, Info } from 'lucide-react';

interface ProgressChartsProps {
  sessions: WorkoutSession[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  '#8b5cf6',
  '#06b6d4',
  '#14b8a6',
  '#f59e0b',
];

const ChartTooltip = () => (
  <Tooltip
    contentStyle={{
      backgroundColor: 'hsl(var(--card))',
      border: '2px solid hsl(var(--primary))',
      borderRadius: '12px',
      padding: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}
    labelStyle={{ fontWeight: 'bold', color: 'hsl(var(--foreground))' }}
    formatter={(value) => {
      if (typeof value === 'number') {
        return value.toFixed(1);
      }
      return value;
    }}
  />
);

const KPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  description,
  delay = 0,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
  delay?: number;
}) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg relative"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {description && (
              <div className="relative">
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="text-primary/60 hover:text-primary transition-colors p-0.5 rounded hover:bg-primary/10"
                  title="View explanation"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                {showInfo && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute z-10 bottom-full left-0 mb-2 bg-card border border-primary/20 rounded-lg p-3 w-56 text-xs text-muted-foreground shadow-lg"
                  >
                    {description}
                  </motion.div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold gradient-text">{value}</p>
            {trend && (
              <div
                className={`flex items-center gap-1 text-xs font-semibold ${
                  trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'
                }`}
              >
                {trend === 'up' && <TrendingUp className="w-3 h-3" />}
                {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              </div>
            )}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="text-primary/60 ml-4">{Icon}</div>
      </div>
    </motion.div>
  );
};

const ChartSection = ({
  title,
  data,
  dataKey,
  dataKey2,
  xAxisKey = 'date',
  chartType = 'line',
  delay = 0,
}: {
  title: string;
  data: any[];
  dataKey: string;
  dataKey2?: string;
  xAxisKey?: string;
  chartType?: 'line' | 'area' | 'bar' | 'composed';
  delay?: number;
}) => {
  const renderChart = () => {
    switch (chartType) {
      case 'area':
        return (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
            <XAxis dataKey={xAxisKey} className="text-xs" stroke="hsl(var(--muted-foreground))" />
            <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
            <ChartTooltip />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="hsl(var(--primary))"
              fillOpacity={1}
              fill="url(#colorGradient)"
              strokeWidth={3}
            />
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
            <XAxis dataKey={xAxisKey} className="text-xs" stroke="hsl(var(--muted-foreground))" angle={-45} textAnchor="end" height={80} />
            <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
            <ChartTooltip />
            <Legend />
            <Bar dataKey={dataKey} fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} label={{ position: 'top', fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 'bold' }} />
            {dataKey2 && <Bar dataKey={dataKey2} fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} label={{ position: 'top', fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 'bold' }} />}
          </BarChart>
        );
      case 'composed':
        return (
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
            <XAxis dataKey={xAxisKey} className="text-xs" stroke="hsl(var(--muted-foreground))" />
            <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
            <ChartTooltip />
            <Legend />
            <Bar dataKey={dataKey} fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            {dataKey2 && <Line type="monotone" dataKey={dataKey2} stroke="hsl(var(--accent))" strokeWidth={2} />}
          </ComposedChart>
        );
      default:
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
            <XAxis dataKey={xAxisKey} className="text-xs" stroke="hsl(var(--muted-foreground))" />
            <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
            <ChartTooltip />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', r: 5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, strokeWidth: 2 }}
            />
            {dataKey2 && (
              <Line
                type="monotone"
                dataKey={dataKey2}
                stroke="hsl(var(--accent))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--accent))', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, strokeWidth: 2 }}
              />
            )}
          </LineChart>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="p-6 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 shadow-lg hover:shadow-xl transition-shadow duration-300"
    >
      <h4 className="text-base font-bold mb-4 text-foreground flex items-center gap-2">
        <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
        {title}
      </h4>
      <ResponsiveContainer width="100%" height={280}>
        {renderChart()}
      </ResponsiveContainer>
    </motion.div>
  );
};

export function ProgressCharts({ sessions }: ProgressChartsProps) {
  const exercises = useMemo(() => analytics.getAllExercises(sessions), [sessions]);
  const streak = useMemo(() => analytics.calculateStreak(sessions), [sessions]);

  if (exercises.length === 0) {
    return (
      <Card className="shadow-xl border-2">
        <CardHeader>
          <CardTitle className="text-2xl gradient-text">Progress Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="py-16">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="inline-block p-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-6"
            >
              <Zap className="h-20 w-20 text-primary" />
            </motion.div>
            <p className="text-muted-foreground text-lg font-medium">
              No workout data yet. Start logging workouts to see your progress!
            </p>
            <p className="text-sm text-muted-foreground mt-3">
              Your stunning progress dashboard awaits your first workout
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate detailed metrics
  const today = new Date().toISOString().split('T')[0];
  const todaysSessions = sessions.filter((s) => s.date === today);

  const todaysStats = useMemo(() => {
    let totalReps = 0;
    let totalVolume = 0;
    let totalExercises = 0;
    const exerciseSet = new Set<string>();

    todaysSessions.forEach((session) => {
      session.exercises.forEach((exercise) => {
        exerciseSet.add(exercise.name);
        const reps = exercise.sets.reduce((sum, set) => sum + set.reps, 0);
        const volume = exercise.sets.reduce((sum, set) => sum + set.reps * (set.weight || 0), 0);
        totalReps += reps;
        totalVolume += volume;
      });
    });

    totalExercises = exerciseSet.size;

    return { totalReps, totalVolume, totalExercises };
  }, [todaysSessions]);

  // Get weekly stats
  const weeklyStats = useMemo(() => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = lastWeek.toISOString().split('T')[0];

    const weekSessions = sessions.filter((s) => s.date > lastWeekStr);
    const totalSetsThisWeek = weekSessions.reduce(
      (sum, session) => sum + session.exercises.reduce((s, ex) => s + ex.sets.length, 0),
      0
    );

    return { totalWorkouts: weekSessions.length, totalSets: totalSetsThisWeek };
  }, [sessions]);

  // Calculate personal records
  const personalRecords = useMemo(() => {
    const records: { [exerciseName: string]: { maxWeight: number; maxReps: number } } = {};

    exercises.forEach((exerciseName) => {
      const progress = analytics.getExerciseProgress(sessions, exerciseName);
      const maxWeight = Math.max(...progress.maxWeight, 0);
      const maxReps = Math.max(...progress.totalReps, 0);
      records[exerciseName] = { maxWeight, maxReps };
    });

    return records;
  }, [exercises, sessions]);

  // Prepare today's reps chart
  const todaysReps = useMemo(() => {
    const repsMap: { [exercise: string]: number } = {};

    exercises.forEach((ex) => {
      repsMap[ex] = 0;
    });

    todaysSessions.forEach((session) => {
      session.exercises.forEach((exercise) => {
        const reps = exercise.sets.reduce((sum, set) => sum + set.reps, 0);
        repsMap[exercise.name] = (repsMap[exercise.name] || 0) + reps;
      });
    });

    return Object.entries(repsMap)
      .filter(([_, reps]) => reps > 0)
      .map(([name, reps]) => ({ exercise: name, reps }))
      .sort((a, b) => b.reps - a.reps);
  }, [exercises, todaysSessions]);

  // Volume vs Reps comparison for all exercises
  const volumeVsRepsData = useMemo(() => {
    return exercises.map((exerciseName) => {
      const progress = analytics.getExerciseProgress(sessions, exerciseName);
      const avgReps = progress.totalReps.length > 0 ? progress.totalReps.reduce((a, b) => a + b, 0) / progress.totalReps.length : 0;
      const avgVolume = progress.totalVolume.length > 0 ? progress.totalVolume.reduce((a, b) => a + b, 0) / progress.totalVolume.length : 0;
      return { name: exerciseName, reps: Math.round(avgReps), volume: Math.round(avgVolume) };
    });
  }, [exercises, sessions]);

  // Exercise frequency distribution
  const exerciseFrequency = useMemo(() => {
    const frequency: { [exerciseName: string]: number } = {};

    exercises.forEach((exerciseName) => {
      const progress = analytics.getExerciseProgress(sessions, exerciseName);
      frequency[exerciseName] = progress.dates.length;
    });

    return Object.entries(frequency)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value);
  }, [exercises, sessions]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold gradient-text mb-2">Progress Dashboard</h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* Top KPIs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <KPICard
          title="Today's Reps"
          value={todaysStats.totalReps}
          subtitle={`${todaysStats.totalExercises} exercises`}
          icon={<Zap className="w-6 h-6" />}
          delay={0.1}
        />
        <KPICard
          title="Volume"
          value={todaysStats.totalVolume.toLocaleString()}
          subtitle="kg × reps"
          icon={<Target className="w-6 h-6" />}
          description="Total volume is calculated by multiplying the weight (in kg) by the number of reps for each set, then summing across all exercises performed today. This metric shows your total training load."
          delay={0.2}
        />
        <KPICard
          title="This Week"
          value={weeklyStats.totalWorkouts}
          subtitle={`${weeklyStats.totalSets} total sets`}
          icon={<Calendar className="w-6 h-6" />}
          trend={weeklyStats.totalWorkouts >= 4 ? 'up' : 'neutral'}
          description="This shows the number of unique workout sessions completed in the last 7 days, along with the total number of sets across all sessions. A trending up indicator appears when you've completed 4 or more workouts this week."
          delay={0.3}
        />
        <KPICard
          title="Current Streak"
          value={streak.currentStreak}
          subtitle={`Best: ${streak.longestStreak} days`}
          icon={<Award className="w-6 h-6" />}
          trend={streak.currentStreak > 0 ? 'up' : 'neutral'}
          delay={0.4}
        />
      </motion.div>

      {/* Today's Performance */}
      {todaysReps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-2 shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-xl gradient-text flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Today's Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartSection
                title="Reps by Exercise"
                data={todaysReps}
                dataKey="reps"
                xAxisKey="exercise"
                chartType="bar"
                delay={0.6}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Overview Charts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg gradient-text">Average Reps vs Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartSection
              title=""
              data={volumeVsRepsData}
              dataKey="reps"
              dataKey2="volume"
              chartType="composed"
            />
          </CardContent>
        </Card>

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg gradient-text">Exercise Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={exerciseFrequency}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {exerciseFrequency.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Per-Exercise Progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <h2 className="text-2xl font-bold gradient-text mb-4">Exercise Progress</h2>
      </motion.div>

      {exercises.map((exerciseName, idx) => {
        const progress = analytics.getExerciseProgress(sessions, exerciseName);
        const chartData = progress.dates.map((date, i) => ({
          date: date.substring(5), // Show MM-DD
          reps: progress.totalReps[i],
          volume: progress.totalVolume[i],
          maxWeight: progress.maxWeight[i],
        }));

        if (chartData.length === 0) return null;

        const hasVolume = chartData.some((d) => d.volume > 0);
        const hasWeight = chartData.some((d) => d.maxWeight > 0);
        const maxReps = personalRecords[exerciseName]?.maxReps || 0;
        const maxWeight = personalRecords[exerciseName]?.maxWeight || 0;

        return (
          <motion.div
            key={exerciseName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 + idx * 0.05 }}
          >
            <Card className="border-2 shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-gradient-to-br from-accent/5 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl gradient-text">{exerciseName}</CardTitle>
                  <div className="flex gap-2">
                    {maxReps > 0 && (
                      <div className="px-3 py-1 rounded-lg bg-primary/20 text-xs font-bold text-primary">
                        {maxReps} reps PR
                      </div>
                    )}
                    {maxWeight > 0 && (
                      <div className="px-3 py-1 rounded-lg bg-accent/20 text-xs font-bold text-accent">
                        {maxWeight}kg PR
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{progress.dates.length} sessions tracked</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Total Reps */}
                <ChartSection
                  title="Total Reps per Session"
                  data={chartData}
                  dataKey="reps"
                  chartType="area"
                  delay={0.1 + idx * 0.05}
                />

                {/* Volume Chart if weights are tracked */}
                {hasVolume && (
                  <ChartSection
                    title="Total Volume (reps × weight)"
                    data={chartData}
                    dataKey="volume"
                    chartType="area"
                    delay={0.2 + idx * 0.05}
                  />
                )}

                {/* Max Weight Chart if weights are tracked */}
                {hasWeight && (
                  <ChartSection
                    title="Max Weight per Session"
                    data={chartData}
                    dataKey="maxWeight"
                    chartType="line"
                    delay={0.3 + idx * 0.05}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
