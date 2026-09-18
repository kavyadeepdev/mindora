import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft, Volume2, CheckCircle2, RotateCcw } from 'lucide-react';
import { GameResultModal } from './GameResultModal';
import { AdaptiveDifficultyEngine, AdaptiveResult } from '../../services/adaptiveEngine';
import { StorageService } from '../../services/storage';
import { AudioSpeechService } from '../../services/audioSpeech';
import { Language } from '../../types';

interface RoutineRecallGameProps {
  onBack: () => void;
  language: Language;
  onFinishGame?: () => void;
}

interface RoutineStep {
  id: string;
  stepNumber: number;
  title: string;
  titleAssamese: string;
  titleHindi: string;
  emoji: string;
}

const CORRECT_ROUTINE: RoutineStep[] = [
  { id: 'step-1', stepNumber: 1, title: 'Wake up peacefully', titleAssamese: 'পুৱা শান্তভাৱে সাৰ পোৱা', titleHindi: 'सुबह शांति से जागना', emoji: '🌅' },
  { id: 'step-2', stepNumber: 2, title: 'Drink fresh water', titleAssamese: 'এক গিলাচ পানী খোৱা', titleHindi: 'एक गिलास पानी पीना', emoji: '💧' },
  { id: 'step-3', stepNumber: 3, title: 'Take morning medicine', titleAssamese: 'পুৱাৰ ঔষধ গ্ৰহণ', titleHindi: 'सुबह की दवा लेना', emoji: '💊' },
  { id: 'step-4', stepNumber: 4, title: 'Have healthy breakfast', titleAssamese: 'পুৱাৰ জলপান খোৱা', titleHindi: 'पौष्टिक नाश्ता करना', emoji: '🥣' }
];

