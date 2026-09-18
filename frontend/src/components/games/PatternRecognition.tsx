import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft, Volume2, HelpCircle, CheckCircle2, XCircle } from 'lucide-react';
import { GameResultModal } from './GameResultModal';
import { AdaptiveDifficultyEngine, AdaptiveResult } from '../../services/adaptiveEngine';
import { StorageService } from '../../services/storage';
import { AudioSpeechService } from '../../services/audioSpeech';
import { Language } from '../../types';
import { getTranslation } from '../../utils/translations';

interface PatternRecognitionProps {
  onBack: () => void;
  language: Language;
  onFinishGame?: () => void;
  roundsCount?: number;
}

interface PatternOption {
  id: string;
  emoji: string;
  label: Record<Language, string>;
}

interface PatternSequence {
  sequence: { emoji: string; label: Record<Language, string> }[];
  correctNext: PatternOption;
  options: PatternOption[];
  ruleDescription: Record<Language, string>;
}

// 5 Universal Pattern Sequences (De-cluttered, clean names, no forced regional prefixes, authentic translations)
const PATTERN_ROUNDS: PatternSequence[] = [
  // Round 1: Alternating Circles (A - B - A - B - ?)
  {
    sequence: [
      { emoji: '🟠', label: { en: 'Orange Circle', hi: 'नारंगी गोला', as: 'কমলা বৃত্ত', bn: 'কমলা বৃত্ত', kn: 'ಕಿತ್ತಳೆ ವೃತ್ತ' } },
      { emoji: '🔵', label: { en: 'Blue Circle', hi: 'नीला गोला', as: 'নীলা বৃত্ত', bn: 'নীল বৃত্ত', kn: 'ನೀಲಿ ವೃತ್ತ' } },
      { emoji: '🟠', label: { en: 'Orange Circle', hi: 'नारंगी गोला', as: 'কমলা বৃত্ত', bn: 'কমলা বৃত্ত', kn: 'ಕಿತ್ತಳೆ ವೃತ್ತ' } },
      { emoji: '🔵', label: { en: 'Blue Circle', hi: 'नीला गोला', as: 'নীলা বৃত্ত', bn: 'নীল বৃত্ত', kn: 'ನೀಲಿ ವೃತ್ತ' } }
    ],
    correctNext: {
      id: 'orange-circle',
      emoji: '🟠',
      label: { en: 'Orange Circle', hi: 'नारंगी गोला', as: 'কমলা বৃত্ত', bn: 'কমলা বৃত্ত', kn: 'ಕಿತ್ತಳೆ ವೃತ್ತ' }
    },
    options: [
      { id: 'orange-circle', emoji: '🟠', label: { en: 'Orange Circle', hi: 'नारंगी गोला', as: 'কমলা বৃত্ত', bn: 'কমলা বৃত্ত', kn: 'ಕಿತ್ತಳೆ ವೃತ್ತ' } },
      { id: 'blue-circle', emoji: '🔵', label: { en: 'Blue Circle', hi: 'नीला गोला', as: 'নীলা বৃত্ত', bn: 'নীল বৃত্ত', kn: 'ನೀಲಿ ವೃತ್ತ' } },
      { id: 'green-circle', emoji: '🟢', label: { en: 'Green Circle', hi: 'हरा गोला', as: 'সেউজীয়া বৃত্ত', bn: 'সবুজ বৃত্ত', kn: 'ಹಸಿರು ವೃತ್ತ' } }
    ],
    ruleDescription: {
      en: 'Alternating Orange and Blue rhythm',
      hi: 'नारंगी और नीले रंग का एकांतर क्रम',
      as: 'কমলা আৰু নীলা ৰঙৰ একাদিক্ৰমে পৰিৱৰ্তন',
      bn: 'কমলা এবং নীল রঙের পর্যায়ক্রমিক ছন্দ',
      kn: 'ಕಿತ್ತಳೆ ಮತ್ತು ನೀಲಿ ಬಣ್ಣಗಳ ಪರ್ಯಾಯ ಲಯ'
    }
  },
  // Round 2: Flower and Leaf (A - B - A - B - ?)
  {
    sequence: [
      { emoji: '🌸', label: { en: 'Flower', hi: 'फूल', as: 'ফুল', bn: 'ফুল', kn: 'ಹೂವು' } },
      { emoji: '🍃', label: { en: 'Green Leaf', hi: 'हरी पत्ती', as: 'সেউজীয়া পাত', bn: 'সবুজ পাতা', kn: 'ಹಸಿರು ಎಲೆ' } },
      { emoji: '🌸', label: { en: 'Flower', hi: 'फूल', as: 'ফুল', bn: 'ফুল', kn: 'ಹೂವು' } },
      { emoji: '🍃', label: { en: 'Green Leaf', hi: 'हरी पत्ती', as: 'সেউজীয়া পাত', bn: 'সবুজ পাতা', kn: 'ಹಸಿರು ಎಲೆ' } }
    ],
    correctNext: {
      id: 'flower',
      emoji: '🌸',
      label: { en: 'Flower', hi: 'फूल', as: 'ফুল', bn: 'ফুল', kn: 'ಹೂವು' }
    },
    options: [
      { id: 'flower', emoji: '🌸', label: { en: 'Flower', hi: 'फूल', as: 'ফুল', bn: 'ফুল', kn: 'ಹೂವು' } },
      { id: 'leaf', emoji: '🍃', label: { en: 'Green Leaf', hi: 'हरी पत्ती', as: 'সেউজীয়া পাত', bn: 'সবুজ পাতা', kn: 'ಹಸಿರು ಎಲೆ' } },
      { id: 'fruit', emoji: '🍎', label: { en: 'Fresh Fruit', hi: 'ताजा फल', as: 'মিঠা ফল', bn: 'তাজা ফল', kn: 'ತಾಜಾ ಹಣ್ಣು' } }
    ],
    ruleDescription: {
      en: 'Alternating Flower and Leaf rhythm',
      hi: 'फूल और पत्ती का एकांतर क्रम',
      as: 'ফুল আৰু পাতৰ একাদিক্ৰম ছন্দ',
      bn: 'ফুল ও পাতার পর্যায়ক্রমিক ছন্দ',
      kn: 'ಹೂವು ಮತ್ತು ಎಲೆಯ ಪರ್ಯಾಯ ಕ್ರಮ'
    }
  },
  // Round 3: Double Pattern (A - A - B - A - A - ?)
  {
    sequence: [
      { emoji: '🍎', label: { en: 'Fresh Fruit', hi: 'ताजा फल', as: 'মিঠা ফল', bn: 'তাজা ফল', kn: 'ತಾಜಾ ಹಣ್ಣು' } },
      { emoji: '🍎', label: { en: 'Fresh Fruit', hi: 'ताजा फल', as: 'মিঠা ফল', bn: 'তাজা ফল', kn: 'ತಾಜಾ ಹಣ್ಣು' } },
      { emoji: '🍵', label: { en: 'Tea Cup', hi: 'चाय का कप', as: 'চাহৰ কাপ', bn: 'চায়ের কাপ', kn: 'ಚಹಾ ಕಪ್' } },
      { emoji: '🍎', label: { en: 'Fresh Fruit', hi: 'ताजा फल', as: 'মিঠা फल', bn: 'তাজা ফল', kn: 'ತಾಜಾ ಹಣ್ಣು' } },
      { emoji: '🍎', label: { en: 'Fresh Fruit', hi: 'ताजा फल', as: 'মিঠা ফল', bn: 'তাজা ফল', kn: 'ತಾಜಾ ಹಣ್ಣು' } }
    ],
    correctNext: {
      id: 'tea_cup',
      emoji: '🍵',
      label: { en: 'Tea Cup', hi: 'चाय का कप', as: 'চাহৰ কাপ', bn: 'চায়ের কাপ', kn: 'ಚಹಾ ಕಪ್' }
    },
    options: [
      { id: 'tea_cup', emoji: '🍵', label: { en: 'Tea Cup', hi: 'चाय का कप', as: 'চাহৰ কাপ', bn: 'চায়ের কাপ', kn: 'ಚಹಾ ಕಪ್' } },
      { id: 'fruit', emoji: '🍎', label: { en: 'Fresh Fruit', hi: 'ताजा फल', as: 'মিঠা ফল', bn: 'তাজা ফল', kn: 'ತಾಜಾ ಹಣ್ಣು' } },
      { id: 'drum', emoji: '🥁', label: { en: 'Drum', hi: 'ढोल', as: 'ঢোল', bn: 'ঢোল', kn: 'ಡ್ರಮ್' } }
    ],
    ruleDescription: {
      en: 'Two Fruits followed by One Tea Cup',
      hi: 'दो फल और एक चाय का कप',
      as: 'দুটা ফল আৰু এটা চাহৰ কাপ',
      bn: 'দুটি ফল এবং একটি চায়ের কাপ',
      kn: 'ಎರಡು ಹಣ್ಣುಗಳು ಮತ್ತು ಒಂದು ಚಹಾ ಕಪ್'
    }
  },
  // Round 4: Geometric Stars and Diamonds (A - B - A - B - ?)
  {
    sequence: [
      { emoji: '⭐', label: { en: 'Gold Star', hi: 'सुनहरा तारा', as: 'সোণালী তৰা', bn: 'সোনালী তারা', kn: 'ಚಿನ್ನದ ನಕ್ಷತ್ರ' } },
      { emoji: '🔷', label: { en: 'Blue Diamond', hi: 'नीला हीरा', as: 'নীলা হীৰা', bn: 'নীল হিরে', kn: 'ನೀಲಿ ವಜ್ರ' } },
      { emoji: '⭐', label: { en: 'Gold Star', hi: 'सुनहरा तारा', as: 'সোণালী তৰা', bn: 'সোনালী তারা', kn: 'ಚಿನ್ನದ ನಕ್ಷತ್ರ' } },
      { emoji: '🔷', label: { en: 'Blue Diamond', hi: 'नीला हीरा', as: 'নীলা হীৰা', bn: 'নীল হিরে', kn: 'ನೀಲಿ ವಜ್ರ' } }
    ],
    correctNext: {
      id: 'star',
      emoji: '⭐',
      label: { en: 'Gold Star', hi: 'सुनहरा तारा', as: 'সোণালী তৰা', bn: 'সোনালী তারা', kn: 'ಚಿನ್ನದ ನಕ್ಷತ್ರ' }
    },
    options: [
      { id: 'star', emoji: '⭐', label: { en: 'Gold Star', hi: 'सुनहरा तारा', as: 'সোণালী তৰা', bn: 'সোনালী তারা', kn: 'ಚಿನ್ನದ ನಕ್ಷತ್ರ' } },
      { id: 'diamond', emoji: '🔷', label: { en: 'Blue Diamond', hi: 'नीला हीरा', as: 'নীলা হীৰা', bn: 'নীল হিরে', kn: 'ನೀಲಿ ವಜ್ರ' } },
      { id: 'heart', emoji: '❤️', label: { en: 'Red Heart', hi: 'लाल दिल', as: 'ৰঙা হৃদয়', bn: 'লাল হৃদয়', kn: 'ಕೆಂಪು ಹೃದಯ' } }
    ],
    ruleDescription: {
      en: 'Star and Diamond repeating rhythm',
      hi: 'तारे और हीरे का आवर्ती क्रम',
      as: 'তৰা আৰু হীৰাৰ ছন্দময় ক্ৰম',
      bn: 'তারা এবং হিরের পুনরাবৃত্ত ছন্দ',
      kn: 'ನಕ್ಷತ್ರ ಮತ್ತು ವಜ್ರದ ಪುನರಾವರ್ತಿತ ಲಯ'
    }
  },
  // Round 5: Weather 3-Cycle (A - B - C - A - B - ?)
  {
    sequence: [
      { emoji: '☀️', label: { en: 'Bright Sun', hi: 'सूरज', as: 'সূৰ্য্য', bn: 'সূর্য', kn: 'ಸೂರ್ಯ' } },
      { emoji: '🌧️', label: { en: 'Rain Cloud', hi: 'बारिश', as: 'বৰষুণ', bn: 'বৃষ্টি', kn: 'ಮಳೆ ಮೋಡ' } },
      { emoji: '🌈', label: { en: 'Rainbow', hi: 'इंद्रधनुष', as: 'ৰামধেনু', bn: 'রংধনু', kn: 'ಕಾಮನಬಿಲ್ಲು' } },
      { emoji: '☀️', label: { en: 'Bright Sun', hi: 'सूरज', as: 'সূৰ্য্য', bn: 'সূর্য', kn: 'ಸೂರ್ಯ' } },
      { emoji: '🌧️', label: { en: 'Rain Cloud', hi: 'बारिश', as: 'বৰষুণ', bn: 'বৃষ্টি', kn: 'ಮಳೆ ಮೋಡ' } }
    ],
    correctNext: {
      id: 'rainbow',
      emoji: '🌈',
      label: { en: 'Rainbow', hi: 'इंद्रधनुष', as: 'ৰামধেনু', bn: 'রংধনু', kn: 'ಕಾಮನಬಿಲ್ಲು' }
    },
    options: [
      { id: 'rainbow', emoji: '🌈', label: { en: 'Rainbow', hi: 'इंद्रधनुष', as: 'ৰামধেনু', bn: 'রংধনু', kn: 'ಕಾಮನಬಿಲ್ಲು' } },
      { id: 'sun', emoji: '☀️', label: { en: 'Bright Sun', hi: 'सूरज', as: 'সূৰ্য্য', bn: 'সূর্য', kn: 'ಸೂರ್ಯ' } },
      { id: 'rain', emoji: '🌧️', label: { en: 'Rain Cloud', hi: 'बारिश', as: 'বৰষুণ', bn: 'বৃষ্টি', kn: 'ಮಳೆ ಮೋಡ' } }
    ],
    ruleDescription: {
      en: 'Sun, Rain, then Rainbow cycle',
      hi: 'सूरज, बारिश और फिर इंद्रधनुष का चक्र',
      as: 'সূৰ্য্য, বৰষুণ আৰু ৰামধেনুৰ চক্ৰ',
      bn: 'সূর্য, বৃষ্টি এবং তারপর রংধনুর চক্র',
      kn: 'ಸೂರ್ಯ, ಮಳೆ ಮತ್ತು ಕಾಮನಬಿಲ್ಲಿನ ಆವರ್ತನೆ'
    }
  }
];

