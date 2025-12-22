import { Dialog, DialogHeader, DialogBody, DialogFooter, Button, Typography, Spinner, Progress } from '@material-tailwind/react';
import { SparklesIcon, XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useRef } from 'react';
import { aiApi } from '../services/api';

export default function AIAnalysisDialog({ open, onClose, activityId, activityName, isProfileAnalysis = false }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    if (open) {
      loadAnalysis();
    } else {
      // Cleanup: reset progress when dialog closes
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setProgress(0);
    }
  }, [open, activityId, isProfileAnalysis]);

  const downloadAnalysis = () => {
    if (!analysis) return;

    const date = new Date().toLocaleDateString('fr-FR');
    const time = new Date().toLocaleTimeString('fr-FR');
    const title = isProfileAnalysis
      ? `Analyse IA - Profil Global`
      : `Analyse IA - ${activityName || 'Activité'}`;

    const content = `${title}\nGénéré le ${date} à ${time}\n\n${'='.repeat(60)}\n\n${analysis}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analyse-ia-${isProfileAnalysis ? 'profil' : 'activite'}-${date.replace(/\//g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loadAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setProgress(0);

    // Simulate progress: gradually increase from 0 to 95% during loading
    // Profile analysis takes longer (10-15s), so we use slower progression
    const isSlowAnalysis = isProfileAnalysis;
    const incrementAmount = isSlowAnalysis ? 3 : 8; // Slower for profile
    const intervalDuration = isSlowAnalysis ? 800 : 500; // Longer intervals for profile
    const stopAt = 95; // Stop at 95% until API responds

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= stopAt) return stopAt;
        return Math.min(prev + incrementAmount, stopAt);
      });
    }, intervalDuration);

    try {
      let result;
      if (isProfileAnalysis) {
        result = await aiApi.analyzeProfile();
      } else {
        result = await aiApi.analyzeActivity(activityId);
      }
      setAnalysis(result.analysis);
      setProgress(100); // Complete the progress
    } catch (err) {
      console.error('Error loading AI analysis:', err);
      setError(err.response?.data?.error || 'Erreur lors de l\'analyse IA');
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setLoading(false);
      // Reset progress after a delay
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const formatAnalysis = (text) => {
    if (!text) return null;

    // Convert markdown-style formatting to HTML
    return text
      .split('\n')
      .map((line, i) => {
        // Headers
        if (line.startsWith('## ')) {
          return <Typography key={i} variant="h5" color="blue-gray" className="mt-4 mb-2 font-bold">{line.slice(3)}</Typography>;
        }
        if (line.startsWith('# ')) {
          return <Typography key={i} variant="h4" color="blue-gray" className="mt-4 mb-2 font-bold">{line.slice(2)}</Typography>;
        }

        // Bold
        if (line.startsWith('**') && line.endsWith('**')) {
          return <Typography key={i} variant="paragraph" className="font-bold mt-2">{line.slice(2, -2)}</Typography>;
        }

        // Bullets
        if (line.startsWith('- ') || line.startsWith('• ')) {
          const content = line.slice(2);
          // Check if it contains bold parts
          const parts = content.split('**');
          return (
            <div key={i} className="flex gap-2 ml-4 mb-1">
              <span className="text-blue-gray-700">•</span>
              <Typography variant="small" color="blue-gray">
                {parts.map((part, j) =>
                  j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                )}
              </Typography>
            </div>
          );
        }

        // Numbers (1. 2. etc.)
        if (line.match(/^\d+\.\s/)) {
          const content = line.replace(/^\d+\.\s/, '');
          const parts = content.split('**');
          return (
            <div key={i} className="flex gap-2 ml-4 mb-1">
              <Typography variant="small" color="blue-gray" className="font-medium">
                {line.match(/^\d+\./)[0]}
              </Typography>
              <Typography variant="small" color="blue-gray">
                {parts.map((part, j) =>
                  j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                )}
              </Typography>
            </div>
          );
        }

        // Empty line
        if (line.trim() === '') {
          return <div key={i} className="h-2" />;
        }

        // Regular text
        const parts = line.split('**');
        return (
          <Typography key={i} variant="paragraph" color="blue-gray" className="mb-2">
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
          </Typography>
        );
      });
  };

  return (
    <Dialog
      open={open}
      handler={onClose}
      size="lg"
      className="bg-white shadow-2xl"
    >
      <DialogHeader className="flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-6 w-6 text-purple-600" />
          <div>
            <Typography variant="h5" color="blue-gray">
              {isProfileAnalysis ? 'Analyse IA - Profil Global' : 'Analyse IA - Activité'}
            </Typography>
            {!isProfileAnalysis && activityName && (
              <Typography variant="small" color="gray" className="font-normal">
                {activityName}
              </Typography>
            )}
          </div>
        </div>
        <Button variant="text" color="gray" onClick={onClose} className="p-2">
          <XMarkIcon className="h-5 w-5" />
        </Button>
      </DialogHeader>

      <DialogBody className="max-h-[70vh] overflow-y-auto p-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 px-8">
            <div className="mb-6">
              <Spinner className="h-12 w-12" color="purple" />
            </div>
            <Typography color="gray" className="mb-4 text-center font-semibold">
              {isProfileAnalysis
                ? 'Analyse IA de votre profil en cours...'
                : 'Analyse IA de votre activité en cours...'}
            </Typography>

            {/* Progress Bar */}
            <div className="w-full max-w-md">
              <Progress
                value={progress}
                color="purple"
                className="mb-2"
              />
              <Typography variant="small" color="gray" className="text-center">
                {progress}% - {
                  isProfileAnalysis
                    ? (progress < 25 ? 'Récupération de votre historique (60 activités)...' :
                       progress < 50 ? 'Calcul des tendances hebdomadaires...' :
                       progress < 75 ? 'Analyse approfondie des patterns...' :
                       progress < 95 ? 'Génération du rapport détaillé...' :
                       'Finalisation...')
                    : (progress < 30 ? 'Récupération des données...' :
                       progress < 60 ? 'Analyse en cours...' :
                       progress < 90 ? 'Génération du feedback...' :
                       'Finalisation...')
                }
              </Typography>
            </div>

            <Typography variant="small" color="gray" className="mt-4 text-center opacity-75">
              L'IA analyse vos métriques en profondeur
            </Typography>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <Typography color="red" className="font-semibold">
              Erreur
            </Typography>
            <Typography variant="small" color="red">
              {error}
            </Typography>
          </div>
        )}

        {!loading && !error && analysis && (
          <div className="prose prose-sm max-w-none">
            <div className="bg-purple-50 border-l-4 border-purple-600 p-4 mb-4 rounded">
              <Typography variant="small" color="purple" className="font-semibold flex items-center gap-2">
                <SparklesIcon className="h-4 w-4" />
                Coach IA - Analyse stricte et exigeante
              </Typography>
              <Typography variant="small" color="gray" className="mt-1">
                Feedback factuel basé sur vos données réelles
              </Typography>
            </div>

            <div className="space-y-1">
              {formatAnalysis(analysis)}
            </div>
          </div>
        )}

        {!loading && !error && !analysis && (
          <Typography color="gray" className="text-center py-8">
            Aucune analyse disponible
          </Typography>
        )}
      </DialogBody>

      <DialogFooter className="border-t border-gray-200 flex items-center justify-between">
        <Button variant="text" color="gray" onClick={onClose}>
          Fermer
        </Button>
        <div className="flex gap-2">
          {analysis && (
            <>
              <Button
                variant="outlined"
                color="purple"
                onClick={downloadAnalysis}
                className="flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Télécharger
              </Button>
              <Button
                variant="gradient"
                color="purple"
                onClick={loadAnalysis}
                className="flex items-center gap-2"
              >
                <SparklesIcon className="h-4 w-4" />
                Régénérer
              </Button>
            </>
          )}
        </div>
      </DialogFooter>
    </Dialog>
  );
}
