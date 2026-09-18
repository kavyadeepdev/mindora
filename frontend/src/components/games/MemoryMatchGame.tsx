import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Clock, ArrowLeft, Volume2, CheckCircle2, XCircle } from 'lucide-react';
import { GameResultModal } from './GameResultModal';
import { AdaptiveDifficultyEngine, AdaptiveResult } from '../../services/adaptiveEngine';
import { StorageService } from '../../services/storage';
import { AudioSpeechService } from '../../services/audioSpeech';
import { Language } from '../../types';
import { getTranslation, getObjectTranslation } from '../../utils/translations';

interface MemoryMatchGameProps {
  onBack: () => void;
  language: Language;
  onFinishGame?: () => void;
  roundsCount?: number;
}

interface CardItem {
  id: string;
  emoji: string;
  color: string;
}

// 22 Universal & Everyday Familiar Objects (No forced Assam prefix, no bracketed translations)
const OBJECT_POOL: CardItem[] = [
  { id: 'tea', emoji: '🍵', color: 'bg-emerald-50 border-emerald-200' },
  { id: 'house', emoji: '🏡', color: 'bg-amber-50 border-amber-200' },
  { id: 'flower', emoji: '🌸', color: 'bg-rose-50 border-rose-200' },
  { id: 'fish', emoji: '🐟', color: 'bg-sky-50 border-sky-200' },
  { id: 'drum', emoji: '🥁', color: 'bg-orange-50 border-orange-200' },
  { id: 'bell', emoji: '🍲', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'fruit', emoji: '🍎', color: 'bg-red-50 border-red-200' },
  { id: 'lantern', emoji: '🏮', color: 'bg-orange-50 border-orange-200' },
  { id: 'book', emoji: '📖', color: 'bg-blue-50 border-blue-200' },
  { id: 'bicycle', emoji: '🚲', color: 'bg-indigo-50 border-indigo-200' },
  { id: 'mango', emoji: '🥭', color: 'bg-amber-50 border-amber-200' },
  { id: 'clock', emoji: '⏰', color: 'bg-purple-50 border-purple-200' },
  { id: 'fan', emoji: '🪭', color: 'bg-teal-50 border-teal-200' },
  { id: 'glasses', emoji: '👓', color: 'bg-slate-50 border-slate-200' },
  { id: 'walking_stick', emoji: '🦯', color: 'bg-stone-50 border-stone-200' },
  { id: 'bird', emoji: '🐦', color: 'bg-sky-50 border-sky-200' },
  { id: 'tree', emoji: '🌳', color: 'bg-emerald-50 border-emerald-200' },
  { id: 'pot', emoji: '🏺', color: 'bg-amber-50 border-amber-200' },
  { id: 'chair', emoji: '🪑', color: 'bg-stone-50 border-stone-200' },
  { id: 'sun', emoji: '☀️', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'leaf', emoji: '🍃', color: 'bg-lime-50 border-lime-200' },
  { id: 'umbrella', emoji: '☂️', color: 'bg-violet-50 border-violet-200' }
];