interface RoundRecord {
  round: number;
  correct: boolean;
  responseTime: number;
  selectedOption: PatternOption;
}

export const PatternRecognition: React.FC<PatternRecognitionProps> = ({ onBack, language, onFinishGame, roundsCount = 5 }) => {
  const TOTAL_ROUNDS = roundsCount;
  const difficulty = AdaptiveDifficultyEngine.getCurrentDifficulty('pattern');

  const [currentRound, setCurrentRound] = useState(1);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [phase, setPhase] = useState<'play' | 'feedback' | 'completed'>('play');
  const [roundsData, setRoundsData] = useState<RoundRecord[]>([]);

  // Final summary state
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const [finalAvgTime, setFinalAvgTime] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [result, setResult] = useState<AdaptiveResult | null>(null);

  useEffect(() => {
    startNewGame();
  }, [difficulty]);

  const startNewGame = () => {
    setCurrentRound(1);
    setRoundsData([]);
    setPhase('play');
    initRound(1);
  };

  const initRound = (roundNum: number) => {
    setSelectedOptionId(null);
    setIsCorrect(null);
    setPhase('play');
    setStartTime(Date.now());

    const prompt = getTranslation('patternPrompt', language);
    AudioSpeechService.speak(prompt, language);
  };

  const currentPattern = PATTERN_ROUNDS[currentRound - 1] || PATTERN_ROUNDS[0];

  const handleSelect = (option: PatternOption) => {
    if (selectedOptionId !== null || phase !== 'play') return;

    const timeTaken = Math.max(1.0, parseFloat(((Date.now() - startTime) / 1000).toFixed(1)));
    setSelectedOptionId(option.id);

    const match = option.id === currentPattern.correctNext.id;
    setIsCorrect(match);
    AudioSpeechService.playChime(match ? 'success' : 'tap');

    const updatedRecord: RoundRecord = {
      round: currentRound,
      correct: match,
      responseTime: timeTaken,
      selectedOption: option
    };

    const nextRounds = [...roundsData, updatedRecord];
    setRoundsData(nextRounds);
    setPhase('feedback');

    setTimeout(() => {
      if (currentRound < TOTAL_ROUNDS) {
        const nextRoundNum = currentRound + 1;
        setCurrentRound(nextRoundNum);
        initRound(nextRoundNum);
      } else {
        finishGame(nextRounds);
      }
    }, 1200);
  };

  const finishGame = (completedRounds: RoundRecord[]) => {
    // Mathematically exact stats across all 5 rounds
    const correctCount = completedRounds.filter(r => r.correct).length;
    const exactAccuracy = Math.round((correctCount / TOTAL_ROUNDS) * 100);

    const totalTime = completedRounds.reduce((acc, r) => acc + r.responseTime, 0);
    const avgResponseTime = Number((totalTime / TOTAL_ROUNDS).toFixed(1));

    const speedBonus = Math.max(0, Math.round((10 - avgResponseTime) * 2));
    const calculatedScore = Math.max(0, Math.min(100, Math.round(exactAccuracy * 0.8 + speedBonus)));

    setFinalAccuracy(exactAccuracy);
    setFinalAvgTime(avgResponseTime);
    setFinalScore(calculatedScore);

    const adapt = AdaptiveDifficultyEngine.evaluatePerformance('pattern', exactAccuracy, avgResponseTime, 1);
    setResult(adapt);

    const nowStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    StorageService.addSession({
      id: `sess-${Date.now()}`,
      patientId: 'patient-anima-01',
      gameType: 'pattern',
      gameTitle: 'Pattern Recognition',
      score: calculatedScore,
      accuracy: exactAccuracy,
      responseTime: avgResponseTime,
      attempts: 1,
      difficulty,
      timestamp: new Date().toISOString(),
      dateFormatted: nowStr,
      completed: true,
      synced: !StorageService.isOffline(),
      notes: `Completed 5 sequence puzzles: ${correctCount}/${TOTAL_ROUNDS} correct (${exactAccuracy}% accuracy) in avg ${avgResponseTime}s.`
    });

    setPhase('completed');
    if (onFinishGame) onFinishGame();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Top Header with Back button and 5-Round Progress indicator */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
        <button
          id="pattern-game-back-btn"
          onClick={onBack}
          className="px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-stone-700 font-bold text-sm hover:bg-stone-50 flex items-center gap-2 shadow-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{getTranslation('backToActivities', language)}</span>
        </button>

        <div className="flex items-center gap-3">
          {/* 5-Round Progress Pill */}
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
              const prompt = getTranslation('patternPrompt', language);
              AudioSpeechService.speak(prompt, language);
            }}
            className="p-2.5 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
            title="Read instructions aloud"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Pattern Stage */}
      {phase !== 'completed' && (
        <div className="text-center py-4 sm:py-6 animate-in fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 font-bold text-sm mb-3 border border-amber-200">
            <HelpCircle className="w-4 h-4 text-amber-700" />
            <span>{currentPattern.ruleDescription[language] || currentPattern.ruleDescription['en']}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit'] mb-2">
            {getTranslation('patternPrompt', language)}
          </h1>
          <p className="text-stone-600 text-sm sm:text-base max-w-md mx-auto mb-8">
            Look at the rhythm. Which object should fill the missing box?
          </p>

          {/* Sequence Display Row */}
          <div className="bg-stone-50 border-2 border-stone-200 rounded-3xl p-6 max-w-2xl mx-auto mb-8 shadow-xs">
            <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
              {currentPattern.sequence.map((step, idx) => {
                const label = step.label[language] || step.label['en'];
                return (
                  <div
                    key={idx}
                    className="w-18 h-22 sm:w-20 sm:h-26 rounded-2xl bg-white border-2 border-stone-300 flex flex-col items-center justify-center p-2 shadow-xs"
                  >
                    <div className="text-4xl sm:text-5xl mb-1">{step.emoji}</div>
                    <span className="text-[10px] font-bold text-stone-600 truncate max-w-full text-center">
                      {label}
                    </span>
                  </div>
                );
              })}

              {/* Question Box */}
              <div className="w-18 h-22 sm:w-20 sm:h-26 rounded-2xl bg-amber-100 border-2 border-dashed border-amber-400 flex flex-col items-center justify-center p-2 shadow-inner">
                <HelpCircle className="w-8 h-8 text-amber-700 animate-pulse mb-1" />
                <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider">
                  ?
                </span>
              </div>
            </div>
          </div>

          {/* Choice Options */}
          <div className="max-w-xl mx-auto">
            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider mb-4">
              {getTranslation('recallTime', language)} — Choose the next object:
            </h3>

            <div className="grid grid-cols-3 gap-4">
              {currentPattern.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                const isTargetCorrect = opt.id === currentPattern.correctNext.id;
                const label = opt.label[language] || opt.label['en'];

                let btnStyle = 'bg-white border-2 border-stone-200 hover:border-amber-400 hover:bg-amber-50/50';
                if (selectedOptionId !== null) {
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
                    key={opt.id}
                    id={`pattern-option-${opt.id}`}
                    onClick={() => handleSelect(opt)}
                    disabled={selectedOptionId !== null}
                    className={`p-5 rounded-3xl cursor-pointer transition transform active:scale-95 shadow-sm flex flex-col items-center justify-center min-h-[140px] ${btnStyle}`}
                  >
                    <div className="text-5xl sm:text-6xl mb-2">{opt.emoji}</div>
                    <div className="font-bold text-stone-900 text-sm sm:text-base">
                      {label}
                    </div>
                    {isSelected && (
                      <div className="mt-2 flex items-center gap-1 text-xs font-extrabold">
                        {isCorrect ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> {getTranslation('correct', language)}
                          </span>
                        ) : (
                          <span className="text-rose-700 flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Next round
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {phase === 'feedback' && currentRound < TOTAL_ROUNDS && (
              <p className="mt-6 text-xs text-stone-500 font-semibold animate-pulse">
                {getTranslation('tryNext', language)}...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Result Modal upon completing all 5 rounds */}
      {phase === 'completed' && result && (
        <GameResultModal
          gameType="pattern"
          gameTitle="Pattern Recognition"
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
