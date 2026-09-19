import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft, Volume2, CheckCircle2, Target } from 'lucide-react';
import { GameResultModal } from './GameResultModal';
import { AdaptiveDifficultyEngine, AdaptiveResult } from '../../services/adaptiveEngine';
import { StorageService } from '../../services/storage';
import { AudioSpeechService } from '../../services/audioSpeech';
import { Language } from '../../types';
import { getTranslation, getObjectTranslation } from '../../utils/translations';

interface AttentionChallengeProps {
  onBack: () => void;
  language: Language;
  onFinishGame?: () => void;
  roundsCount?: number;
  onSkipCurrent?: () => void;
  onSkipAll?: () => void;
}

interface ItemDefinition {
  id: string;
  emoji: string;
}

interface RoundCriteria {
  title: Record<Language, string>;
  instruction: Record<Language, string>;
  targets: ItemDefinition[];
  distractors: ItemDefinition[];
}

// 5 Distinct Round Scenarios with Clean Objects & Exact Translations (No brackets, no forced regional prefixes)
const ROUND_SCENARIOS: RoundCriteria[] = [
  // Round 1: Red Items
  {
    title: {
      en: 'Find Red Items',
      hi: 'लाल वस्तुएं खोजें',
      as: 'ৰঙা বস্তুবোৰ বাছক',
      bn: 'লাল রঙের জিনিস খুঁজুন',
      kn: 'ಕೆಂಪು ವಸ್ತುಗಳನ್ನು ಹುಡುಕಿ'
    },
    instruction: {
      en: 'Tap all the red objects on the screen.',
      hi: 'स्क्रीन पर मौजूद सभी लाल वस्तुओं को स्पर्श करें।',
      as: 'পৰ্দাত থকা সকলো ৰঙা বস্তু স্পৰ্শ কৰক।',
      bn: 'পর্দায় প্রদর্শিত সব লাল জিনিস স্পর্শ করুন।',
      kn: 'ಪರದೆಯ ಮೇಲೆ ಇರುವ ಎಲ್ಲಾ ಕೆಂಪು ವಸ್ತುಗಳನ್ನು ಸ್ಪರ್ಶಿಸಿ.'
    },
    targets: [
      { id: 'fruit', emoji: '🍎' },
      { id: 'hibiscus', emoji: '🌺' },
      { id: 'scarf', emoji: '🧣' },
      { id: 'ribbon', emoji: '🎀' }
    ],
    distractors: [
      { id: 'leaf', emoji: '🍃' },
      { id: 'marigold', emoji: '🌼' },
      { id: 'tea_cup', emoji: '🍵' },
      { id: 'pot', emoji: '🏺' }
    ]
  },
  // Round 2: Flowers & Blossoms
  {
    title: {
      en: 'Find All Flowers',
      hi: 'सभी फूल खोजें',
      as: 'সকলো ফুল বাছক',
      bn: 'সব ফুল খুঁজুন',
      kn: 'ಎಲ್ಲಾ ಹೂವುಗಳನ್ನು ಹುಡುಕಿ'
    },
    instruction: {
      en: 'Tap all the blooming flowers on the screen.',
      hi: 'स्क्रीन पर मौजूद सभी फूलों को स्पर्श करें।',
      as: 'পৰ্দাত ফুলি থকা ফুলবোৰ স্পৰ্শ কৰক।',
      bn: 'পর্দায় সব ফুল স্পর্শ করুন।',
      kn: 'ಪರದೆಯ ಮೇಲೆ ಇರುವ ಎಲ್ಲಾ ಹೂವುಗಳನ್ನು ಸ್ಪರ್ಶಿಸಿ.'
    },
    targets: [
      { id: 'flower', emoji: '🌸' },
      { id: 'hibiscus', emoji: '🌺' },
      { id: 'marigold', emoji: '🌼' },
      { id: 'rose', emoji: '🌹' }
    ],
    distractors: [
      { id: 'clock', emoji: '⏰' },
      { id: 'bicycle', emoji: '🚲' },
      { id: 'tea_cup', emoji: '🍵' },
      { id: 'book', emoji: '📖' }
    ]
  },
  // Round 3: Fresh Fruits
  {
    title: {
      en: 'Find Fresh Fruits',
      hi: 'ताजे फल खोजें',
      as: 'মিঠা ফলবোৰ বাছক',
      bn: 'তাজা ফলগুলি খুঁজুন',
      kn: 'ತಾಜಾ ಹಣ್ಣುಗಳನ್ನು ಹುಡುಕಿ'
    },
    instruction: {
      en: 'Tap all the fresh fruits on the screen.',
      hi: 'स्क्रीन पर मौजूद सभी ताजे फलों को स्पर्श करें।',
      as: 'পৰ্দাত থকা আটাইবোৰ মিঠা ফল স্পৰ্শ কৰক।',
      bn: 'পর্দায় প্রদর্শিত সব ফল স্পর্শ করুন।',
      kn: 'ಪರದೆಯ ಮೇಲೆ ಇರುವ ಎಲ್ಲಾ ಹಣ್ಣುಗಳನ್ನು ಸ್ಪರ್ಶಿಸಿ.'
    },
    targets: [
      { id: 'mango', emoji: '🥭' },
      { id: 'fruit', emoji: '🍎' },
      { id: 'banana', emoji: '🍌' },
      { id: 'grapes', emoji: '🍇' }
    ],
    distractors: [
      { id: 'bell', emoji: '🍲' },
      { id: 'drum', emoji: '🥁' },
      { id: 'chair', emoji: '🪑' },
      { id: 'lantern', emoji: '🏮' }
    ]
  },
  // Round 4: Household Items
  {
    title: {
      en: 'Find Everyday Household Objects',
      hi: 'दैनिक घरेलू वस्तुएं खोजें',
      as: 'ঘৰুৱা ব্যৱহাৰ্য্য বস্তুবোৰ বাছক',
      bn: 'দৈনন্দিন গৃহস্থালির জিনিস খুঁজুন',
      kn: 'ದೈನಂದಿನ ಗೃಹೋಪಯೋಗಿ ವಸ್ತುಗಳನ್ನು ಹುಡುಕಿ'
    },
    instruction: {
      en: 'Tap all the household objects on the screen.',
      hi: 'स्क्रीन पर मौजूद घरेलू उपयोग की वस्तुओं को स्पर्श करें।',
      as: 'ঘৰত ব্যৱহাৰ হোৱা বস্তুবোৰ স্পৰ্শ কৰক।',
      bn: 'ঘরের ব্যবহারের জিনিসগুলি স্পর্শ করুন।',
      kn: 'ಮನೆಯಲ್ಲಿ ಬಳಸುವ ವಸ್ತುಗಳನ್ನು ಸ್ಪರ್ಶಿಸಿ.'
    },
    targets: [
      { id: 'tea_cup', emoji: '🍵' },
      { id: 'pot', emoji: '🏺' },
      { id: 'fan', emoji: '🪭' },
      { id: 'clock', emoji: '⏰' }
    ],
    distractors: [
      { id: 'bird', emoji: '🐦' },
      { id: 'fish', emoji: '🐟' },
      { id: 'tree', emoji: '🌳' },
      { id: 'flower', emoji: '🌸' }
    ]
  },
  // Round 5: Golden & Yellow Items
  {
    title: {
      en: 'Find Yellow & Golden Items',
      hi: 'पीली व सुनहरी वस्तुएं खोजें',
      as: 'হালধীয়া আৰু সোণালী বস্তুবোৰ বাছক',
      bn: 'হলুদ ও সোনালী জিনিস খুঁজুন',
      kn: 'ಹಳದಿ ಮತ್ತು ಹೊಂಬಣ್ಣದ ವಸ್ತುಗಳನ್ನು ಹುಡುಕಿ'
    },
    instruction: {
      en: 'Tap all the yellow and golden objects on the screen.',
      hi: 'स्क्रीन पर मौजूद पीली और सुनहरी वस्तुओं को स्पर्श करें।',
      as: 'পৰ্দাত থকা হালধীয়া বস্তুবোৰ স্পৰ্শ কৰক।',
      bn: 'পর্দায় সব হলুদ ও সোনালী জিনিস স্পর্শ করুন।',
      kn: 'ಪರದೆಯ ಮೇಲೆ ಇರುವ ಎಲ್ಲಾ ಹಳದಿ ವಸ್ತುಗಳನ್ನು ಸ್ಪರ್ಶಿಸಿ.'
    },
    targets: [
      { id: 'marigold', emoji: '🌼' },
      { id: 'mango', emoji: '🥭' },
      { id: 'sun', emoji: '☀️' },
      { id: 'bell', emoji: '🍲' }
    ],
    distractors: [
      { id: 'pot', emoji: '🏺' },
      { id: 'scarf', emoji: '🧣' },
      { id: 'leaf', emoji: '🍃' },
      { id: 'ribbon', emoji: '🎀' }
    ]
  }
];

