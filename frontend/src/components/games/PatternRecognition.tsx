import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft, Volume2, HelpCircle } from 'lucide-react';
import { GameResultModal } from './GameResultModal';
import { AdaptiveDifficultyEngine, AdaptiveResult } from '../../services/adaptiveEngine';
import { StorageService } from '../../services/storage';
import { AudioSpeechService } from '../../services/audioSpeech';
import { Language } from '../../types';

interface PatternRecognitionProps {
  onBack: () => void;
  language: Language;
  onFinishGame?: () => void;
}

interface PatternSequence {
  sequence: { emoji: string; label: string }[];
  correctNext: { emoji: string; label: string };
  options: { emoji: string; label: string }[];
  patternRule: string;
}

const PATTERNS: PatternSequence[] = [
  {
    sequence: [
      { emoji: '🟠', label: 'Orange Circle' },
      { emoji: '🔵', label: 'Blue Circle' },
      { emoji: '🟠', label: 'Orange Circle' },
      { emoji: '🔵', label: 'Blue Circle' }
    ],
    correctNext: { emoji: '🟠', label: 'Orange Circle' },
    options: [
      { emoji: '🟠', label: 'Orange Circle' },
      { emoji: '🔵', label: 'Blue Circle' },
      { emoji: '🟢', label: 'Green Circle' }
    ],
    patternRule: 'Orange, Blue alternating rhythm'
  },
  {
    sequence: [
      { emoji: '🌸', label: 'Kopou Orchid' },
      { emoji: '🍃', label: 'Tea Leaf' },
      { emoji: '🌸', label: 'Kopou Orchid' },
      { emoji: '🍃', label: 'Tea Leaf' }
    ],
    correctNext: { emoji: '🌸', label: 'Kopou Orchid' },
    options: [
      { emoji: '🌸', label: 'Kopou Orchid' },
      { emoji: '🍃', label: 'Tea Leaf' },
      { emoji: '🍎', label: 'Apple' }
    ],
    patternRule: 'Assam Flower, Leaf alternating motif'
  },
  {
    sequence: [
      { emoji: '🧣', label: 'Gamosa Red' },
      { emoji: '🧣', label: 'Gamosa Red' },
      { emoji: '🍵', label: 'Tea Cup' },
      { emoji: '🧣', label: 'Gamosa Red' },
      { emoji: '🧣', label: 'Gamosa Red' }
    ],
    correctNext: { emoji: '🍵', label: 'Tea Cup' },
    options: [
      { emoji: '🍵', label: 'Tea Cup' },
      { emoji: '🧣', label: 'Gamosa Red' },
      { emoji: '🥁', label: 'Dhol' }
    ],
    patternRule: 'Two Gamosas, One Tea cup pattern'
  }
];

