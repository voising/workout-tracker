import { useState } from 'react';
import { Download, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { storage } from '@/services/storage';
import { motion, AnimatePresence } from 'framer-motion';

interface ImportExportProps {
  onDataChange: () => void;
}

export function ImportExport({ onDataChange }: ImportExportProps) {
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleExport = () => {
    const text = storage.exportAsText();

    // Create a blob and download
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workout-log-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    const text = storage.exportAsText();
    try {
      await navigator.clipboard.writeText(text);
      setImportResult({
        type: 'success',
        message: 'Copied to clipboard!',
      });
      setTimeout(() => setImportResult(null), 3000);
    } catch (error) {
      setImportResult({
        type: 'error',
        message: 'Failed to copy to clipboard',
      });
    }
  };

  const handleImport = () => {
    if (!importText.trim()) {
      setImportResult({
        type: 'error',
        message: 'Please paste some data to import',
      });
      return;
    }

    const result = storage.importFromText(importText);
    setImportResult({
      type: result.success ? 'success' : 'error',
      message: result.message,
    });

    if (result.success) {
      setImportText('');
      onDataChange();
      setTimeout(() => setImportResult(null), 5000);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setImportText(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-2xl gradient-text">Export Data</CardTitle>
          <CardDescription className="text-base font-medium">
            Download your workout data as plain text or copy to clipboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={handleExport} className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg" variant="outline">
              <Download className="h-5 w-5 mr-2" />
              Download as Text File
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={handleCopyToClipboard} className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg" variant="outline">
              <FileText className="h-5 w-5 mr-2" />
              Copy to Clipboard
            </Button>
          </motion.div>
        </CardContent>
      </Card>

      <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-2xl gradient-text">Import Data</CardTitle>
          <CardDescription className="text-base font-medium">
            Import workout data from text. Existing workouts on the same date will be merged (UPSERT).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <label className="inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-xl text-base font-bold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-background hover:bg-accent hover:text-accent-foreground h-12 px-4 py-2 w-full cursor-pointer shadow-md hover:shadow-lg">
              <Upload className="h-5 w-5" />
              Upload Text File
              <input
                type="file"
                accept=".txt"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </motion.div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm uppercase font-bold">
              <span className="bg-background px-4 text-muted-foreground">Or paste text</span>
            </div>
          </div>

          <Textarea
            placeholder="Paste your workout data here...

Example format:
Date: 2024-01-15

Pushups
40
40
40

Biceps
10 x 15kg
10 x 15kg

---"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="min-h-[240px] font-mono text-sm rounded-xl focus-visible:ring-2 focus-visible:ring-primary transition-all duration-300 shadow-md"
          />

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={handleImport} className="w-full h-12 gradient-primary shadow-lg hover:shadow-xl transition-all duration-300">
              <Upload className="h-5 w-5 mr-2" />
              <span className="font-bold">Import Data</span>
            </Button>
          </motion.div>

          <AnimatePresence>
            {importResult && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className={`flex items-center gap-3 p-4 rounded-xl shadow-lg ${
                  importResult.type === 'success'
                    ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                    : 'bg-red-500/10 text-red-700 dark:text-red-400'
                }`}
              >
                {importResult.type === 'success' ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <AlertCircle className="h-6 w-6" />
                )}
                <span className="text-base font-bold">{importResult.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
