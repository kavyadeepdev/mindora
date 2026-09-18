import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft, Volume2, CheckCircle2, RotateCcw, ArrowRight, Play } from 'lucide-react';
import { GameResultModal } from './GameResultModal';
import { AdaptiveDifficultyEngine, AdaptiveResult } from '../../services/adaptiveEngine';
import { StorageService } from '../../services/storage';
import { AudioSpeechService } from '../../services/audioSpeech';
import { Language } from '../../types';
import { getTranslation } from '../../utils/translations';

interface RoutineRecallGameProps {
  onBack: () => void;
  language: Language;
  onFinishGame?: () => void;
  roundsCount?: number;
}

interface RoutineStep {
  id: string;
  stepNumber: number;
  emoji: string;
  title: Record<Language, string>;
}

interface RoutineScenario {
  title: Record<Language, string>;
  description: Record<Language, string>;
  steps: RoutineStep[];
}

// 5 Universal Everyday Routines (Clean, intuitive, fully translated in all 5 languages)
const ROUTINE_SCENARIOS: RoutineScenario[] = [
  // Round 1: Morning Routine
  {
    title: {
      en: 'Morning Awakening Routine',
      hi: 'सुबह जागने की दिनचर्या',
      as: 'পুৱাৰ সাৰ পোৱাৰ নিয়ম',
      bn: 'সকালের ঘুম থেকে ওঠার রুটিন',
      kn: 'ಮುಂಜಾನೆ ಎದ್ದೇಳುವ ದಿನಚರಿ'
    },
    description: {
      en: 'Arrange morning steps in order: Wake up, Drink water, Take medicine, Have breakfast.',
      hi: 'सुबह के चरणों को सही क्रम में लगाएं: जागना, पानी पीना, दवा लेना, नाश्ता करना।',
      as: 'পুৱাৰ নিয়মবোৰ ক্ৰমত সজাওক: সাৰ পোৱা, পানী খোৱা, ঔষধ খোৱা, জলপান খোৱা।',
      bn: 'সকালের ধাপগুলি ক্রমে সাজান: ঘুম থেকে ওঠা, জল খাওয়া, ওষুধ খাওয়া, প্রাতরাশ করা।',
      kn: 'ಮುಂಜಾನೆಯ ಹಂತಗಳನ್ನು ಕ್ರಮದಲ್ಲಿ ಜೋಡಿಸಿ: ಎದ್ದೇಳುವುದು, ನೀರು ಕುಡಿಯುವುದು, ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳುವುದು, ಉಪಹಾರ ಸೇವಿಸುವುದು.'
    },
    steps: [
      {
        id: 'r1-s1',
        stepNumber: 1,
        emoji: '🌅',
        title: {
          en: 'Wake up peacefully',
          hi: 'सुबह शांति से जागना',
          as: 'পুৱা শান্তভাৱে সাৰ পোৱা',
          bn: 'সকালে শান্তভাবে ঘুম থেকে ওঠা',
          kn: 'ಮುಂಜಾನೆ ಶಾಂತಿಯುತವಾಗಿ ಎದ್ದೇಳುವುದು'
        }
      },
      {
        id: 'r1-s2',
        stepNumber: 2,
        emoji: '💧',
        title: {
          en: 'Drink fresh water',
          hi: 'ताजा पानी पीना',
          as: 'বিশুদ্ধ পানী খোৱা',
          bn: 'বিশুদ্ধ জল পান করা',
          kn: 'ತಾಜಾ ನೀರನ್ನು ಕುಡಿಯುವುದು'
        }
      },
      {
        id: 'r1-s3',
        stepNumber: 3,
        emoji: '💊',
        title: {
          en: 'Take morning medicine',
          hi: 'सुबह की दवा लेना',
          as: 'পুৱাৰ ঔষধ গ্ৰহণ কৰা',
          bn: 'সকালের ওষুধ গ্রহণ করা',
          kn: 'ಮುಂಜಾನೆಯ ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳುವುದು'
        }
      },
      {
        id: 'r1-s4',
        stepNumber: 4,
        emoji: '🥣',
        title: {
          en: 'Have healthy breakfast',
          hi: 'पौष्टिक नाश्ता करना',
          as: 'পুৱাৰ জলপান খোৱা',
          bn: 'পুষ্টিকর প্রাতরাশ খাওয়া',
          kn: 'ಆರೋಗ್ಯಕರ ಉಪಹಾರ ಸೇವಿಸುವುದು'
        }
      }
    ]
  },
  // Round 2: Preparing Fresh Tea
  {
    title: {
      en: 'Preparing Fresh Warm Tea',
      hi: 'गरमा-गरम चाय बनाना',
      as: 'সুস্বাদু চাহ প্ৰস্তুত কৰা',
      bn: 'গরম চা তৈরি করার রুটিন',
      kn: 'ಬಿಸಿ ಚಹಾ ತಯಾರಿಸುವ ದಿನಚರಿ'
    },
    description: {
      en: 'Arrange the steps to make tea: Boil water, Add tea leaves, Add milk, Serve in cup.',
      hi: 'चाय बनाने के चरणों को सही क्रम में लगाएं: पानी उबालना, चायपत्ती डालना, दूध मिलाना, कप में परोसना।',
      as: 'চাহ বনোৱাৰ ক্ৰম: পানী উতলোৱা, চাহপাত দিয়া, গাখীৰ দিয়া, কাপত বাকি দিয়া।',
      bn: 'চা তৈরির ধাপগুলি ক্রমে সাজান: জল ফুটানো, চা পাতা দেওয়া, দুধ মেশানো, কাপে ঢালা।',
      kn: 'ಚಹಾ ತಯಾರಿಸುವ ಹಂತಗಳನ್ನು ಕ್ರಮವಾಗಿ ಜೋಡಿಸಿ: ನೀರು ಕುದಿಸುವುದು, ಚಹಾ ಪುಡಿ ಹಾಕುವುದು, ಹಾಲು ಬೆರೆಸುವುದು, ಕಪ್‌ನಲ್ಲಿ ನೀಡುವುದು.'
    },
    steps: [
      {
        id: 'r2-s1',
        stepNumber: 1,
        emoji: '🫖',
        title: {
          en: 'Boil fresh water in kettle',
          hi: 'केटली में पानी उबालना',
          as: 'কেটলিত পানী উতলোৱা',
          bn: 'কেটলিতে জল ফুটানো',
          kn: 'ಪಾತ್ರೆಯಲ್ಲಿ ನೀರು ಕುದಿಸುವುದು'
        }
      },
      {
        id: 'r2-s2',
        stepNumber: 2,
        emoji: '🍃',
        title: {
          en: 'Add fragrant tea leaves',
          hi: 'चायपत्ती डालना',
          as: 'সুগন্ধি চাহপাত দিয়া',
          bn: 'চা পাতা দেওয়া',
          kn: 'ಸುವಾಸನೆಯ ಚಹಾ ಪುಡಿ ಹಾಕುವುದು'
        }
      },
      {
        id: 'r2-s3',
        stepNumber: 3,
        emoji: '🥛',
        title: {
          en: 'Pour warm milk & stir',
          hi: 'गर्म दूध मिलाकर हिलाना',
          as: 'গৰম গাখীৰ মিহলি কৰা',
          bn: 'গরম দুধ মিশিয়ে নাড়া',
          kn: 'ಬಿಸಿ ಹಾಲು ಬೆರೆಸಿ ಕಲಕುವುದು'
        }
      },
      {
        id: 'r2-s4',
        stepNumber: 4,
        emoji: '🍵',
        title: {
          en: 'Pour into tea cup & enjoy',
          hi: 'कप में छानकर आनंद लेना',
          as: 'চাহৰ কাপত বাকি তৃপ্তিৰে খোৱা',
          bn: 'চায়ের কাপে ঢেলে উপভোগ করা',
          kn: 'ಕಪ್‌ಗೆ ಸುರಿದು ಆನಂದಿಸುವುದು'
        }
      }
    ]
  },
  // Round 3: Courtyard Gardening
  {
    title: {
      en: 'Courtyard & Garden Routine',
      hi: 'बगीचे और आंगन की दिनचर्या',
      as: 'বাগান আৰু চোতালৰ নিয়ম',
      bn: 'বাগান ও উঠোনের রুটিন',
      kn: 'ತೋಟ ಮತ್ತು ಅಂಗಳದ ದಿನಚರಿ'
    },
    description: {
      en: 'Arrange gardening steps: Put on slippers, Step into garden, Water flower pots, Sit in fresh air.',
      hi: 'बगीचे के चरणों को क्रम में लगाएं: चप्पल पहनना, बाहर जाना, पौधों को सींचना, ताजी हवा में बैठना।',
      as: 'বাগানৰ নিয়ম: চেন্দেল পিন্ধা, বাটলৈ ওলোৱা, ফুলৰ টাবত পানী দিয়া, মুকলি বতাহত বহা।',
      bn: 'বাগানের ধাপগুলি ক্রমে সাজান: চটি পরা, বাগানে যাওয়া, গাছে জল দেওয়া, মুক্ত বাতাসে বসা।',
      kn: 'ತೋಟದ ಹಂತಗಳನ್ನು ಕ್ರಮವಾಗಿ ಜೋಡಿಸಿ: ಚಪ್ಪಲಿ ಧರಿಸುವುದು, ತೋಟಕ್ಕೆ ಹೋಗುವುದು, ಗಿಡಗಳಿಗೆ ನೀರೆರೆಯುವುದು, ಶುದ್ಧ ಗಾಳಿಯಲ್ಲಿ ವಿಶ್ರಾಂತಿ ಪಡೆಯುವುದು.'
    },
    steps: [
      {
        id: 'r3-s1',
        stepNumber: 1,
        emoji: '🩴',
        title: {
          en: 'Put on walking slippers',
          hi: 'आरामदेह चप्पल पहनना',
          as: 'খোজ কঢ়া চেন্দেল পিন্ধা',
          bn: 'হাঁটার চটি পরা',
          kn: 'ಆರಾಮದಾಯಕ ಚಪ್ಪಲಿ ಧರಿಸುವುದು'
        }
      },
      {
        id: 'r3-s2',
        stepNumber: 2,
        emoji: '🏡',
        title: {
          en: 'Step into courtyard garden',
          hi: 'आंगन के बगीचे में जाना',
          as: 'চোতালৰ বাগানলৈ যোৱা',
          bn: 'উঠোনের বাগানে যাওয়া',
          kn: 'ಅಂಗಳದ ತೋಟಕ್ಕೆ ಹೋಗುವುದು'
        }
      },
      {
        id: 'r3-s3',
        stepNumber: 3,
        emoji: '🪴',
        title: {
          en: 'Water the blooming plants',
          hi: 'फूलों के गमलों में पानी डालना',
          as: 'ফুলৰ গছবোৰত পানী দিয়া',
          bn: 'ফুলের টবে জল দেওয়া',
          kn: 'ಹೂವಿನ ಗಿಡಗಳಿಗೆ ನೀರುಣಿಸುವುದು'
        }
      },
      {
        id: 'r3-s4',
        stepNumber: 4,
        emoji: '🪑',
        title: {
          en: 'Sit comfortably in fresh air',
          hi: 'कुर्सी पर ताजी हवा में बैठना',
          as: 'মুকলি বতাহত আৰামেৰে বহা',
          bn: 'মুক্ত বাতাসে আরামে বসা',
          kn: 'ಶುದ್ಧ ಗಾಳಿಯಲ್ಲಿ ಕುಳಿತು ವಿಶ್ರಾಂತಿ ಪಡೆಯುವುದು'
        }
      }
    ]
  },
  // Round 4: Afternoon Rest
  {
    title: {
      en: 'Afternoon Rest Routine',
      hi: 'दोपहर के विश्राम की दिनचर्या',
      as: 'দুপৰীয়া জিৰণিৰ নিয়ম',
      bn: 'দুপুরের বিশ্রামের রুটিন',
      kn: 'ಮಧ್ಯಾಹ್ನದ ವಿಶ್ರಾಂತಿಯ ದಿನಚರಿ'
    },
    description: {
      en: 'Arrange afternoon rest steps: Wholesome lunch, Wash hands, Take a nap, Wake refreshed.',
      hi: 'दोपहर के चरणों को क्रम में लगाएं: दोपहर का भोजन, हाथ धोना, विश्राम करना, तरोताजा जागना।',
      as: 'দুপৰীয়াৰ নিয়ম: ভাত খোৱা, হাত ধোৱা, পাতল টোপনি লোৱা, সতেজ হৈ উঠা।',
      bn: 'দুপুরের ধাপগুলি ক্রমে সাজান: দুপুরের খাবার, হাত ধোয়া, হালকা বিশ্রাম, সতেজ হয়ে ওঠা।',
      kn: 'ಮಧ್ಯಾಹ್ನದ ಹಂತಗಳನ್ನು ಕ್ರಮವಾಗಿ ಜೋಡಿಸಿ: ಊಟ ಮಾಡುವುದು, ಕೈ ತೊಳೆಯುವುದು, ಕಿರುನಿದ್ರೆ ಮಾಡುವುದು, ಚೈತನ್ಯದಿಂದ ಎದ್ದೇಳುವುದು.'
    },
    steps: [
      {
        id: 'r4-s1',
        stepNumber: 1,
        emoji: '🍲',
        title: {
          en: 'Have warm lunch',
          hi: 'दोपहर का ताजा भोजन करना',
          as: 'দুপৰীয়াৰ ভাত খোৱা',
          bn: 'দুপুরের খাবার খাওয়া',
          kn: 'ಮಧ್ಯಾಹ್ನದ ಊಟ ಸೇವಿಸುವುದು'
        }
      },
      {
        id: 'r4-s2',
        stepNumber: 2,
        emoji: '🧼',
        title: {
          en: 'Wash hands cleanly',
          hi: 'हाथ अच्छी तरह धोना',
          as: 'হাত ভালকৈ ধোৱা',
          bn: 'হাত ভালো করে ধোয়া',
          kn: 'ಕೈಗಳನ್ನು ಸ್ವಚ್ಛವಾಗಿ ತೊಳೆಯುವುದು'
        }
      },
      {
        id: 'r4-s3',
        stepNumber: 3,
        emoji: '🛏️',
        title: {
          en: 'Lie down for afternoon rest',
          hi: 'बिस्तर पर आराम करना',
          as: 'বিচনাত জিৰণি লোৱা',
          bn: 'বিছানায় বিশ্রাম নেওয়া',
          kn: 'ಮಲಗಿ ವಿಶ್ರಾಂತಿ ಪಡೆಯುವುದು'
        }
      },
      {
        id: 'r4-s4',
        stepNumber: 4,
        emoji: '🌤️',
        title: {
          en: 'Wake up feeling refreshed',
          hi: 'तरोताजा होकर उठना',
          as: 'সতেজ অনুভৱেৰে সাৰ পোৱা',
          bn: 'সতেজ মনে জেগে ওঠা',
          kn: 'ಉಲ್ಲಾಸದಿಂದ ಎದ್ದೇಳುವುದು'
        }
      }
    ]
  },
  // Round 5: Evening Calm Routine
  {
    title: {
      en: 'Evening Calm & Sleep Routine',
      hi: 'शाम की शांति और सोने की दिनचर्या',
      as: 'সন্ধিয়াৰ শান্ত নিয়ম আৰু টোপনি',
      bn: 'সন্ধ্যার শান্তি ও ঘুমের রুটিন',
      kn: 'ಸಂಜೆಯ ಶಾಂತಿ ಮತ್ತು ನಿದ್ರೆಯ ದಿನಚರಿ'
    },
    description: {
      en: 'Arrange evening steps: Evening tea, Chat with family, Light evening lamp, Sleep peacefully.',
      hi: 'शाम के चरणों को क्रम में लगाएं: शाम की चाय, अपनों से बातचीत, दीया जलाना, शांति से सोना।',
      as: 'সন্ধিয়াৰ নিয়ম: চাহ খোৱা, পৰিয়ালৰ সতে কথা পতা, সন্ধিয়া চাকি জ্বলোৱা, শান্তভাৱে শোৱা।',
      bn: 'সন্ধ্যার ধাপগুলি ক্রমে সাজান: সন্ধ্যার চা, পরিবারের সাথে কথা, প্রদীপ জ্বালানো, নিশ্চিন্তে ঘুমানো।',
      kn: 'ಸಂಜೆಯ ಹಂತಗಳನ್ನು ಕ್ರಮವಾಗಿ ಜೋಡಿಸಿ: ಸಂಜೆಯ ಚಹಾ, ಕುಟುಂಬದೊಂದಿಗೆ ಮಾತುಕತೆ, ದೀಪ ಬೆಳಗಿಸುವುದು, ಶಾಂತವಾಗಿ ನಿದ್ರಿಸುವುದು.'
    },
    steps: [
      {
        id: 'r5-s1',
        stepNumber: 1,
        emoji: '🍵',
        title: {
          en: 'Enjoy light evening tea',
          hi: 'शाम की हल्की चाय पीना',
          as: 'সন্ধিয়াৰ চাহ একাপ খোৱা',
          bn: 'সন্ধ্যার হালকা চা উপভোগ করা',
          kn: 'ಸಂಜೆಯ ಚಹಾ ಸೇವಿಸುವುದು'
        }
      },
      {
        id: 'r5-s2',
        stepNumber: 2,
        emoji: '💬',
        title: {
          en: 'Friendly chat with family',
          hi: 'परिवार के साथ सुखद बातचीत',
          as: 'পৰিয়ালৰ সৈতে মন খুলি কথা পতা',
          bn: 'পরিবারের সাথে গল্প করা',
          kn: 'ಕುಟುಂಬದೊಂದಿಗೆ ಸಂತೋಷದ ಮಾತುಕತೆ'
        }
      },
      {
        id: 'r5-s3',
        stepNumber: 3,
        emoji: '🪔',
        title: {
          en: 'Light evening lamp / prayer',
          hi: 'संध्या दीप जलाना या प्रार्थना',
          as: 'সন্ধিয়াৰ চাকি জ্বলোৱা বা প্ৰাৰ্থনা',
          bn: 'সন্ধ্যার প্রদীপ জ্বালানো বা প্রার্থনা',
          kn: 'ಸಂಜೆಯ ದೀಪ ಬೆಳಗಿಸುವುದು ಅಥವಾ ಪ್ರಾರ್ಥನೆ'
        }
      },
      {
        id: 'r5-s4',
        stepNumber: 4,
        emoji: '🌙',
        title: {
          en: 'Sleep peacefully for the night',
          hi: 'रात को सुखपूर्वक सोना',
          as: 'ৰাতি শান্তভাৱে নিদ্ৰা যোৱা',
          bn: 'রাতে শান্তিতে ঘুমানো',
          kn: 'ರಾತ್ರಿ ನೆಮ್ಮದಿಯಿಂದ ನಿದ್ರಿಸುವುದು'
        }
      }
    ]
  }
];