export const RoutineRecallGame: React.FC<RoutineRecallGameProps> = ({ onBack, language, onFinishGame }) => {
  const difficulty = AdaptiveDifficultyEngine.getCurrentDifficulty('routine');
  const [phase, setPhase] = useState<'study' | 'reconstruct' | 'completed'>('study');
  const [availableSteps, setAvailableSteps] = useState<RoutineStep[]>([]);
  const [userOrderedSteps, setUserOrderedSteps] = useState<RoutineStep[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [result, setResult] = useState<AdaptiveResult | null>(null);
  const [finalMetrics, setFinalMetrics] = useState({ accuracy: 0, responseTime: 0, score: 0 });

  useEffect(() => {
    initRound();
  }, [difficulty]);

  const initRound = () => {
    // Scramble the choices for reconstruction
    const scrambled = [...CORRECT_ROUTINE].sort(() => 0.5 - Math.random());
    setAvailableSteps(scrambled);
    setUserOrderedSteps([]);
    setPhase('study');
    AudioSpeechService.speak("Remember Anima's morning routine in order: Wake up, Drink water, Take medicine, Have breakfast.", language);
  };

  const handleStartReconstruct = () => {
    setPhase('reconstruct');
    setStartTime(Date.now());
    AudioSpeechService.speak('Tap each step in the correct morning order, starting from step 1.', language);
  };

  const handleSelectStep = (step: RoutineStep) => {
    AudioSpeechService.playChime('tap');
    setUserOrderedSteps([...userOrderedSteps, step]);
    setAvailableSteps(availableSteps.filter(s => s.id !== step.id));
  };

  const handleRemoveStep = (step: RoutineStep) => {
    AudioSpeechService.playChime('tap');
    setUserOrderedSteps(userOrderedSteps.filter(s => s.id !== step.id));
    setAvailableSteps([...availableSteps, step]);
  };

  const handleSubmitSequence = () => {
    const timeTaken = Math.max(2.0, parseFloat(((Date.now() - startTime) / 1000).toFixed(1)));

    // Compare user order to correct order
    let correctMatches = 0;
    userOrderedSteps.forEach((step, idx) => {
      if (step.id === CORRECT_ROUTINE[idx]?.id) {
        correctMatches += 1;
      }
    });

    const accuracy = Math.round((correctMatches / CORRECT_ROUTINE.length) * 100);
    const score = Math.max(30, Math.round(accuracy * 0.95 - timeTaken * 1.5));

    const adapt = AdaptiveDifficultyEngine.evaluatePerformance('routine', accuracy, timeTaken, 1);
    setResult(adapt);
    setFinalMetrics({ accuracy, responseTime: timeTaken, score });

    const nowStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    StorageService.addSession({
      id: `sess-${Date.now()}`,
      patientId: 'patient-anima-01',
      gameType: 'routine',
      gameTitle: 'Daily Routine Recall (Morning Steps)',
      score,
      accuracy,
      responseTime: timeTaken,
      attempts: 1,
      difficulty,
      timestamp: new Date().toISOString(),
      dateFormatted: nowStr,
      completed: true,
      synced: !StorageService.isOffline(),
      notes: `Reconstructed ${correctMatches}/4 morning steps in ${timeTaken}s.`
    });

    setPhase('completed');
    if (onFinishGame) onFinishGame();
  };

  const getStepText = (step: RoutineStep) => {
    if (language === 'as') return step.titleAssamese;
    if (language === 'hi') return step.titleHindi;
    return step.title;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
        <button
          id="routine-game-back-btn"
          onClick={onBack}
          className="px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-stone-700 font-bold text-sm hover:bg-stone-50 flex items-center gap-2 shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Activities</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            Adaptive Level {difficulty}
          </span>
          <button
            onClick={() => AudioSpeechService.speak(phase === 'study' ? "Anima's morning routine" : 'Tap each step in the correct morning order.', language)}
            className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition"
            title="Read instructions aloud"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PHASE 1: STUDY ROUTINE */}
      {phase === 'study' && (
        <div className="text-center py-4 animate-in fade-in">
          <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs mb-3 border border-amber-200">
            Memory Assistance & Routine Link
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 font-['Outfit'] mb-2">
            Anima's Morning Routine
          </h1>
          <p className="text-stone-600 text-base max-w-md mx-auto mb-8">
            Remember this natural sequence of your daily morning steps:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
            {CORRECT_ROUTINE.map((step) => (
              <div
                key={step.id}
                className="bg-white border-2 border-amber-200/80 rounded-3xl p-5 shadow-xs flex flex-col items-center text-center relative"
              >
                <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center">
                  {step.stepNumber}
                </div>
                <div className="text-5xl sm:text-6xl mb-3 mt-2">{step.emoji}</div>
                <h2 className="font-bold text-stone-900 text-base mb-1">{getStepText(step)}</h2>
              </div>
            ))}
          </div>

          <button
            id="routine-ready-btn"
            onClick={handleStartReconstruct}
            className="py-4 px-8 rounded-2xl bg-amber-600 text-white font-extrabold text-lg hover:bg-amber-700 transition shadow-lg cursor-pointer inline-flex items-center gap-2"
          >
            <span>I am ready to arrange →</span>
          </button>
        </div>
      )}

      {/* PHASE 2: RECONSTRUCT ROUTINE */}
      {phase === 'reconstruct' && (
        <div className="text-center py-4 animate-in fade-in">
          <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs mb-3 border border-amber-200">
            Reconstruct Sequence
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 font-['Outfit'] mb-2">
            Arrange in the correct order
          </h1>
          <p className="text-stone-600 text-base max-w-md mx-auto mb-6">
            Tap each card in order from 1 to 4. Tap an arranged card to undo.
          </p>

          {/* Arranged Slots */}
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
              Your Arranged Routine ({userOrderedSteps.length} of 4 placed):
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {[0, 1, 2, 3].map((slotIdx) => {
                const placed = userOrderedSteps[slotIdx];
                return (
                  <div
                    key={slotIdx}
                    onClick={() => placed && handleRemoveStep(placed)}
                    className={`min-h-[120px] rounded-2xl p-3 border-2 flex flex-col items-center justify-center transition cursor-pointer ${
                      placed
                        ? 'bg-amber-50/80 border-amber-400 shadow-xs'
                        : 'bg-stone-100/60 border-dashed border-stone-300'
                    }`}
                  >
                    <div className="text-xs font-bold text-stone-400 mb-1">
                      Step {slotIdx + 1}
                    </div>
                    {placed ? (
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{placed.emoji}</span>
                        <span className="text-xs font-bold text-stone-800 text-left">
                          {getStepText(placed)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-stone-400 text-xs font-medium">Tap card below</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Available Cards */}
          {availableSteps.length > 0 ? (
            <div className="max-w-2xl mx-auto mb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                Tap to place next:
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {availableSteps.map((step) => (
                  <button
                    key={step.id}
                    id={`routine-card-${step.id}`}
                    onClick={() => handleSelectStep(step)}
                    className="p-4 rounded-2xl bg-white border-2 border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 shadow-xs flex flex-col items-center justify-center transition cursor-pointer"
                  >
                    <div className="text-4xl mb-2">{step.emoji}</div>
                    <div className="font-bold text-stone-800 text-xs">{getStepText(step)}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-sm mx-auto mb-8">
              <button
                id="routine-submit-btn"
                onClick={handleSubmitSequence}
                className="w-full py-4 px-6 rounded-2xl bg-amber-600 text-white font-extrabold text-lg hover:bg-amber-700 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Submit My Routine →</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Result Modal */}
      {phase === 'completed' && result && (
        <GameResultModal
          gameType="routine"
          gameTitle="Daily Routine Recall"
          score={finalMetrics.score}
          accuracy={finalMetrics.accuracy}
          responseTime={finalMetrics.responseTime}
          adaptiveResult={result}
          isOffline={StorageService.isOffline()}
          onPlayAgain={initRound}
          onReturnHome={onBack}
        />
      )}
    </div>
  );
};