interface RoundRecord {
  round: number;
  correct: boolean;
  responseTime: number;
  targetItem: CardItem;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ onBack, language, onFinishGame, roundsCount = 5 }) => {
  const TOTAL_ROUNDS = roundsCount;
  const difficulty = AdaptiveDifficultyEngine.getCurrentDifficulty('memory');
  const cardCount = difficulty >= 3 ? 5 : 4;

  const [currentRound, setCurrentRound] = useState(1);
  const [phase, setPhase] = useState<'memorize' | 'recall' | 'round-feedback' | 'completed'>('memorize');
  const [countdown, setCountdown] = useState(5);
  const [targetItems, setTargetItems] = useState<CardItem[]>([]);
  const [options, setOptions] = useState<CardItem[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<CardItem | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [roundsData, setRoundsData] = useState<RoundRecord[]>([]);

  // Final summary state
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const [finalAvgTime, setFinalAvgTime] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [result, setResult] = useState<AdaptiveResult | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Setup / start game
  useEffect(() => {
    startNewGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [difficulty]);

  const startNewGame = () => {
    setCurrentRound(1);
    setRoundsData([]);
    initRound(1);
  };

  const initRound = (roundNum: number) => {
    // Pick unique items from expanded pool with fresh random ordering
    const shuffled = [...OBJECT_POOL].sort(() => Math.random() - 0.5);
    const selectedTargets = shuffled.slice(0, cardCount);
    const chosenAnswer = selectedTargets[Math.floor(Math.random() * selectedTargets.length)];

    // Pick 3 distractors from the remaining items not in selectedTargets
    const remaining = shuffled.slice(cardCount);
    const distractors = remaining.slice(0, 3);
    const recallOptions = [chosenAnswer, ...distractors].sort(() => Math.random() - 0.5);

    setTargetItems(selectedTargets);
    setCorrectAnswer(chosenAnswer);
    setOptions(recallOptions);
    setPhase('memorize');
    setCountdown(5);
    setSelectedOption(null);
    setIsCorrect(null);

    // Announce with gentle speech
    const promptText = getTranslation('memoryPrompt', language);
    AudioSpeechService.speak(promptText, language);

    // 5-second countdown timer for memorization phase
    let timeLeft = 5;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);
      if (timeLeft <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('recall');
        setStartTime(Date.now());
        const questionText = getTranslation('memoryQuestion', language);
        AudioSpeechService.speak(questionText, language);
      }
    }, 1000);
  };

  const handleSkipCountdown = () => {
    if (phase !== 'memorize') return;
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('recall');
    setStartTime(Date.now());
    const questionText = getTranslation('memoryQuestion', language);
    AudioSpeechService.speak(questionText, language);
  };

  const handleSelectOption = (item: CardItem) => {
    if (phase !== 'recall' || selectedOption !== null) return;

    const timeTaken = Math.max(1.0, parseFloat(((Date.now() - startTime) / 1000).toFixed(1)));
    setSelectedOption(item.id);

    const match = item.id === correctAnswer?.id;
    setIsCorrect(match);
    AudioSpeechService.playChime(match ? 'success' : 'tap');

    const updatedRecord: RoundRecord = {
      round: currentRound,
      correct: match,
      responseTime: timeTaken,
      targetItem: correctAnswer || item
    };

    const nextRoundsData = [...roundsData, updatedRecord];
    setRoundsData(nextRoundsData);

    setPhase('round-feedback');

    setTimeout(() => {
      if (currentRound < TOTAL_ROUNDS) {
        // Proceed to next round
        const nextRoundNum = currentRound + 1;
        setCurrentRound(nextRoundNum);
        initRound(nextRoundNum);
      } else {
        // All 5 rounds completed: Calculate accurate metrics across all 5 rounds
        finishGame(nextRoundsData);
      }
    }, 1200);
  };

  const finishGame = (completedRounds: RoundRecord[]) => {
    // Mathematically exact calculations based on actual player actions across all 5 rounds
    const correctCount = completedRounds.filter(r => r.correct).length;
    const exactAccuracy = Math.round((correctCount / TOTAL_ROUNDS) * 100);

    const totalTime = completedRounds.reduce((acc, r) => acc + r.responseTime, 0);
    const avgResponseTime = Number((totalTime / TOTAL_ROUNDS).toFixed(1));

    // Score based on genuine accuracy and reasonable response time
    const speedBonus = Math.max(0, Math.round((10 - avgResponseTime) * 2));
    const calculatedScore = Math.max(0, Math.min(100, Math.round(exactAccuracy * 0.8 + speedBonus)));

    setFinalAccuracy(exactAccuracy);
    setFinalAvgTime(avgResponseTime);
    setFinalScore(calculatedScore);

    // Evaluate adaptive difficulty with genuine metrics
    const adapt = AdaptiveDifficultyEngine.evaluatePerformance('memory', exactAccuracy, avgResponseTime, 1);
    setResult(adapt);

    // Save persistent session record
    const nowStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    StorageService.addSession({
      id: `sess-${Date.now()}`,
      patientId: 'patient-anima-01',
      gameType: 'memory',
      gameTitle: 'Memory Match',
      score: calculatedScore,
      accuracy: exactAccuracy,
      responseTime: avgResponseTime,
      attempts: 1,
      difficulty,
      timestamp: new Date().toISOString(),
      dateFormatted: nowStr,
      completed: true,
      synced: !StorageService.isOffline(),
      notes: `Completed 5 rounds: ${correctCount}/${TOTAL_ROUNDS} correct (${exactAccuracy}% accuracy), avg response ${avgResponseTime}s.`
    });

    setPhase('completed');
    if (onFinishGame) onFinishGame();
  };

  const getItemLabel = (item: CardItem) => {
    return getObjectTranslation(item.id, language);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Top Bar with Back button and Round Progress */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
        <button
          id="memory-game-back-btn"
          onClick={onBack}
          className="px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-stone-700 font-bold text-sm hover:bg-stone-50 flex items-center gap-2 shadow-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{getTranslation('backToActivities', language)}</span>
        </button>

        {/* 5-Round Progress Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-2xl">
            <span className="text-xs font-extrabold text-stone-800">
              {getTranslation('round', language)} {currentRound} {getTranslation('of', language)} {TOTAL_ROUNDS}
            </span>
            <div className="flex items-center gap-1 ml-1.5">
              {Array.from({ length: TOTAL_ROUNDS }).map((_, idx) => {
                const roundIdx = idx + 1;
                const past = roundsData[idx];
                const isCurrent = roundIdx === currentRound && phase !== 'completed';

                let dotColor = 'bg-stone-300';
                if (past) {
                  dotColor = past.correct ? 'bg-emerald-500' : 'bg-rose-400';
                } else if (isCurrent) {
                  dotColor = 'bg-amber-600 ring-2 ring-amber-300';
                }

                return (
                  <span
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${dotColor}`}
                    title={`Round ${roundIdx}`}
                  />
                );
              })}
            </div>
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-2xl flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            Level {difficulty}
          </span>

          <button
            onClick={() => {
              const msg = phase === 'memorize' ? getTranslation('memoryPrompt', language) : getTranslation('memoryQuestion', language);
              AudioSpeechService.speak(msg, language);
            }}
            className="p-2.5 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
            title="Read instructions aloud"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Game Stage */}
      {phase === 'memorize' && (
        <div className="text-center py-6 sm:py-8 animate-in fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 font-bold text-sm mb-4 border border-amber-200">
            <Clock className="w-4 h-4 text-amber-700 animate-spin" />
            <span>{getTranslation('memorizeTime', language)} ({countdown} {getTranslation('seconds', language)})</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit'] mb-2">
            {getTranslation('memoryPrompt', language)}
          </h1>
          <p className="text-stone-600 text-sm sm:text-base max-w-md mx-auto mb-6">
            Take a calm look at these everyday objects. They will be hidden shortly.
          </p>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 max-w-3xl mx-auto">
            {targetItems.map((item) => (
              <div
                key={item.id}
                className={`p-5 sm:p-6 rounded-3xl border-2 ${item.color} shadow-sm flex flex-col items-center justify-center transform hover:scale-102 transition`}
              >
                <div className="text-6xl sm:text-7xl mb-2 drop-shadow-xs">{item.emoji}</div>
                <div className="font-bold text-stone-800 text-base sm:text-lg">
                  {getItemLabel(item)}
                </div>
              </div>
            ))}
          </div>

          {/* Countdown Progress & Early Ready Button */}
          <div className="max-w-md mx-auto mt-8 flex flex-col items-center gap-3">
            <div className="w-full bg-stone-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-amber-600 h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(countdown / 5) * 100}%` }}
              />
            </div>
            <button
              onClick={handleSkipCountdown}
              className="text-xs font-semibold text-stone-600 hover:text-amber-800 underline cursor-pointer"
            >
              I am ready now →
            </button>
          </div>
        </div>
      )}

      {(phase === 'recall' || phase === 'round-feedback') && (
        <div className="text-center py-6 sm:py-8 animate-in fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 font-bold text-sm mb-4 border border-amber-200">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>{getTranslation('recallTime', language)}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit'] mb-2">
            {getTranslation('memoryQuestion', language)}
          </h1>
          <p className="text-stone-600 text-sm sm:text-base max-w-md mx-auto mb-6">
            Tap the object you remember seeing in the group above.
          </p>

          {/* 4 Choices */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {options.map((item) => {
              const isSelected = selectedOption === item.id;
              const isTargetCorrect = item.id === correctAnswer?.id;

              let btnStyle = 'bg-white border-2 border-stone-200 hover:border-amber-400 hover:bg-amber-50/50';
              if (selectedOption !== null) {
                if (isSelected) {
                  btnStyle = isCorrect
                    ? 'bg-emerald-100 border-2 border-emerald-500 ring-4 ring-emerald-200'
                    : 'bg-rose-100 border-2 border-rose-500 ring-4 ring-rose-200';
                } else if (isTargetCorrect) {
                  btnStyle = 'bg-emerald-50 border-2 border-emerald-300 ring-2 ring-emerald-200';
                } else {
                  btnStyle = 'opacity-50 border-stone-200 bg-stone-50';
                }
              }

              return (
                <button
                  key={item.id}
                  id={`memory-choice-${item.id}`}
                  onClick={() => handleSelectOption(item)}
                  disabled={selectedOption !== null}
                  className={`p-6 rounded-3xl cursor-pointer transition transform active:scale-95 shadow-sm flex flex-col items-center justify-center min-h-[160px] ${btnStyle}`}
                >
                  <div className="text-6xl sm:text-7xl mb-3">{item.emoji}</div>
                  <div className="font-bold text-stone-900 text-base sm:text-lg">
                    {getItemLabel(item)}
                  </div>
                  {isSelected && (
                    <div className="mt-2 flex items-center gap-1 text-xs font-extrabold">
                      {isCorrect ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> {getTranslation('correct', language)}
                        </span>
                      ) : (
                        <span className="text-rose-700 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Keep going!
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {phase === 'round-feedback' && currentRound < TOTAL_ROUNDS && (
            <p className="mt-6 text-xs text-stone-500 font-semibold animate-pulse">
              {getTranslation('tryNext', language)}...
            </p>
          )}
        </div>
      )}

      {/* Result Modal upon completing 5 rounds */}
      {phase === 'completed' && result && (
        <GameResultModal
          gameType="memory"
          gameTitle="Memory Match"
          score={finalScore}
          accuracy={finalAccuracy}
          responseTime={finalAvgTime}
          adaptiveResult={result}
          isOffline={StorageService.isOffline()}
          onPlayAgain={startNewGame}
          onReturnHome={onBack}
        />
      )}
    </div>
  );
};