interface RoundRecord {
  round: number;
  accuracy: number;
  responseTime: number;
  correctPositions: number;
  totalPositions: number;
}

export const RoutineRecallGame: React.FC<RoutineRecallGameProps> = ({ onBack, language, onFinishGame, roundsCount = 5 }) => {
  const TOTAL_ROUNDS = roundsCount;
  const difficulty = AdaptiveDifficultyEngine.getCurrentDifficulty('routine');

  const [currentRound, setCurrentRound] = useState(1);
  const [phase, setPhase] = useState<'study' | 'reconstruct' | 'feedback' | 'completed'>('study');
  const [availableSteps, setAvailableSteps] = useState<RoutineStep[]>([]);
  const [userOrderedSteps, setUserOrderedSteps] = useState<RoutineStep[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [roundsData, setRoundsData] = useState<RoundRecord[]>([]);

  // Feedback for the round
  const [lastRoundAccuracy, setLastRoundAccuracy] = useState<number | null>(null);

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
    setLastRoundAccuracy(null);
    initRound(1);
  };

  const initRound = (roundNum: number) => {
    const scenario = ROUTINE_SCENARIOS[roundNum - 1] || ROUTINE_SCENARIOS[0];
    const scrambled = [...scenario.steps].sort(() => Math.random() - 0.5);

    setAvailableSteps(scrambled);
    setUserOrderedSteps([]);
    setPhase('study');
    setLastRoundAccuracy(null);

    const desc = scenario.description[language] || scenario.description['en'];
    AudioSpeechService.speak(desc, language);
  };

  const handleStartReconstruct = () => {
    setPhase('reconstruct');
    setStartTime(Date.now());
    const prompt = getTranslation('routinePrompt', language);
    AudioSpeechService.speak(prompt, language);
  };

  const handleSelectStep = (step: RoutineStep) => {
    AudioSpeechService.playChime('tap');
    setUserOrderedSteps([...userOrderedSteps, step]);
    setAvailableSteps(availableSteps.filter((s) => s.id !== step.id));
  };

  const handleRemoveStep = (step: RoutineStep) => {
    AudioSpeechService.playChime('tap');
    setUserOrderedSteps(userOrderedSteps.filter((s) => s.id !== step.id));
    setAvailableSteps([...availableSteps, step]);
  };

  const handleResetCurrent = () => {
    const scenario = ROUTINE_SCENARIOS[currentRound - 1] || ROUTINE_SCENARIOS[0];
    const scrambled = [...scenario.steps].sort(() => Math.random() - 0.5);
    setAvailableSteps(scrambled);
    setUserOrderedSteps([]);
  };

  const handleSubmitSequence = () => {
    const timeTaken = Math.max(1.5, parseFloat(((Date.now() - startTime) / 1000).toFixed(1)));
    const scenario = ROUTINE_SCENARIOS[currentRound - 1] || ROUTINE_SCENARIOS[0];

    // Count how many steps were placed in their exact target position
    let correctCount = 0;
    userOrderedSteps.forEach((step, idx) => {
      if (step.id === scenario.steps[idx]?.id) {
        correctCount += 1;
      }
    });

    const roundAcc = Math.round((correctCount / scenario.steps.length) * 100);
    setLastRoundAccuracy(roundAcc);
    AudioSpeechService.playChime(roundAcc >= 75 ? 'success' : 'tap');

    const record: RoundRecord = {
      round: currentRound,
      accuracy: roundAcc,
      responseTime: timeTaken,
      correctPositions: correctCount,
      totalPositions: scenario.steps.length
    };

    const nextRounds = [...roundsData, record];
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
    }, 1400);
  };

  const finishGame = (completedRounds: RoundRecord[]) => {
    // Mathematically exact stats across all 5 rounds
    const exactAccuracy = Math.round(completedRounds.reduce((sum, r) => sum + r.accuracy, 0) / TOTAL_ROUNDS);
    const totalTime = completedRounds.reduce((sum, r) => sum + r.responseTime, 0);
    const avgResponseTime = Number((totalTime / TOTAL_ROUNDS).toFixed(1));

    const speedBonus = Math.max(0, Math.round((15 - avgResponseTime) * 1.5));
    const calculatedScore = Math.max(0, Math.min(100, Math.round(exactAccuracy * 0.8 + speedBonus)));

    setFinalAccuracy(exactAccuracy);
    setFinalAvgTime(avgResponseTime);
    setFinalScore(calculatedScore);

    const adapt = AdaptiveDifficultyEngine.evaluatePerformance('routine', exactAccuracy, avgResponseTime, 1);
    setResult(adapt);

    const nowStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    StorageService.addSession({
      id: `sess-${Date.now()}`,
      patientId: 'patient-anima-01',
      gameType: 'routine',
      gameTitle: 'Daily Routine Recall',
      score: calculatedScore,
      accuracy: exactAccuracy,
      responseTime: avgResponseTime,
      attempts: 1,
      difficulty,
      timestamp: new Date().toISOString(),
      dateFormatted: nowStr,
      completed: true,
      synced: !StorageService.isOffline(),
      notes: `Arranged 5 daily life routines with ${exactAccuracy}% accuracy in avg ${avgResponseTime}s.`
    });

    setPhase('completed');
    if (onFinishGame) onFinishGame();
  };

  const currentScenario = ROUTINE_SCENARIOS[currentRound - 1] || ROUTINE_SCENARIOS[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Top Header with Back button and 5-Round Progress Indicator */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
        <button
          id="routine-game-back-btn"
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
                  dotColor = past.accuracy >= 75 ? 'bg-emerald-500' : 'bg-amber-500';
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
              const msg =
                phase === 'study'
                  ? currentScenario.description[language] || currentScenario.description['en']
                  : getTranslation('routinePrompt', language);
              AudioSpeechService.speak(msg, language);
            }}
            className="p-2.5 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
            title="Read instructions aloud"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Routine Stage */}
      {phase === 'study' && (
        <div className="text-center py-4 sm:py-6 animate-in fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 font-bold text-sm mb-3 border border-amber-200">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>{currentScenario.title[language] || currentScenario.title['en']}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit'] mb-2">
            {getTranslation('routineStudyPrompt', language)}
          </h1>
          <p className="text-stone-600 text-sm sm:text-base max-w-md mx-auto mb-6">
            Review these 4 steps in their peaceful daily order.
          </p>

          {/* Ordered Display Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
            {currentScenario.steps.map((step, idx) => {
              const label = step.title[language] || step.title['en'];
              return (
                <div
                  key={step.id}
                  className="bg-white border-2 border-stone-200 rounded-3xl p-5 shadow-xs flex flex-col items-center text-center relative"
                >
                  <span className="absolute top-3 left-3 w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center border border-amber-300">
                    {idx + 1}
                  </span>
                  <div className="text-5xl sm:text-6xl my-2">{step.emoji}</div>
                  <h4 className="font-bold text-stone-900 text-sm sm:text-base mt-1">{label}</h4>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleStartReconstruct}
            className="px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-base shadow-md transition flex items-center gap-2 mx-auto cursor-pointer"
          >
            <span>{getTranslation('startOrdering', language)}</span>
            <Play className="w-4 h-4 fill-white" />
          </button>
        </div>
      )}

      {(phase === 'reconstruct' || phase === 'feedback') && (
        <div className="py-4 sm:py-6 animate-in fade-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 font-bold text-sm mb-2 border border-amber-200">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>{currentScenario.title[language] || currentScenario.title['en']}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit'] mb-1">
              {getTranslation('routinePrompt', language)}
            </h1>
            <p className="text-stone-600 text-xs sm:text-sm">
              Tap steps from the pool below to place them into the timeline.
            </p>
          </div>

          {/* User's Arranged Sequence Timeline */}
          <div className="bg-stone-50 border-2 border-stone-200 rounded-3xl p-5 mb-6 shadow-inner">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Your Arranged Steps ({userOrderedSteps.length} of {currentScenario.steps.length})
              </span>
              {userOrderedSteps.length > 0 && phase === 'reconstruct' && (
                <button
                  onClick={handleResetCurrent}
                  className="text-xs font-semibold text-stone-600 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{getTranslation('resetOrder', language)}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: currentScenario.steps.length }).map((_, slotIdx) => {
                const placedStep = userOrderedSteps[slotIdx];
                const targetStep = currentScenario.steps[slotIdx];
                const isMatch = placedStep && placedStep.id === targetStep.id;

                if (placedStep) {
                  const label = placedStep.title[language] || placedStep.title['en'];
                  return (
                    <div
                      key={placedStep.id}
                      onClick={() => phase === 'reconstruct' && handleRemoveStep(placedStep)}
                      className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition cursor-pointer shadow-xs ${
                        phase === 'feedback'
                          ? isMatch
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200'
                            : 'bg-rose-50 border-rose-400 ring-2 ring-rose-200'
                          : 'bg-white border-amber-300 hover:border-amber-400'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0">
                        {slotIdx + 1}
                      </span>
                      <span className="text-3xl shrink-0">{placedStep.emoji}</span>
                      <div className="text-left overflow-hidden">
                        <div className="font-bold text-stone-900 text-xs sm:text-sm truncate">{label}</div>
                        {phase === 'reconstruct' && (
                          <span className="text-[10px] text-stone-400">Tap to remove</span>
                        )}
                        {phase === 'feedback' && (
                          <span className={`text-[10px] font-bold ${isMatch ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {isMatch ? 'Correct placement' : 'Order check'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={slotIdx}
                    className="p-4 rounded-2xl border-2 border-dashed border-stone-300 bg-white/60 flex items-center justify-center text-stone-400 text-xs font-semibold min-h-[72px]"
                  >
                    <span>{getTranslation('stepNumber', language)} {slotIdx + 1} Empty</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Available Steps Pool to Choose From */}
          {phase === 'reconstruct' && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3 text-center">
                Available Steps (Tap to place next):
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
                {availableSteps.map((step) => {
                  const label = step.title[language] || step.title['en'];
                  return (
                    <button
                      key={step.id}
                      onClick={() => handleSelectStep(step)}
                      className="p-4 rounded-2xl bg-white border-2 border-stone-200 hover:border-amber-400 hover:bg-amber-50/50 shadow-xs flex items-center gap-3 text-left transition transform active:scale-95 cursor-pointer"
                    >
                      <span className="text-3xl shrink-0">{step.emoji}</span>
                      <span className="font-bold text-stone-800 text-xs sm:text-sm">{label}</span>
                    </button>
                  );
                })}
              </div>

              {userOrderedSteps.length === currentScenario.steps.length && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleSubmitSequence}
                    className="px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-base shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>{getTranslation('checkOrder', language)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {phase === 'feedback' && currentRound < TOTAL_ROUNDS && (
            <div className="mt-6 text-center">
              <span className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-full animate-pulse">
                {getTranslation('tryNext', language)}...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Result Modal upon completing all 5 rounds */}
      {phase === 'completed' && result && (
        <GameResultModal
          gameType="routine"
          gameTitle="Daily Routine Recall"
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
