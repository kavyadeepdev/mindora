import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Target, 
  Puzzle, 
  ListOrdered, 
  CheckCircle2, 
  Play, 
  Pill, 
  Droplet, 
  Footprints, 
  Calendar, 
  Sparkles, 
  Volume2, 
  Heart, 
  ChevronRight, 
  Clock, 
  Trophy, 
  Star, 
  RotateCcw, 
  Check,
  CheckCircle,
  HelpCircle,
  Image as ImageIcon,
  Mic,
  Smile,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  Language, 
  PatientProfile, 
  Reminder, 
  GameSession, 
  GameType,
  PatientFlowState,
  PatientFlowStep
} from '../../types';
import { getTranslation, getObjectTranslation } from '../../utils/translations';
import { AudioSpeechService } from '../../services/audioSpeech';
import { StorageService } from '../../services/storage';

interface PatientHomeProps {
  patient: PatientProfile;
  reminders: Reminder[];
  onToggleReminder: (reminderId: string) => void;
  onStartGame: (gameType: GameType, roundsCount?: number) => void;
  onOpenVoiceAssistant: () => void;
  onOpenMemories: () => void;
  language: Language;
}

export const PatientHome: React.FC<PatientHomeProps> = ({
  patient,
  reminders,
  onToggleReminder,
  onStartGame,
  onOpenVoiceAssistant,
  onOpenMemories,
  language
}) => {
  // Load Doctor's Prescribed Activity Plan
  const plan = StorageService.getActivityPlan(patient.id);
  const rawActivities = plan.activities
    .filter(a => a.enabled)
    .sort((a, b) => a.order - b.order);

  // Default to at least 2 gentle activities if none configured
  const prescribedActivities = rawActivities.length > 0 ? rawActivities : [
    {
      gameType: 'memory' as GameType,
      enabled: true,
      order: 1,
      rounds: 3,
      targetFocus: 'Visual memory and familiar everyday recall',
      doctorNotes: '3 gentle rounds to encourage recall of familiar objects without rush.'
    },
    {
      gameType: 'pattern' as GameType,
      enabled: true,
      order: 2,
      rounds: 3,
      targetFocus: 'Pattern and sequence recognition',
      doctorNotes: 'Observe the calm color sequence and find the matching item.'
    }
  ];

  // Active Flow State: 'greeting' | 'activity-intro' | 'activity-performance' | 'reminders' | 'all-complete'
  const [flowState, setFlowState] = useState<PatientFlowState>(() => 
    StorageService.getPatientFlowState(patient.id)
  );

  // Sync state on external flow changes
  useEffect(() => {
    const handleFlowUpdate = () => {
      setFlowState(StorageService.getPatientFlowState(patient.id));
    };
    window.addEventListener('mindora-flow-updated', handleFlowUpdate);
    return () => window.removeEventListener('mindora-flow-updated', handleFlowUpdate);
  }, [patient.id]);

  // Update helper
  const updateFlow = (next: Partial<PatientFlowState>) => {
    const updated: PatientFlowState = { ...flowState, ...next };
    setFlowState(updated);
    StorageService.savePatientFlowState(patient.id, updated);
  };

  // Filter reminders relevant for this patient
  const patientReminders = reminders.filter(r => !r.patientId || r.patientId === patient.id);
  const activeReminder = patientReminders[flowState.reminderIndex] || patientReminders[0];

  // Active prescribed activity
  const currentActivityIndex = Math.min(flowState.activityIndex, prescribedActivities.length - 1);
  const currentActivity = prescribedActivities[currentActivityIndex] || prescribedActivities[0];

  // Fetch the latest session for performance evaluation
  const sessions = StorageService.getSessions();
  const latestSession: GameSession | undefined = flowState.lastCompletedGame
    ? sessions.find(s => s.gameType === flowState.lastCompletedGame)
    : sessions[0];

  // Confetti trigger for performance or all-complete
  useEffect(() => {
    if (flowState.step === 'activity-performance' || flowState.step === 'all-complete') {
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 }
        });
        AudioSpeechService.playChime('celebrate');
      } catch {
        // ignore
      }
    }
  }, [flowState.step]);

  // Multilingual Greetings
  const getGreetingHeading = () => {
    if (language === 'bn') return `সুপ্রভাত, ${patient.name}!`;
    if (language === 'as') return `শুভ প্ৰভাত, ${patient.name}!`;
    if (language === 'kn') return `ಶುಭೋದಯ, ${patient.name}!`;
    if (language === 'hi') return `सुप्रभात, ${patient.name}!`;
    return `Good morning, ${patient.name}!`;
  };

  const getGreetingSubtext = () => {
    if (language === 'bn') return `আপনার সকালের সুন্দর ও শান্ত সময়টিতে স্বাগতম। আসুন একসাথে কিছু প্রশান্তিময় মুহূর্ত কাটাই।`;
    if (language === 'as') return `আপোনাৰ পুৱাৰ যত্নৰ সময়লৈ স্বাগতম। আহক আমি শান্তভাৱে কিছু সময় একেলগে কটাওঁ।`;
    if (language === 'kn') return `ನಿಮ್ಮ ಮುಂಜಾನೆಯ ಆರೈಕೆ ಸಮಯಕ್ಕೆ ಸುಸ್ವಾಗತ. ಕೆಲವು ನೆಮ್ಮದಿಯ ಕ್ಷಣಗಳನ್ನು ಒಟ್ಟಿಗೆ ಕಳೆಯೋಣ.`;
    if (language === 'hi') return `आपके सुबह के शांत और सुखद समय में आपका स्वागत है। आइए कुछ शांतिपूर्ण पल साथ बिताएं।`;
    return `Welcome to your peaceful daily wellness space. Let's spend a few calm and gentle minutes together.`;
  };

  const speakGreeting = () => {
    AudioSpeechService.speak(`${getGreetingHeading()}. ${getGreetingSubtext()}`, language);
  };

  const getGameTitle = (gameType: GameType) => {
    switch (gameType) {
      case 'memory':
        return getTranslation('memoryActivity', language);
      case 'attention':
        return getTranslation('attentionActivity', language);
      case 'pattern':
        return getTranslation('patternActivity', language);
      case 'routine':
        return getTranslation('routineActivity', language);
    }
  };

  const getGameIcon = (gameType: GameType) => {
    switch (gameType) {
      case 'memory':
        return <Brain className="w-10 h-10 text-amber-700" />;
      case 'attention':
        return <Target className="w-10 h-10 text-emerald-700" />;
      case 'pattern':
        return <Puzzle className="w-10 h-10 text-teal-700" />;
      case 'routine':
        return <ListOrdered className="w-10 h-10 text-indigo-700" />;
    }
  };

  // Detailed "How to Solve" descriptions per cognitive game
  const getHowToSolveInfo = (gameType: GameType) => {
    switch (gameType) {
      case 'memory':
        return {
          overview: language === 'bn' 
            ? 'পরিচিত স্মৃতি খেলা: পরিচিত ফুল, চা কাপ ও ঐতিহ্যবাহী জিনিসপত্র লক্ষ্য করুন।'
            : language === 'as'
            ? 'পৰিচিত স্মৃতি খেল: ফুল, চাহ কাপ আৰু দৈনন্দিন বস্তুবোৰ মনত ৰাখক।'
            : language === 'kn'
            ? 'ಪರಿಚಿತ ನೆನಪಿನ ಚಟುವಟಿಕೆ: ದೈನಂದಿನ ವಸ್ತುಗಳನ್ನು ಗಮನಿಸಿ ನೆನಪಿನಲ್ಲಿಡಿ.'
            : language === 'hi'
            ? 'स्मृति खेल: जाने-पहचाने फूलों और दैनिक वस्तुओं को ध्यान से देखें।'
            : 'Familiar Visual Recall: Remember everyday familiar objects and heritage items.',
          steps: [
            {
              stepNum: 1,
              instruction: language === 'bn' ? 'কার্ডগুলির পরিচিত ছবিগুলি কয়েক সেকেন্ড মন দিয়ে দেখুন।' : language === 'as' ? 'কাৰ্ডত থকা ছবিবোৰ মন দি চাওক।' : language === 'kn' ? 'ಕಾರ್ಡ್‌ಗಳಲ್ಲಿರುವ ಚಿತ್ರಗಳನ್ನು ಕೆಲವು ಸೆಕೆಂಡುಗಳ ಕಾಲ ಗಮನಿಸಿ.' : language === 'hi' ? 'कार्डों पर दिखाए गए चित्रों को कुछ सेकंड ध्यान से देखें।' : 'Look closely at the familiar pictures shown on the cards.'
            },
            {
              stepNum: 2,
              instruction: language === 'bn' ? 'ছবিগুলি কোথায় ছিল তা মনে রাখুন।' : language === 'as' ? 'ছবিখন ক’ত আছিল মনত পেলাওক।' : language === 'kn' ? 'ಚಿತ್ರಗಳು ಎಲ್ಲಿದ್ದವು ಎಂಬುದನ್ನು ನೆನಪಿನಲ್ಲಿಡಿ.' : language === 'hi' ? 'चित्र कहाँ थे, उसे याद रखने की कोशिश करें।' : 'Keep in mind where each familiar picture is placed.'
            },
            {
              stepNum: 3,
              instruction: language === 'bn' ? 'যে বস্তুটি চাওয়া হয়েছে, সেই কার্ডটিতে আলতো স্পর্শ করুন।' : language === 'as' ? 'সোধা বস্তুটোৰ কাৰ্ডত স্পৰ্শ কৰক।' : language === 'kn' ? 'ಕೇಳಲಾದ ವಸ್ತುವಿನ ಕಾರ್ಡ್ ಅನ್ನು ಸ್ಪರ್ಶಿಸಿ.' : language === 'hi' ? 'पूछी गई वस्तु वाले कार्ड को आराम से स्पर्श करें।' : 'Tap the card that matches the requested picture. Take all the time you need.'
            }
          ],
          spoken: language === 'bn'
            ? 'এই খেলায় কার্ডে থাকা পরিচিত ছবিগুলি মন দিয়ে দেখুন। তারপর যে জিনিসটি জিজ্ঞাসা করা হবে, সেই কার্ডটি স্পর্শ করুন। কোন তাড়া নেই।'
            : language === 'as'
            ? 'এই খেলত কাৰ্ডৰ ছবিবোৰ মন দি চাওক। তাৰ পাছত সোধা বস্তুটোৰ কাৰ্ডত স্পৰ্শ কৰক। কোনো খৰখেদা নাই।'
            : language === 'kn'
            ? 'ಈ ಆಟದಲ್ಲಿ ಪರಿಚಿತ ಚಿತ್ರಗಳನ್ನು ಗಮನಿಸಿ. ನಂತರ ಕೇಳಲಾದ ಚಿತ್ರದ ಕಾರ್ಡ್ ಅನ್ನು ಸ್ಪರ್ಶಿಸಿ. ಯಾವುದೇ ಆತುರವಿಲ್ಲ.'
            : language === 'hi'
            ? 'इस गतिविधि में चित्रों को ध्यान से देखें। फिर पूछी गई वस्तु पर स्पर्श करें। कोई जल्दबाजी नहीं है।'
            : 'In this activity, look at the familiar pictures carefully. Then tap the card that matches the asked object. There is no rush.'
        };

      case 'attention':
        return {
          overview: language === 'bn'
            ? 'মনোযোগ ও লক্ষ্য নির্ধারণ: শান্ত মনে নির্দিষ্ট বস্তুটি খুঁজে বের করুন।'
            : language === 'as'
            ? 'মনোযোগ অনুশীলন: নিৰ্দিষ্ট বস্তুটো শান্তভাৱে বিচাৰি উলিয়াওক।'
            : language === 'kn'
            ? 'ಗಮನ ಶಕ್ತಿ: ನಿರ್ದಿಷ್ಟ ವಸ್ತುವನ್ನು ಶಾಂತ ಚಿತ್ತದಿಂದ ಹುಡುಕಿ.'
            : language === 'hi'
            ? 'एकाग्रता अभ्यास: शांति से बताई गई वस्तु को खोजें।'
            : 'Calm Target Spotting: Find and tap the requested target item among gentle cards.',
          steps: [
            {
              stepNum: 1,
              instruction: language === 'bn' ? 'উপরে প্রদর্শিত লক্ষ্য বস্তুটি দেখুন।' : language === 'as' ? 'ওপৰত থকা লক্ষ্য বস্তুটো চাওক।' : language === 'kn' ? 'ಮೇಲೆ ತೋರಿಸಿರುವ ಗುರಿಯ ವಸ್ತುವನ್ನು ಗಮನಿಸಿ.' : language === 'hi' ? 'ऊपर दिखाए गए मुख्य वस्तु को देखें।' : 'Notice the target item shown at the top of the screen.'
            },
            {
              stepNum: 2,
              instruction: language === 'bn' ? 'পর্দার শান্ত গ্রিডে সেই বস্তুটি খুঁজুন।' : language === 'as' ? 'পৰ্দাৰ বস্তুবোৰৰ মাজত সেইটো বিচাৰক।' : language === 'kn' ? 'ಪರದೆಯ ಮೇಲಿರುವ ವಸ್ತುಗಳಲ್ಲಿ ಅದನ್ನು ಹುಡುಕಿ.' : language === 'hi' ? 'पर्दे पर मौजूद वस्तुओं में उसे ढूंढें।' : 'Gently scan the cards to spot that target item.'
            },
            {
              stepNum: 3,
              instruction: language === 'bn' ? 'প্রতিটি লক্ষ্য বস্তুর উপর স্পর্শ করুন।' : language === 'as' ? 'প্ৰতিটো নিৰ্বাচিত বস্তুত স্পৰ্শ কৰক।' : language === 'kn' ? 'ಪ್ರತಿ ಗುರಿ ವಸ್ತುವಿನ ಮೇಲೆ ಸ್ಪರ್ಶಿಸಿ.' : language === 'hi' ? 'प्रत्येक लक्षित वस्तु पर स्पर्श करें।' : 'Tap each matching target calmly.'
            }
          ],
          spoken: language === 'bn'
            ? 'উপরে দেখানো বস্তুটি নিচে কার্ডগুলির মধ্যে খুঁজে বের করে স্পর্শ করুন। শান্ত মনে খেলুন।'
            : language === 'as'
            ? 'ওপৰত দেখুওৱা বস্তুটো কাৰ্ডবোৰৰ মাজত বিচাৰি স্পৰ্শ কৰক।'
            : language === 'kn'
            ? 'ಮೇಲೆ ತೋರಿಸಿರುವ ವಸ್ತುವನ್ನು ಕೆಳಗಿನ ಕಾರ್ಡ್‌ಗಳಲ್ಲಿ ಗುರುತಿಸಿ ಸ್ಪರ್ಶಿಸಿ.'
            : language === 'hi'
            ? 'ऊपर दिखाई गई वस्तु को नीचे दिए गए कार्डों में ढूंढकर स्पर्श करें।'
            : 'Look at the target item at the top, then tap the matching cards below.'
        };

      case 'pattern':
        return {
          overview: language === 'bn'
            ? 'প্যাটার্ন ও ছন্দ শনাক্তকরণ: রঙের সুন্দর ক্রম লক্ষ্য করুন।'
            : language === 'as'
            ? 'বিন্যাস চিনাক্তকৰণ: ৰং আৰু ক্ৰমৰ ছন্দ লক্ষ্য কৰক।'
            : language === 'kn'
            ? 'ವಿನ್ಯಾಸ ಗುರುತಿಸುವಿಕೆ: ಬಣ್ಣಗಳ ಸರಣಿಯ ಲಯವನ್ನು ಗಮನಿಸಿ.'
            : language === 'hi'
            ? 'पैटर्न पहचान: रंगों और आकारों की श्रृंखला को समझें।'
            : 'Visual Pattern Recognition: Follow the visual rhythm of shapes and colors.',
          steps: [
            {
              stepNum: 1,
              instruction: language === 'bn' ? 'রঙ ও আকারের ক্রমটি বা দিক থেকে ডান দিকে দেখুন।' : language === 'as' ? 'বাওঁফালৰ পৰা সোঁফাললৈ ক্ৰমটো চাওক।' : language === 'kn' ? 'ಎಡದಿಂದ ಬಲಕ್ಕೆ ಬಣ್ಣಗಳ ಸರದಿಯನ್ನು ನೋಡಿ.' : language === 'hi' ? 'बाईं से दाईं ओर आकारों के क्रम को देखें।' : 'Look at the sequence of shapes from left to right.'
            },
            {
              stepNum: 2,
              instruction: language === 'bn' ? 'কোন ক্রমটি বার বার আসছে তা লক্ষ্য করুন।' : language === 'as' ? 'কোনটো ক্ৰম বাৰে বাৰে আহিছে লক্ষ্য কৰক।' : language === 'kn' ? 'ಯಾವ ವಿನ್ಯಾಸವು ಮರುಕಳಿಸುತ್ತಿದೆ ಎಂಬುದನ್ನು ಗಮನಿಸಿ.' : language === 'hi' ? 'पहचानें कि कौन सा क्रम दोहराया जा रहा है।' : 'Notice which color or shape naturally repeats.'
            },
            {
              stepNum: 3,
              instruction: language === 'bn' ? 'প্রশ্নচিহ্নের স্থানে যেটি সঠিক হবে, তা নির্বাচন করুন।' : language === 'as' ? 'প্ৰশ্নবোধক (?) চিনৰ ঠাইত কোনটো বহিব বাছক।' : language === 'kn' ? 'ಪ್ರಶ್ನಾರ್ಥಕ ಚಿಹ್ನೆಯ ಜಾಗಕ್ಕೆ ಸೂಕ್ತವಾದದ್ದನ್ನು ಆರಿಸಿ.' : language === 'hi' ? 'प्रश्न चिह्न (?) के स्थान पर आने वाले आकार को चुनें।' : 'Tap the item that belongs in the question mark (?) spot.'
            }
          ],
          spoken: language === 'bn'
            ? 'রঙের সুন্দর ক্রমটি লক্ষ্য করুন, এবং প্রশ্নচিহ্নের স্থানে কোনটি আসবে তা নির্বাচন করুন।'
            : language === 'as'
            ? 'ৰঙৰ ক্ৰমটো চাওক আৰু প্ৰশ্নচিহ্নৰ ঠাইত কোনটো আহিব বাছক।'
            : language === 'kn'
            ? 'ಬಣ್ಣಗಳ ಸರಣಿಯನ್ನು ಗಮನಿಸಿ, ಪ್ರಶ್ನಾರ್ಥಕ ಜಾಗಕ್ಕೆ ಸರಿಹೊಂದುವ ಚಿತ್ರವನ್ನು ಆರಿಸಿ.'
            : language === 'hi'
            ? 'रंगों के क्रम को समझें और प्रश्न चिह्न के स्थान पर आने वाली वस्तु को चुनें।'
            : 'Observe the sequence and choose the shape that completes the pattern.'
        };

      case 'routine':
        return {
          overview: language === 'bn'
            ? 'দৈনন্দিন রুটিন সাজানো: সকাল থেকে সন্ধ্যার পরিচিত কাজগুলি সাজান।'
            : language === 'as'
            ? 'দৈনন্দিন নিয়ম সজোৱা: পুৱাৰ পৰা সন্ধিয়াৰ নিয়মবোৰ ক্ৰমত ৰাখক।'
            : language === 'kn'
            ? 'ದಿನಚರಿ ಮರುಸ್ಥಾಪನೆ: ಮುಂಜಾನೆಯಿಂದ ಸಂಜೆಯವರೆಗಿನ ದಿನಚರಿಯನ್ನು ಕ್ರಮಗೊಳಿಸಿ.'
            : language === 'hi'
            ? 'दिनचर्या क्रम: सुबह से शाम के दैनिक कार्यों को सही क्रम में लगाएं।'
            : 'Daily Routine Steps: Reconstruct natural daily routine events in sequence.',
          steps: [
            {
              stepNum: 1,
              instruction: language === 'bn' ? 'সকালের ঘুম ভাঙা, পানি পান, ওষুধ ও নাস্তার কার্ডগুলি দেখুন।' : language === 'as' ? 'পুৱাৰ নিয়মবোৰৰ কাৰ্ডবোৰ চাওক।' : language === 'kn' ? 'ಮುಂಜಾನೆಯ ಕೆಲಸಗಳ ಕಾರ್ಡ್‌ಗಳನ್ನು ನೋಡಿ.' : language === 'hi' ? 'सुबह के कार्यों वाले कार्डों को देखें।' : 'Review the routine cards shown on the screen.'
            },
            {
              stepNum: 2,
              instruction: language === 'bn' ? 'সকাল থেকে ক্রমানুসারে সেগুলিকে প্রথম থেকে সাজান।' : language === 'as' ? 'পুৱাৰ পৰা নিয়ম মতে সজাওক।' : language === 'kn' ? 'ಮೊದಲಿನಿಂದ ಕ್ರಮವಾಗಿ ಜೋಡಿಸಿ.' : language === 'hi' ? 'पहले से बाद के क्रम में लगाएं।' : 'Arrange them in the natural order of your day.'
            },
            {
              stepNum: 3,
              instruction: language === 'bn' ? 'সাজানো শেষে যাচাই বোতামে স্পর্শ করুন।' : language === 'as' ? 'যাচাই কৰক বুটামত টিপক।' : language === 'kn' ? 'ಪರಿಶೀಲಿಸಿ ಬಟನ್ ಒತ್ತಿರಿ.' : language === 'hi' ? 'सत्यापित करें बटन पर स्पर्श करें।' : 'Tap Check Order when comfortable.'
            }
          ],
          spoken: language === 'bn'
            ? 'আপনার পরিচিত সকালের কাজগুলিকে সঠিক ক্রমানুসারে সাজান। কোন তাড়া নেই।'
            : language === 'as'
            ? 'আপোনাৰ পুৱাৰ কামবোৰ নিয়ম অনুসৰি সজাওক।'
            : language === 'kn'
            ? 'ನಿಮ್ಮ ದಿನಚರಿಯ ಹಂತಗಳನ್ನು ಸರಿಯಾದ ಕ್ರಮದಲ್ಲಿ ಜೋಡಿಸಿ.'
            : language === 'hi'
            ? 'अपने दैनिक कार्यों को सही क्रम में व्यवस्थित करें।'
            : 'Arrange the daily routine steps in their natural chronological order.'
        };
    }
  };

  const speakHowToSolve = (info: { spoken: string }) => {
    AudioSpeechService.speak(info.spoken, language);
  };

  // Helper for Reminder translation
  const getReminderTitle = (r: Reminder) => {
    if (language === 'bn' && r.titleBengali) return r.titleBengali;
    if (language === 'as' && r.titleAssamese) return r.titleAssamese;
    if (language === 'kn' && r.titleKannada) return r.titleKannada;
    if (language === 'hi' && r.titleHindi) return r.titleHindi;
    return r.title;
  };

  const getReminderNotes = (r: Reminder) => {
    if (language === 'bn' && r.notesBengali) return r.notesBengali;
    if (language === 'as' && r.notesAssamese) return r.notesAssamese;
    if (language === 'kn' && r.notesKannada) return r.notesKannada;
    if (language === 'hi' && r.notesHindi) return r.notesHindi;
    return r.notes || '';
  };

  const speakReminder = (r: Reminder) => {
    const text = `${getReminderTitle(r)}. ${getReminderNotes(r)}`;
    AudioSpeechService.speak(text, language);
  };

  // Handlers for Transitions
  const handleStartActivity = () => {
    AudioSpeechService.playChime('tap');
    // Pre-set next step to activity-performance so when game finishes and returns, performance is displayed!
    updateFlow({
      step: 'activity-performance',
      activityIndex: currentActivityIndex,
      lastCompletedGame: currentActivity.gameType
    });
    onStartGame(currentActivity.gameType, currentActivity.rounds);
  };

  const handleNextFromPerformance = () => {
    AudioSpeechService.playChime('tap');
    if (currentActivityIndex + 1 < prescribedActivities.length) {
      // Next activity
      updateFlow({
        step: 'activity-intro',
        activityIndex: currentActivityIndex + 1
      });
    } else {
      // All cognitive activities completed, move to reminders!
      updateFlow({
        step: 'reminders',
        reminderIndex: 0
      });
    }
  };

  const handleSkipCurrentActivity = () => {
    AudioSpeechService.playChime('tap');
    const nowStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    StorageService.addSession({
      id: `sess-${Date.now()}`,
      patientId: patient.id,
      gameType: currentActivity.gameType,
      gameTitle: getGameTitle(currentActivity.gameType),
      score: 95,
      accuracy: 100,
      responseTime: 3.2,
      attempts: 1,
      difficulty: 2,
      timestamp: new Date().toISOString(),
      dateFormatted: nowStr,
      completed: true,
      synced: !StorageService.isOffline(),
      notes: 'Showcase quick pass: Activity completed.'
    });

    if (currentActivityIndex + 1 < prescribedActivities.length) {
      updateFlow({
        step: 'activity-intro',
        activityIndex: currentActivityIndex + 1
      });
    } else {
      updateFlow({
        step: 'reminders',
        reminderIndex: 0
      });
    }
  };

  const handleSkipAllActivities = () => {
    AudioSpeechService.playChime('tap');
    const nowStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    prescribedActivities.forEach((act, idx) => {
      StorageService.addSession({
        id: `sess-${Date.now()}-${idx}`,
        patientId: patient.id,
        gameType: act.gameType,
        gameTitle: getGameTitle(act.gameType),
        score: 94,
        accuracy: 96,
        responseTime: 3.5,
        attempts: 1,
        difficulty: 2,
        timestamp: new Date().toISOString(),
        dateFormatted: nowStr,
        completed: true,
        synced: !StorageService.isOffline(),
        notes: 'Showcase quick pass: Activity completed.'
      });
    });

    updateFlow({
      step: 'reminders',
      reminderIndex: 0
    });
  };

  const handleCompleteCurrentReminder = () => {
    AudioSpeechService.playChime('success');
    if (activeReminder) {
      onToggleReminder(activeReminder.id);
    }

    if (flowState.reminderIndex + 1 < patientReminders.length) {
      // Advance to next reminder one-by-one
      updateFlow({
        reminderIndex: flowState.reminderIndex + 1
      });
    } else {
      // All reminders completed!
      updateFlow({
        step: 'all-complete'
      });
    }
  };

  const handleRestartJourney = () => {
    AudioSpeechService.playChime('tap');
    StorageService.resetPatientFlowState(patient.id);
    setFlowState({ step: 'greeting', activityIndex: 0, reminderIndex: 0 });
  };

  // Stepper Header helper
  const getStepProgressText = () => {
    if (flowState.step === 'greeting') return 'Greeting & Daily Orientation';
    if (flowState.step === 'activity-intro' || flowState.step === 'activity-performance') {
      return `Activity ${currentActivityIndex + 1} of ${prescribedActivities.length}: ${getGameTitle(currentActivity.gameType)}`;
    }
    if (flowState.step === 'reminders') {
      return `Routine Reminder ${flowState.reminderIndex + 1} of ${patientReminders.length}: ${getReminderTitle(activeReminder)}`;
    }
    return 'Daily Wellness Plan Completed';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

      {/* =========================================================================
          GENTLE TOP STEPPER & CONTROLS (Clean, no streak counts, no timeline tree)
         ========================================================================= */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-200 text-xs font-semibold text-stone-500">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-stone-800 font-bold font-['Outfit']">{getStepProgressText()}</span>
        </div>

        {flowState.step !== 'greeting' && (
          <button
            onClick={handleRestartJourney}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer text-[11px] font-bold"
            title="Start over from greeting"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Start Fresh</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          STAGE 1: GREETING SCREEN
         ========================================================================= */}
      {flowState.step === 'greeting' && (
        <div className="bg-white rounded-3xl border border-amber-200 p-6 sm:p-10 shadow-sm animate-in fade-in zoom-in-98 duration-300">
          <div className="text-center max-w-xl mx-auto">
            
            {/* Gentle Patient Avatar */}
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-amber-100 border-3 border-amber-300 flex items-center justify-center text-4xl sm:text-5xl font-black text-amber-900 shadow-sm mx-auto">
                {patient.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-xs">
                <Smile className="w-4 h-4" />
              </div>
            </div>

            {/* Spoken Greeting Trigger */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <button
                onClick={speakGreeting}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Listen Aloud</span>
              </button>
            </div>

            {/* Greeting Heading */}
            <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-['Outfit']">
              {getGreetingHeading()}
            </h1>
            <p className="text-stone-600 text-sm sm:text-base mt-2 leading-relaxed font-medium">
              {getGreetingSubtext()}
            </p>

            {/* Doctor & Caregiver Curated Badge */}
            <div className="mt-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-left flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                <Stethoscope className="w-5 h-5 text-teal-700" />
              </div>
              <div className="min-w-0 text-xs text-stone-700 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-stone-900 text-sm">
                    Today's Guided Wellness Session
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 font-bold text-[10px]">
                    Prescribed
                  </span>
                </div>
                <p className="text-stone-600 leading-snug">
                  Personalized care plan curated by <strong>{patient.doctorName || 'Dr. Ananya Mukherjee'}</strong> & caretaker <strong>{patient.caregiverName || 'Debojit Banerjee'}</strong>.
                </p>
                <p className="text-[11px] text-amber-900 font-semibold pt-0.5">
                  • {prescribedActivities.length} calming brain exercises & {patientReminders.length} daily wellness routines.
                </p>
              </div>
            </div>

            {/* Reassuring Dementia Note */}
            <p className="text-xs text-stone-500 mt-4 leading-relaxed italic">
              "Take all the time you need. There are no timers, no countdowns, and no wrong answers. Everything is here for your comfort."
            </p>

            {/* Next Button */}
            <div className="mt-8">
              <button
                id="patient-greeting-next-btn"
                onClick={() => updateFlow({ step: 'activity-intro', activityIndex: 0, reminderIndex: 0 })}
                className="w-full py-4 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-extrabold text-base sm:text-lg shadow-md transition flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>Begin Today's Activities</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Gentle Actions */}
            <div className="mt-6 pt-6 border-t border-stone-100 flex items-center justify-center gap-4 text-xs font-bold text-stone-600">
              <button
                onClick={onOpenMemories}
                className="inline-flex items-center gap-1.5 hover:text-amber-800 transition cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <span>Explore Familiar Memories</span>
              </button>
              <span className="text-stone-300">•</span>
              <button
                onClick={onOpenVoiceAssistant}
                className="inline-flex items-center gap-1.5 hover:text-teal-800 transition cursor-pointer"
              >
                <Mic className="w-4 h-4 text-teal-600" />
                <span>Talk to Voice Assistant</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 2: ACTIVITY INTRO & HOW TO SOLVE
         ========================================================================= */}
      {flowState.step === 'activity-intro' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-sm animate-in fade-in zoom-in-98 duration-300">
          {(() => {
            const howToInfo = getHowToSolveInfo(currentActivity.gameType);
            return (
              <div className="space-y-6">
                
                {/* Header with Activity Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-100/80 border border-amber-200 flex items-center justify-center shrink-0">
                      {getGameIcon(currentActivity.gameType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                          Activity {currentActivityIndex + 1} of {prescribedActivities.length}
                        </span>
                        <span className="text-[11px] font-semibold text-stone-500">
                          {currentActivity.rounds} Rounds Prescribed
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 mt-1 font-['Outfit']">
                        {getGameTitle(currentActivity.gameType)}
                      </h2>
                    </div>
                  </div>

                  {/* Audio Instruction Trigger */}
                  <button
                    onClick={() => speakHowToSolve(howToInfo)}
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition cursor-pointer shadow-2xs"
                  >
                    <Volume2 className="w-4 h-4 text-amber-700" />
                    <span>Listen to Guide</span>
                  </button>
                </div>

                {/* Overview Text */}
                <p className="text-sm sm:text-base text-stone-700 leading-relaxed font-medium">
                  {howToInfo.overview}
                </p>

                {/* Illustrated "How to Solve" Steps */}
                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200/80 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
                    How to Solve & Play
                  </h3>

                  <div className="space-y-2.5 pt-1">
                    {howToInfo.steps.map((s) => (
                      <div key={s.stepNum} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-teal-700 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                          {s.stepNum}
                        </div>
                        <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-semibold">
                          {s.instruction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clinician Advice */}
                {currentActivity.doctorNotes && (
                  <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 text-xs text-teal-950 flex items-start gap-2.5">
                    <Stethoscope className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5">Dr. {patient.doctorName || 'Ananya Mukherjee'}'s Recommendation:</span>
                      <span>{currentActivity.doctorNotes}</span>
                    </div>
                  </div>
                )}

                {/* Start Activity Primary Button */}
                <div className="pt-2">
                  <button
                    id="start-activity-action-btn"
                    onClick={handleStartActivity}
                    className="w-full py-4 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 active:scale-98 text-white font-extrabold text-base sm:text-lg shadow-md transition flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    <span>Start Activity</span>
                  </button>
                </div>

                {/* Showcase Skip Controls */}
                <div className="pt-4 flex items-center justify-center gap-6 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={handleSkipCurrentActivity}
                    className="text-stone-500 hover:text-stone-800 text-xs font-semibold hover:underline hover:decoration-dashed hover:underline-offset-4 transition-all cursor-pointer bg-transparent border-0 p-0 inline-flex items-center gap-1.5"
                  >
                    <span>Skip current activity</span>
                    <span>→</span>
                  </button>

                  <span className="text-stone-300 text-xs">•</span>

                  <button
                    type="button"
                    onClick={handleSkipAllActivities}
                    className="text-stone-500 hover:text-stone-800 text-xs font-semibold hover:underline hover:decoration-dashed hover:underline-offset-4 transition-all cursor-pointer bg-transparent border-0 p-0 inline-flex items-center gap-1.5"
                  >
                    <span>Skip all activities</span>
                    <span>→</span>
                  </button>
                </div>

              </div>
            );
          })()}
        </div>
      )}

      {/* =========================================================================
          STAGE 3: ACTIVITY PERFORMANCE SUMMARY (Shown at the end of the activity)
         ========================================================================= */}
      {flowState.step === 'activity-performance' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-sm animate-in fade-in zoom-in-98 duration-300">
          <div className="text-center max-w-xl mx-auto space-y-6">
            
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-700 shadow-inner">
              <Trophy className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-2">
                Activity Completed Successfully
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit']">
                Wonderful Work, {patient.name}!
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                You completed <strong>{getGameTitle(currentActivity.gameType)}</strong> with great calm and focus.
              </p>
            </div>

            {/* Metrics KPI Cards */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5">
                <span className="text-[11px] font-bold text-stone-500 uppercase block">Accuracy</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5 block">
                  {latestSession?.accuracy ?? 100}%
                </span>
                <span className="text-[10px] text-stone-400">Accurate Recall</span>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5">
                <span className="text-[11px] font-bold text-stone-500 uppercase block">Response Pacing</span>
                <span className="text-xl sm:text-2xl font-black text-amber-700 mt-0.5 block">
                  {latestSession?.responseTime ?? 4.2}s
                </span>
                <span className="text-[10px] text-stone-400">Comfortable Speed</span>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5">
                <span className="text-[11px] font-bold text-stone-500 uppercase block">Score</span>
                <span className="text-xl sm:text-2xl font-black text-teal-700 mt-0.5 block">
                  {latestSession?.score ?? 96}
                </span>
                <span className="text-[10px] text-stone-400">Wellness Index</span>
              </div>
            </div>

            {/* Reassuring Telemetry Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Results securely recorded and shared with Dr. {patient.doctorName || 'Ananya Mukherjee'}.</span>
            </div>

            {/* Next Navigation Button */}
            <div className="pt-2">
              <button
                id="performance-next-btn"
                onClick={handleNextFromPerformance}
                className="w-full py-4 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-extrabold text-base sm:text-lg shadow-md transition flex items-center justify-center gap-3 cursor-pointer"
              >
                {currentActivityIndex + 1 < prescribedActivities.length ? (
                  <>
                    <span>Next: Activity {currentActivityIndex + 2} ({getGameTitle(prescribedActivities[currentActivityIndex + 1].gameType)})</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    <span>Next: Today's Routine Reminders ({patientReminders.length} Items)</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Showcase Skip Controls */}
            <div className="pt-4 flex items-center justify-center gap-6 border-t border-stone-100">
              <button
                type="button"
                onClick={handleNextFromPerformance}
                className="text-stone-500 hover:text-stone-800 text-xs font-semibold hover:underline hover:decoration-dashed hover:underline-offset-4 transition-all cursor-pointer bg-transparent border-0 p-0 inline-flex items-center gap-1.5"
              >
                <span>Skip current activity</span>
                <span>→</span>
              </button>

              <span className="text-stone-300 text-xs">•</span>

              <button
                type="button"
                onClick={handleSkipAllActivities}
                className="text-stone-500 hover:text-stone-800 text-xs font-semibold hover:underline hover:decoration-dashed hover:underline-offset-4 transition-all cursor-pointer bg-transparent border-0 p-0 inline-flex items-center gap-1.5"
              >
                <span>Skip all activities</span>
                <span>→</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 4: ROUTINE REMINDERS (Completed One by One)
         ========================================================================= */}
      {flowState.step === 'reminders' && activeReminder && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-sm animate-in fade-in zoom-in-98 duration-300">
          <div className="max-w-xl mx-auto space-y-6">

            {/* Reminder Counter & Category Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                  Reminder {flowState.reminderIndex + 1} of {patientReminders.length}
                </span>
                <span className="text-xs font-extrabold text-stone-600">
                  {activeReminder.time}
                </span>
              </div>

              {/* Audio Reminder Voice Prompt */}
              <button
                onClick={() => speakReminder(activeReminder)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Listen Aloud</span>
              </button>
            </div>

            {/* Prominent Reminder Card */}
            <div className="p-6 rounded-3xl bg-stone-50 border-2 border-amber-300/80 text-center space-y-4 shadow-xs">
              
              {/* Category Icon */}
              <div className="w-20 h-20 mx-auto rounded-3xl bg-white border-2 border-amber-200 flex items-center justify-center shadow-xs">
                {activeReminder.type === 'medicine' ? (
                  <Pill className="w-10 h-10 text-rose-600" />
                ) : activeReminder.type === 'hydration' ? (
                  <Droplet className="w-10 h-10 text-sky-600" />
                ) : activeReminder.type === 'activity' ? (
                  <Footprints className="w-10 h-10 text-emerald-600" />
                ) : (
                  <Calendar className="w-10 h-10 text-amber-600" />
                )}
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit']">
                  {getReminderTitle(activeReminder)}
                </h2>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800 mt-1">
                  Scheduled for {activeReminder.time}
                </p>
              </div>

              {/* Instructions / Notes */}
              {activeReminder.notes && (
                <div className="p-3.5 rounded-2xl bg-white border border-stone-200 text-xs sm:text-sm text-stone-700 font-medium leading-relaxed max-w-md mx-auto">
                  {getReminderNotes(activeReminder)}
                </div>
              )}

              <p className="text-xs text-stone-500 italic">
                "Please perform this routine gently. Once completed, tap the button below."
              </p>
            </div>

            {/* Complete Reminder Button */}
            <div className="pt-2">
              <button
                id="reminder-complete-done-btn"
                onClick={handleCompleteCurrentReminder}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-base sm:text-lg shadow-md transition flex items-center justify-center gap-3 cursor-pointer"
              >
                <Check className="w-6 h-6 stroke-[3]" />
                <span>✓ Done / I Have Completed This</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 5: ALL ACTIVITIES & ROUTINES COMPLETED (Gentle Peaceful Closure)
         ========================================================================= */}
      {flowState.step === 'all-complete' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-sm animate-in fade-in zoom-in-98 duration-300">
          <div className="text-center max-w-xl mx-auto space-y-6">

            <div className="w-24 h-24 mx-auto rounded-3xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-700 shadow-inner">
              <CheckCircle className="w-12 h-12" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-2">
                All Daily Tasks Finished
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-['Outfit']">
                You Are All Done For Today!
              </h1>
              <p className="text-stone-600 text-sm sm:text-base mt-2 leading-relaxed font-medium">
                You have finished all {prescribedActivities.length} cognitive activities and all {patientReminders.length} daily wellness reminders with flying colours.
              </p>
            </div>

            {/* Session Summary Card */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-stone-800 pb-2 border-b border-stone-200/70">
                <span>Completed Daily Wellness Summary</span>
                <span className="text-emerald-700 font-extrabold">100% Accomplished</span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>• Cognitive Activities:</span>
                <span className="font-semibold">{prescribedActivities.length} Sessions Complete</span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>• Daily Routine Reminders:</span>
                <span className="font-semibold">{patientReminders.length} Marked Done</span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>• Telemetry Synchronization:</span>
                <span className="font-semibold text-teal-800">Caregiver & Doctor Updated</span>
              </div>
            </div>

            {/* Reassuring Closing Message */}
            <p className="text-xs text-stone-500 italic">
              "Rest well, enjoy your tea and conversation, and have a peaceful rest of the day."
            </p>

            {/* Gentle Closure Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={onOpenMemories}
                className="w-full py-3.5 px-5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Explore Familiar Family Memories</span>
              </button>

              <button
                onClick={onOpenVoiceAssistant}
                className="w-full py-3 px-5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mic className="w-4 h-4 text-stone-600" />
                <span>Speak with Voice Companion</span>
              </button>

              <button
                onClick={handleRestartJourney}
                className="w-full py-2.5 px-4 text-xs font-bold text-stone-500 hover:text-stone-700 transition cursor-pointer"
              >
                Restart Today's Journey from Beginning
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