export const PatternRecognition: React.FC<PatternRecognitionProps> = ({ onBack, language, onFinishGame }) => {
  const difficulty = AdaptiveDifficultyEngine.getCurrentDifficulty('pattern');
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState<AdaptiveResult | null>(null);
  const [finalMetrics, setFinalMetrics] = useState({ accuracy: 0, responseTime: 0, score: 0 });

  useEffect(() => {
    initRound();
  }, [difficulty]);

  const initRound = () => {
    // Pick pattern based on difficulty
    const idx = Math.min(difficulty - 1, PATTERNS.length - 1);
    setCurrentPatternIndex(Math.max(0, idx));
    setSelectedOption(null);
    setIsCorrect(null);
    setCompleted(false);
    setStartTime(Date.now());

    AudioSpeechService.speak('Look at the sequence. What comes next at the question mark?', language);
  };

  const pattern = PATTERNS[currentPatternIndex] || PATTERNS[0];

  const handleSelect = (option: { emoji: string; label: string }) => {
    if (selectedOption !== null || completed) return;

    const timeTaken = Math.max(1.2, parseFloat(((Date.now() - startTime) / 1000).toFixed(1)));
    setSelectedOption(option.emoji);

    const match = option.emoji === pattern.correctNext.emoji;
    setIsCorrect(match);

    AudioSpeechService.playChime(match ? 'success' : 'tap');

    const accuracy = match ? 95 : 40;
    const score = match ? Math.round(100 - timeTaken * 2) : 35;

    setTimeout(() => {
      const adapt = AdaptiveDifficultyEngine.evaluatePerformance('pattern', accuracy, timeTaken, 1);
      setResult(adapt);
      setFinalMetrics({ accuracy, responseTime: timeTaken, score });

      const nowStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      StorageService.addSession({
        id: `sess-${Date.now()}`,
        patientId: 'patient-anima-01',
        gameType: 'pattern',
        gameTitle: 'Pattern Recognition (Traditional Weave)',
        score,
        accuracy,
        responseTime: timeTaken,
        attempts: 1,
        difficulty,
        timestamp: new Date().toISOString(),
        dateFormatted: nowStr,
        completed: true,
        synced: !StorageService.isOffline(),
        notes: `Selected ${option.label} in ${timeTaken}s. Result: ${match ? 'Correct' : 'Incorrect'}.`
      });

      setCompleted(true);
      if (onFinishGame) onFinishGame();
    }, 900);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
        <button
          id="pattern-game-back-btn"
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
            onClick={() => AudioSpeechService.speak('Look at the pattern sequence. Which one comes next?', language)}
            className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition"
            title="Read instructions aloud"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Pattern Stage */}
      <div className="text-center py-4">
        <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs mb-3 border border-amber-200">
          Pattern Sequence
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 font-['Outfit'] mb-2">
          What comes next?
        </h1>
        <p className="text-stone-600 text-base max-w-md mx-auto mb-8">
          Follow the rhythm from left to right, then tap the missing item.
        </p>

        {/* The Sequence Display */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 p-6 sm:p-8 bg-stone-100/90 rounded-3xl border-2 border-stone-200/80 max-w-2xl mx-auto mb-10 shadow-inner">
          {pattern.sequence.map((item, idx) => (
            <div
              key={idx}
              className="w-16 h-16 sm:w-22 sm:h-22 rounded-2xl bg-white border-2 border-stone-200 shadow-sm flex items-center justify-center text-4xl sm:text-5xl transform hover:scale-105 transition"
            >
              {item.emoji}
            </div>
          ))}

          {/* Missing Item Question Mark */}
          <div className="w-16 h-16 sm:w-22 sm:h-22 rounded-2xl bg-amber-100 border-2 border-dashed border-amber-400 flex items-center justify-center text-3xl sm:text-4xl font-extrabold text-amber-800 animate-pulse">
            ?
          </div>
        </div>

        {/* Options to Choose From */}
        <div className="max-w-md mx-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
            Choose the correct next item:
          </h3>

          <div className="grid grid-cols-3 gap-4">
            {pattern.options.map((opt, idx) => {
              const isSelected = selectedOption === opt.emoji;
              let btnStyle = 'bg-white border-2 border-stone-200 hover:border-amber-400 hover:bg-amber-50/50';

              if (isSelected) {
                btnStyle = isCorrect
                  ? 'bg-emerald-100 border-2 border-emerald-500 ring-4 ring-emerald-200'
                  : 'bg-rose-100 border-2 border-rose-500 ring-4 ring-rose-200';
              }

              return (
                <button
                  key={idx}
                  id={`pattern-choice-${idx}`}
                  onClick={() => handleSelect(opt)}
                  disabled={selectedOption !== null}
                  className={`p-5 rounded-2xl cursor-pointer transition transform active:scale-95 shadow-sm flex flex-col items-center justify-center min-h-[120px] ${btnStyle}`}
                >
                  <div className="text-5xl sm:text-6xl mb-2">{opt.emoji}</div>
                  <div className="text-xs font-bold text-stone-700">{opt.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {completed && result && (
        <GameResultModal
          gameType="pattern"
          gameTitle="Pattern Recognition"
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
