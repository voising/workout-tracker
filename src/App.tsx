import { useState, useEffect } from 'react';
import { Dumbbell, TrendingUp, Calendar, Settings, Moon, Sun, LayoutGrid, Columns2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { WorkoutLogger } from '@/components/WorkoutLogger';
import { PreviousSessionComparison } from '@/components/PreviousSessionComparison';
import { ProgressCharts } from '@/components/ProgressCharts';
import { WorkoutHeatmap } from '@/components/WorkoutHeatmap';
import { ImportExport } from '@/components/ImportExport';
import { storage } from '@/services/storage';
import { analytics } from '@/services/analytics';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState('log');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [data, setData] = useState(storage.loadData());
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [isKanbanLayout, setIsKanbanLayout] = useState(() => {
    const saved = localStorage.getItem('layout');
    return saved === 'kanban';
  });

  const refreshData = () => {
    setData(storage.loadData());
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const toggleLayout = () => {
    const newLayout = !isKanbanLayout;
    setIsKanbanLayout(newLayout);
    localStorage.setItem('layout', newLayout ? 'kanban' : 'columns');
  };

  const currentSession = storage.getSessionByDate(selectedDate) || null;
  const previousSession = analytics.getPreviousSession(data.sessions, selectedDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-border/50 glass-effect sticky top-0 z-50 shadow-lg"
      >
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-4"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                className="gradient-primary rounded-2xl p-3 shadow-glow"
                whileHover={{ rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Dumbbell className="h-7 w-7 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight gradient-text">Workout Tracker</h1>
                <p className="text-sm text-muted-foreground font-medium">Track. Progress. Achieve.</p>
              </div>
            </motion.div>
            <div className="flex items-center gap-2">
              {activeTab === 'log' && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden lg:block"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleLayout}
                    className="rounded-full hover:bg-primary/10 transition-all duration-300"
                    title={isKanbanLayout ? "Switch to Column Layout" : "Switch to Kanban Layout"}
                  >
                    {isKanbanLayout ? (
                      <Columns2 className="h-5 w-5 text-primary" />
                    ) : (
                      <LayoutGrid className="h-5 w-5 text-primary" />
                    )}
                  </Button>
                </motion.div>
              )}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-full hover:bg-primary/10 transition-all duration-300"
                >
                  {isDark ? (
                    <Sun className="h-5 w-5 text-primary" />
                  ) : (
                    <Moon className="h-5 w-5 text-primary" />
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className={`container mx-auto px-4 py-8 ${!isKanbanLayout || activeTab !== 'log' ? 'max-w-7xl' : ''}`}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <TabsList className="grid w-full grid-cols-4 mb-8 p-1.5 glass-effect shadow-xl">
              <TabsTrigger value="log" className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                <Dumbbell className="h-4 w-4" />
                <span className="hidden sm:inline font-semibold">Log Workout</span>
                <span className="sm:hidden font-semibold">Log</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline font-semibold">Progress</span>
                <span className="sm:hidden font-semibold">Stats</span>
              </TabsTrigger>
              <TabsTrigger value="streak" className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline font-semibold">Streak</span>
                <span className="sm:hidden font-semibold">Heat</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline font-semibold">Data</span>
                <span className="sm:hidden font-semibold">Data</span>
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <TabsContent value="log" className="space-y-6">
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3 text-foreground">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="w-full sm:w-auto h-12 rounded-xl bg-card px-4 py-2 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-300 shadow-md hover:shadow-lg"
              />
            </div>

            {!isKanbanLayout ? (
              /* Column Layout */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PreviousSessionComparison
                  currentSession={currentSession}
                  previousSession={previousSession}
                />
                <WorkoutLogger
                  selectedDate={selectedDate}
                  existingSession={currentSession}
                  previousSession={previousSession}
                  onSave={refreshData}
                />
              </div>
            ) : (
              /* Kanban Layout - Full width */
              <div className="space-y-6">
                <WorkoutLogger
                  selectedDate={selectedDate}
                  existingSession={currentSession}
                  previousSession={previousSession}
                  onSave={refreshData}
                  kanbanMode={true}
                />
                <PreviousSessionComparison
                  currentSession={currentSession}
                  previousSession={previousSession}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="progress">
            <ProgressCharts sessions={data.sessions} />
          </TabsContent>

          <TabsContent value="streak">
            <WorkoutHeatmap sessions={data.sessions} />
          </TabsContent>

          <TabsContent value="settings">
            <ImportExport onDataChange={refreshData} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="border-t border-border/50 mt-16 glass-effect"
      >
        <div className="container mx-auto px-4 py-8 text-center">
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="space-y-3"
          >
            <p className="text-base font-bold gradient-text">Built with React, TypeScript, and Tailwind CSS</p>
            <p className="text-sm text-muted-foreground font-medium">All data stored locally in your browser</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <motion.div
                className="h-2 w-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs font-semibold text-primary">Your Privacy, Our Priority</span>
              <motion.div
                className="h-2 w-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
            </div>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}

export default App;
