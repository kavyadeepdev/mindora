import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft, Volume2, CheckCircle2 } from 'lucide-react';
import { GameResultModal } from './GameResultModal';
import { AdaptiveDifficultyEngine, AdaptiveResult } from '../../services/adaptiveEngine';
import { StorageService } from '../../services/storage';
import { AudioSpeechService } from '../../services/audioSpeech';
import { Language } from '../../types';

interface AttentionChallengeProps {
  onBack: () => void;
  language: Language;
  onFinishGame?: () => void;
}

interface AttentionItem {
  id: string;
  name: string;
  emoji: string;
  isRed: boolean;
  colorName: string;
}

const ATTENTION_POOL: AttentionItem[] = [
  { id: 'red-gamosa', name: 'Red Gamosa Border', emoji: '🧣', isRed: true, colorName: 'Red' },
  { id: 'red-apple', name: 'Red Pomegranate / Fruit', emoji: '🍎', isRed: true, colorName: 'Red' },
  { id: 'red-flower', name: 'Red Hibiscus (জবা ফুল)', emoji: '🌺', isRed: true, colorName: 'Red' },
  { id: 'red-ribbon', name: 'Red Bihu Ribbon', emoji: '🎀', isRed: true, colorName: 'Red' },
  { id: 'green-leaf', name: 'Green Tea Leaf', emoji: '🍃', isRed: false, colorName: 'Green' },
  { id: 'yellow-orchid', name: 'Yellow Marigold', emoji: '🌼', isRed: false, colorName: 'Yellow' },
  { id: 'blue-pot', name: 'Blue River Pot', emoji: '🏺', isRed: false, colorName: 'Blue' },
  { id: 'tea-cup', name: 'Green Tea Cup', emoji: '🍵', isRed: false, colorName: 'Green' }
];

export const AttentionChallenge: React.FC<AttentionChallengeProps> = ({ onBack, language, onFinishGame }) => {
  const difficulty = AdaptiveDifficultyEngine.getCurrentDifficulty('attention');
  const totalItemsCount = difficulty >= 3 ? 8 : 6;

  const [items, setItems] = useState<AttentionItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState<AdaptiveResult | null>(null);
  const [finalMetrics, setFinalMetrics] = useState({ accuracy: 0, responseTime: 0, score: 0 });

  useEffect(() => {
    initRound();
  }, [difficulty]);

  const initRound = () => {
    // Pick items ensuring 3 or 4 red items
    const reds = ATTENTION_POOL.filter(i => i.isRed).slice(0, 3);
    const nonReds = ATTENTION_POOL.filter(i => !i.isRed).slice(0, totalItemsCount - reds.length);
    const mixed = [...reds, ...nonReds].sort(() => 0.5 - Math.random());

    setItems(mixed);
    setSelectedIds([]);
    setCompleted(false);
    setStartTime(Date.now());

    AudioSpeechService.speak('Tap all the red objects on the screen.', language);
  };

  const handleTap = (item: AttentionItem) => {
    if (completed) return;
    AudioSpeechService.playChime(item.isRed ? 'tap' : 'tap');

    let updated: string[];
    if (selectedIds.includes(item.id)) {
      updated = selectedIds.filter(id => id !== item.id);
    } else {
      updated = [...selectedIds, item.id];
    }
    setSelectedIds(updated);

    // Check if all red objects found
    const redItems = items.filter(i => i.isRed);
    const allRedsFound = redItems.every(r => updated.includes(r.id));
    const noMistakes = updated.every(id => items.find(i => i.id === id)?.isRed);

    if (allRedsFound && noMistakes) {
      finishGame(updated);
    }
  };

  const finishGame = (currentSelections = selectedIds) => {
    const timeTaken = Math.max(1.5, parseFloat(((Date.now() - startTime) / 1000).toFixed(1)));
    const redItems = items.filter(i => i.isRed);
    const correctlyTappedReds = currentSelections.filter(id => items.find(i => i.id === id)?.isRed).length;
    const mistakenlyTappedOthers = currentSelections.filter(id => !items.find(i => i.id === id)?.isRed).length;

    // Accuracy calculation
    let acc = Math.round((correctlyTappedReds / redItems.length) * 100 - mistakenlyTappedOthers * 15);
    acc = Math.max(20, Math.min(100, acc));

    const score = Math.max(30, Math.round(acc * 0.9 - timeTaken * 1.5));

    const adapt = AdaptiveDifficultyEngine.evaluatePerformance('attention', acc, timeTaken, 1);
    setResult(adapt);
    setFinalMetrics({ accuracy: acc, responseTime: timeTaken, score });

    const nowStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    StorageService.addSession({
      id: `sess-${Date.now()}`,
      patientId: 'patient-anima-01',
      gameType: 'attention',
      gameTitle: 'Attention Challenge (Red Objects)',
      score,
      accuracy: acc,
      responseTime: timeTaken,
      attempts: 1,
      difficulty,
      timestamp: new Date().toISOString(),
      dateFormatted: nowStr,
      completed: true,
      synced: !StorageService.isOffline(),
      notes: `Identified ${correctlyTappedReds}/${redItems.length} red objects in ${timeTaken}s.`
    });

    setCompleted(true);
    if (onFinishGame) onFinishGame();
  };

  const redCount = items.filter(i => i.isRed).length;
  const foundReds = selectedIds.filter(id => items.find(i => i.id === id)?.isRed).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
        <button
          id="attention-game-back-btn"
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
            onClick={() => AudioSpeechService.speak('Tap all the red objects on the screen.', language)}
            className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition"
            title="Read instructions aloud"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Instruction */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-rose-100 text-rose-900 font-bold text-xs mb-3 border border-rose-200">
          Target Goal: Color Attention
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 font-['Outfit'] mb-2">
          Tap all the <span className="text-rose-700 underline decoration-rose-400">red objects</span>
        </h1>
        <p className="text-stone-600 text-base max-w-md mx-auto">
          Found <strong className="text-rose-700">{foundReds}</strong> of {redCount} red items. Tap any item to select or unselect.
        </p>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
        {items.map((item) => {
          const isSelected = selectedIds.includes(item.id);

          return (
            <button
              key={item.id}
              id={`attention-item-${item.id}`}
              onClick={() => handleTap(item)}
              className={`p-6 rounded-3xl cursor-pointer transition transform active:scale-95 shadow-sm flex flex-col items-center justify-center min-h-[160px] relative border-3 ${
                isSelected
                  ? 'bg-rose-50 border-rose-500 ring-4 ring-rose-200 scale-102'
                  : 'bg-white border-stone-200 hover:border-amber-300 hover:bg-stone-50'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 text-rose-600">
                  <CheckCircle2 className="w-6 h-6 fill-rose-100" />
                </div>
              )}
              <div className="text-6xl sm:text-7xl mb-3">{item.emoji}</div>
              <div className="font-bold text-stone-800 text-base text-center">
                {item.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="text-center max-w-sm mx-auto">
        <button
          id="attention-finish-btn"
          onClick={() => finishGame()}
          className="w-full py-4 px-6 rounded-2xl bg-amber-600 text-white font-extrabold text-lg hover:bg-amber-700 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>I found them all →</span>
        </button>
      </div>

      {/* Result Modal */}
      {completed && result && (
        <GameResultModal
          gameType="attention"
          gameTitle="Attention Challenge"
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