interface DisplayItem {
  id: string;
  emoji: string;
  isTarget: boolean;
  uniqueKey: string;
}

interface RoundScoreRecord {
  round: number;
  accuracy: number;
  responseTime: number;
  targetsFound: number;
  totalTargets: number;
}

export const AttentionChallenge: React.FC<AttentionChallengeProps> = ({ 
  onBack, 
  language, 
  onFinishGame, 
  roundsCount = 3,
  onSkipCurrent,
  onSkipAll
}) => {
  const TOTAL_ROUNDS = roundsCount;
  const difficulty = AdaptiveDifficultyEngine.getCurrentDifficulty('attention');
  const targetCount = difficulty >= 3 ? 4 : 3;
  const distractorCount = difficulty >= 3 ? 4 : 3;

  const [currentRound, setCurrentRound] = useState(1);
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [roundsData, setRoundsData] = useState<RoundScoreRecord[]>([]);

  // Final summary state
  const [gameFinished, setGameFinished] = useState(false);
  const [result, setResult] = useState<AdaptiveResult | null>(null);
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const [finalAvgTime, setFinalAvgTime] = useState(0);
  const [finalScore, setFinalScore] = useState(0);

  useEffect(() => {
    startNewGame();
  }, [difficulty]);

  const startNewGame = () => {
    setCurrentRound(1);
    setRoundsData([]);
    setGameFinished(false);
    initRound(1);
  };

  const initRound = (roundNum: number) => {
    const scenario = ROUND_SCENARIOS[roundNum - 1] || ROUND_SCENARIOS[0];

    // Pick targetCount targets & distractorCount distractors
    const chosenTargets = [...scenario.targets].sort(() => Math.random() - 0.5).slice(0, targetCount);
    const chosenDistractors = [...scenario.distractors].sort(() => Math.random() - 0.5).slice(0, distractorCount);

    const displayList: DisplayItem[] = [
      ...chosenTargets.map((t, idx) => ({ id: t.id, emoji: t.emoji, isTarget: true, uniqueKey: `target-${t.id}-${idx}` })),
      ...chosenDistractors.map((d, idx) => ({ id: d.id, emoji: d.emoji, isTarget: false, uniqueKey: `distractor-${d.id}-${idx}` }))
    ].sort(() => Math.random() - 0.5);

    setItems(displayList);
    setSelectedKeys([]);
    setRoundCompleted(false);
    setStartTime(Date.now());

    // Announce instruction
    const prompt = scenario.instruction[language] || scenario.instruction['en'];
    AudioSpeechService.speak(prompt, language);
  };

  const handleTap = (item: DisplayItem) => {
    if (roundCompleted || gameFinished) return;

    AudioSpeechService.playChime(item.isTarget ? 'tap' : 'tap');

    let updated: string[];
    if (selectedKeys.includes(item.uniqueKey)) {
      updated = selectedKeys.filter(k => k !== item.uniqueKey);
    } else {
      updated = [...selectedKeys, item.uniqueKey];
    }
    setSelectedKeys(updated);

    // Check if all targets found
    const targetItems = items.filter(i => i.isTarget);
    const allTargetsFound = targetItems.every(t => updated.includes(t.uniqueKey));
    const noFalseClicks = updated.every(key => items.find(i => i.uniqueKey === key)?.isTarget);

    if (allTargetsFound && noFalseClicks) {
      handleCompleteRound(updated);
    }
  };

  const handleCompleteRound = (currentSelections = selectedKeys) => {
    setRoundCompleted(true);
    const timeTaken = Math.max(1.0, parseFloat(((Date.now() - startTime) / 1000).toFixed(1)));

    const targetItems = items.filter(i => i.isTarget);
    const correctClicks = currentSelections.filter(key => items.find(i => i.uniqueKey === key)?.isTarget).length;
    const falseClicks = currentSelections.filter(key => !items.find(i => i.uniqueKey === key)?.isTarget).length;

    // Mathematically accurate round accuracy: (correct / total) - penalty for wrong clicks
    let roundAcc = Math.round(((correctClicks - falseClicks * 0.4) / targetItems.length) * 100);
    roundAcc = Math.max(0, Math.min(100, roundAcc));

    AudioSpeechService.playChime('success');

    const record: RoundScoreRecord = {
      round: currentRound,
      accuracy: roundAcc,
      responseTime: timeTaken,
      targetsFound: correctClicks,
      totalTargets: targetItems.length
    };

    const nextRounds = [...roundsData, record];
    setRoundsData(nextRounds);

    setTimeout(() => {
      if (currentRound < TOTAL_ROUNDS) {
        const nextRoundNum = currentRound + 1;
        setCurrentRound(nextRoundNum);
        initRound(nextRoundNum);
      } else {
        finishAllRounds(nextRounds);
      }
    }, 1100);
  };

  const finishAllRounds = (completedRounds: RoundScoreRecord[]) => {
    // Exact cumulative metrics across all 5 rounds
    const exactAccuracy = Math.round(completedRounds.reduce((sum, r) => sum + r.accuracy, 0) / TOTAL_ROUNDS);
    const totalTime = completedRounds.reduce((sum, r) => sum + r.responseTime, 0);
    const avgResponseTime = Number((totalTime / TOTAL_ROUNDS).toFixed(1));

    const speedBonus = Math.max(0, Math.round((12 - avgResponseTime) * 2));
    const calculatedScore = Math.max(0, Math.min(100, Math.round(exactAccuracy * 0.8 + speedBonus)));

    setFinalAccuracy(exactAccuracy);
    setFinalAvgTime(avgResponseTime);
    setFinalScore(calculatedScore);

    const adapt = AdaptiveDifficultyEngine.evaluatePerformance('attention', exactAccuracy, avgResponseTime, 1);
    setResult(adapt);

    const nowStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    StorageService.addSession({
      id: `sess-${Date.now()}`,
      patientId: 'patient-anima-01',
      gameType: 'attention',
      gameTitle: 'Attention Challenge',
      score: calculatedScore,
      accuracy: exactAccuracy,
      responseTime: avgResponseTime,
      attempts: 1,
      difficulty,
      timestamp: new Date().toISOString(),
      dateFormatted: nowStr,
      completed: true,
      synced: !StorageService.isOffline(),
      notes: `Completed ${TOTAL_ROUNDS} rounds with ${exactAccuracy}% accuracy in avg ${avgResponseTime}s.`
    });

    setGameFinished(true);
    if (onFinishGame) onFinishGame();
  };

  const currentScenario = ROUND_SCENARIOS[currentRound - 1] || ROUND_SCENARIOS[0];
  const targetCountInRound = items.filter(i => i.isTarget).length;
  const foundTargetCount = selectedKeys.filter(k => items.find(i => i.uniqueKey === k)?.isTarget).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Top Header with Back button & 5-Round Progress Indicator */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
        <button
          id="attention-game-back-btn"
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
                const isCurrent = roundIdx === currentRound && !gameFinished;

                let dotColor = 'bg-stone-300';
                if (past) {
                  dotColor = past.accuracy >= 60 ? 'bg-emerald-500' : 'bg-amber-500';
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

          <button
            onClick={() => {
              const prompt = currentScenario.instruction[language] || currentScenario.instruction['en'];
              AudioSpeechService.speak(prompt, language);
            }}
            className="p-2.5 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
            title="Read instructions aloud"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Attention Stage */}
      {!gameFinished && (
        <div className="text-center py-4 sm:py-6 animate-in fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 font-bold text-sm mb-3 border border-amber-200">
            <Target className="w-4 h-4 text-amber-700" />
            <span>{currentScenario.title[language] || currentScenario.title['en']}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit'] mb-2">
            {currentScenario.instruction[language] || currentScenario.instruction['en']}
          </h1>

          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
              Found: {foundTargetCount} of {targetCountInRound}
            </span>
          </div>

          {/* Grid of Items */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {items.map((item) => {
              const isSelected = selectedKeys.includes(item.uniqueKey);
              const label = getObjectTranslation(item.id, language);

              return (
                <button
                  key={item.uniqueKey}
                  id={`attention-item-${item.uniqueKey}`}
                  onClick={() => handleTap(item)}
                  className={`p-6 rounded-3xl cursor-pointer transition transform active:scale-95 flex flex-col items-center justify-center min-h-[160px] relative shadow-xs ${
                    isSelected
                      ? item.isTarget
                        ? 'bg-emerald-50 border-3 border-emerald-500 ring-4 ring-emerald-200 shadow-md scale-102'
                        : 'bg-rose-50 border-3 border-rose-400 ring-4 ring-rose-100'
                      : 'bg-white border-2 border-stone-200 hover:border-amber-400 hover:bg-amber-50/40'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      {item.isTarget ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                          Try other
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-6xl sm:text-7xl mb-2">{item.emoji}</div>
                  <div className="font-bold text-stone-900 text-sm sm:text-base">
                    {label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Skip / Next Round early button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => handleCompleteRound()}
              className="px-6 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition cursor-pointer"
            >
              {currentRound < TOTAL_ROUNDS ? 'Proceed to Next Round →' : 'Complete Challenge →'}
            </button>
          </div>
        </div>
      )}

      {/* Showcase Skip Controls */}
      {!gameFinished && (
        <div className="mt-10 pt-6 border-t border-stone-200/60 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={onSkipCurrent || onBack}
            className="text-stone-500 hover:text-stone-800 text-xs font-semibold hover:underline hover:decoration-dashed hover:underline-offset-4 transition-all cursor-pointer bg-transparent border-0 p-0 inline-flex items-center gap-1.5"
          >
            <span>Skip current activity</span>
            <span>→</span>
          </button>

          <span className="text-stone-300 text-xs">•</span>

          <button
            type="button"
            onClick={onSkipAll || onBack}
            className="text-stone-500 hover:text-stone-800 text-xs font-semibold hover:underline hover:decoration-dashed hover:underline-offset-4 transition-all cursor-pointer bg-transparent border-0 p-0 inline-flex items-center gap-1.5"
          >
            <span>Skip all activities</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Result Modal upon completing all rounds */}
      {gameFinished && result && (
        <GameResultModal
          gameType="attention"
          gameTitle="Attention Challenge"
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
