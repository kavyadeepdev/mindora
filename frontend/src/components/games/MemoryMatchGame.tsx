import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Clock, ArrowLeft, Volume2 } from 'lucide-react';
import { GameResultModal } from './GameResultModal';
import { AdaptiveDifficultyEngine, AdaptiveResult } from '../../services/adaptiveEngine';
import { StorageService } from '../../services/storage';
import { AudioSpeechService } from '../../services/audioSpeech';
import { Language } from '../../types';

interface MemoryMatchGameProps {
  onBack: () => void;
  language: Language;
  onFinishGame?: () => void;
}

interface CardItem {
  id: string;
  name: string;
  nameAssamese: string;
  nameHindi: string;
  emoji: string;
  color: string;
}

const ALL_CULTURAL_OBJECTS: CardItem[] = [
  { id: 'orchid', name: 'Kopou Orchid', nameAssamese: 'কপৌ ফুল', nameHindi: 'ऑर्किड फूल', emoji: '🌸', color: 'bg-rose-50 border-rose-200' },
  { id: 'cottage', name: 'Assam Cottage', nameAssamese: 'বাঁহৰ ঘৰ', nameHindi: 'असमिया कुटीर', emoji: '🏡', color: 'bg-amber-50 border-amber-200' },
  { id: 'fish', name: 'River Fish', nameAssamese: 'ইলিচ/ৰৌ মাছ', nameHindi: 'नदी की मछली', emoji: '🐟', color: 'bg-sky-50 border-sky-200' },
  { id: 'tea', name: 'Assam Tea Cup', nameAssamese: 'চাহৰ কাপ', nameHindi: 'असमिया चाय', emoji: '🍵', color: 'bg-emerald-50 border-emerald-200' },
  { id: 'dhol', name: 'Bihu Dhol', nameAssamese: 'বিহু ঢোল', nameHindi: 'बिहू ढोल', emoji: '🥁', color: 'bg-orange-50 border-orange-200' },
  { id: 'gamosa', name: 'Red Gamosa', nameAssamese: 'ফুলাম গামোচা', nameHindi: 'गामोसा दुपट्टा', emoji: '🧣', color: 'bg-red-50 border-red-200' },
  { id: 'apple', name: 'Fresh Fruit', nameAssamese: 'মিঠা ফল', nameHindi: 'ताजा फल', emoji: '🍎', color: 'bg-red-50 border-red-200' },
  { id: 'bell', name: 'Bell Metal Pot', nameAssamese: 'কাঁহৰ কলহ', nameHindi: 'पीतल का बर्तन', emoji: '🍲', color: 'bg-yellow-50 border-yellow-200' }
];

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ onBack, language, onFinishGame }) => {
  const difficulty = AdaptiveDifficultyEngine.getCurrentDifficulty('memory');
  const cardCount = difficulty >= 3 ? 5 : 4;

  const [phase, setPhase] = useState<'memorize' | 'recall' | 'completed'>('memorize');
  const [countdown, setCountdown] = useState(5);
  const [targetItems, setTargetItems] = useState<CardItem[]>([]);
  const [options, setOptions] = useState<CardItem[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<CardItem | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(1);
  const [startTime, setStartTime] = useState<number>(0);
  const [responseTime, setResponseTime] = useState<number>(0);
  const [result, setResult] = useState<AdaptiveResult | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Setup game rounds
  useEffect(() => {
    initRound();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [difficulty]);

  const initRound = () => {
    // Pick unique items
    const shuffled = [...ALL_CULTURAL_OBJECTS].sort(() => 0.5 - Math.random());
    const selectedTargets = shuffled.slice(0, cardCount);
    const chosenAnswer = selectedTargets[Math.floor(Math.random() * selectedTargets.length)];

    // Pick 3 distractors not in selectedTargets
    const distractors = shuffled.slice(cardCount).slice(0, 3);
    const recallOptions = [chosenAnswer, ...distractors].sort(() => 0.5 - Math.random());

    setTargetItems(selectedTargets);
    setCorrectAnswer(chosenAnswer);
    setOptions(recallOptions);
    setPhase('memorize');
    setCountdown(5);
    setSelectedOption(null);
    setIsCorrect(null);
    setAttempts(1);

    // Announce with gentle speech if audio enabled
    AudioSpeechService.speak('Look at these familiar objects carefully for 5 seconds.', language);

    // 5 seconds countdown
    let timeLeft = 5;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);
      if (timeLeft <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('recall');
        setStartTime(Date.now());
        AudioSpeechService.speak('Which object was shown earlier? Tap your answer.', language);
      }
    }, 1000);
  };

  const handleSelectOption = (item: CardItem) => {
    if (phase !== 'recall' || selectedOption !== null) return;

    const timeTaken = Math.max(1.2, parseFloat(((Date.now() - startTime) / 1000).toFixed(1)));
    setResponseTime(timeTaken);
    setSelectedOption(item.id);

    const match = item.id === correctAnswer?.id;
    setIsCorrect(match);

    const accuracy = match ? (attempts === 1 ? 100 : 75) : 35;
    const score = match ? Math.round(100 - timeTaken * 2) : 30;

    AudioSpeechService.playChime(match ? 'success' : 'tap');

    setTimeout(() => {
      // Evaluate adaptive difficulty
      const adapt = AdaptiveDifficultyEngine.evaluatePerformance('memory', accuracy, timeTaken, attempts);
      setResult(adapt);

      // Save session
      const nowStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      StorageService.addSession({
        id: `sess-${Date.now()}`,
        patientId: 'patient-anima-01',
        gameType: 'memory',
        gameTitle: `Memory Match (Familiar Objects)`,
        score,
        accuracy,
        responseTime: timeTaken,
        attempts,
        difficulty,
        timestamp: new Date().toISOString(),
        dateFormatted: nowStr,
        completed: true,
        synced: !StorageService.isOffline(),
        notes: `Identified ${correctAnswer?.name} with ${accuracy}% accuracy in ${timeTaken}s.`
      });

      setPhase('completed');
      if (onFinishGame) onFinishGame();
    }, 1000);
  };

  const getItemLabel = (item: CardItem) => {
    if (language === 'as') return item.nameAssamese;
    if (language === 'hi') return item.nameHindi;
    return item.name;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      
      {/* Top Bar with large Back button and Level badge */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
        <button
          id="memory-game-back-btn"
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
            onClick={() => AudioSpeechService.speak(phase === 'memorize' ? 'Memorize these objects for 5 seconds.' : 'Which object was shown earlier?', language)}
            className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition"
            title="Read instructions aloud"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cultural Personalized Theme Banner */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 mb-6 text-xs text-amber-950 flex items-center justify-between">
        <div>
          <span className="font-bold">🌸 Familiar Memories Theme:</span>{' '}
          <span>"Remember these familiar objects from Anima's garden and Assam household"</span>
        </div>
        <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
          Personalized
        </span>
      </div>

      {/* Main Game Stage */}
      {phase === 'memorize' && (
        <div className="text-center py-6 sm:py-10 animate-in fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-100 text-stone-700 font-bold text-sm mb-4 border border-stone-200">
            <Clock className="w-4 h-4 text-amber-600 animate-spin" />
            <span>Memorize for {countdown} seconds</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit'] mb-2">
            Remember these objects carefully
          </h1>
          <p className="text-stone-600 text-base max-w-md mx-auto mb-8">
            Look at each item calmly. They will be hidden in a moment.
          </p>

          {/* Cards Grid */}
          <div className={`grid grid-cols-2 sm:grid-cols-${cardCount} gap-4 max-w-2xl mx-auto`}>
            {targetItems.map((item) => (
              <div
                key={item.id}
                className={`p-6 rounded-3xl border-2 ${item.color} shadow-sm flex flex-col items-center justify-center transform hover:scale-102 transition`}
              >
                <div className="text-6xl sm:text-7xl mb-3 drop-shadow-xs">{item.emoji}</div>
                <div className="font-bold text-stone-800 text-base sm:text-lg">
                  {getItemLabel(item)}
                </div>
              </div>
            ))}
          </div>

          {/* Large Countdown Progress Bar */}
          <div className="max-w-md mx-auto mt-8 bg-stone-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-amber-600 h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(countdown / 5) * 100}%` }}
            />
          </div>
        </div>
      )}

      {phase === 'recall' && (
        <div className="text-center py-6 sm:py-10 animate-in fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 font-bold text-sm mb-4 border border-amber-200">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>Memory Question</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit'] mb-2">
            Which object was shown earlier?
          </h1>
          <p className="text-stone-600 text-base max-w-md mx-auto mb-8">
            Tap the object you remember seeing in the group. Take your time.
          </p>

          {/* 4 Choices */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {options.map((item) => {
              const isSelected = selectedOption === item.id;
              const isTargetCorrect = item.id === correctAnswer?.id;

              let btnStyle = 'bg-white border-2 border-stone-200 hover:border-amber-400 hover:bg-amber-50/50';
              if (isSelected) {
                btnStyle = isCorrect
                  ? 'bg-emerald-100 border-2 border-emerald-500 ring-4 ring-emerald-200'
                  : 'bg-rose-100 border-2 border-rose-500 ring-4 ring-rose-200';
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
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Result Modal */}
      {phase === 'completed' && result && (
        <GameResultModal
          gameType="memory"
          gameTitle="Memory Match"
          score={isCorrect ? 92 : 45}
          accuracy={isCorrect ? 100 : 35}
          responseTime={responseTime}
          adaptiveResult={result}
          isOffline={StorageService.isOffline()}
          onPlayAgain={initRound}
          onReturnHome={onBack}
        />
      )}

    </div>
  );
};
