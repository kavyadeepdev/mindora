import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Target, 
  Puzzle, 
  ListOrdered, 
  CheckCircle2, 
  Play, 
  Mic, 
  Pill, 
  Droplet, 
  Footprints, 
  Calendar, 
  Sparkles, 
  Volume2, 
  Heart, 
  Smile,
  ChevronRight,
  Clock,
  Trophy,
  Star,
  Lock,
  RotateCcw,
  Check,
  Flame
} from 'lucide-react';
import { Language, PatientProfile, Reminder, GameSession, GameType } from '../../types';
import { getTranslation } from '../../utils/translations';
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

interface PathNode {
  id: string;
  stepNumber: number;
  type: 'reminder' | 'game' | 'milestone';
  title: string;
  subtitle: string;
  notes?: string;
  gameType?: GameType;
  rounds?: number;
  reminder?: Reminder;
  completed: boolean;
  active: boolean;
  icon: React.ReactNode;
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
  const plan = StorageService.getActivityPlan(patient.id);
  const [journeyProgress, setJourneyProgress] = useState(() => StorageService.getPatientProgress(patient.id));

  // Sync journey progress on storage events
  useEffect(() => {
    const handleJourneyUpdate = () => {
      setJourneyProgress(StorageService.getPatientProgress(patient.id));
    };
    window.addEventListener('mindora-journey-updated', handleJourneyUpdate);
    return () => window.removeEventListener('mindora-journey-updated', handleJourneyUpdate);
  }, [patient.id]);

  const getGreeting = () => {
    if (language === 'as') return `শুভ প্ৰভাত, ${patient.name} 👋`;
    if (language === 'hi') return `सुप्रभात, ${patient.name} 👋`;
    if (language === 'bn') return `সুপ্রভাত, ${patient.name} 👋`;
    if (language === 'kn') return `ಶುಭೋದಯ, ${patient.name} 👋`;
    return `Good morning, ${patient.name} 👋`;
  };

  const speakGreeting = () => {
    AudioSpeechService.speak(
      `${getGreeting()}. ${getTranslation('greetingWelcome', language)}`,
      language
    );
  };

  const getReminderTitle = (r: Reminder) => {
    if (language === 'as' && r.titleAssamese) return r.titleAssamese;
    if (language === 'hi' && r.titleHindi) return r.titleHindi;
    if (language === 'bn' && r.titleBengali) return r.titleBengali;
    if (language === 'kn' && r.titleKannada) return r.titleKannada;
    return r.title;
  };

  const getReminderNotes = (r: Reminder) => {
    if (language === 'as' && r.notesAssamese) return r.notesAssamese;
    if (language === 'hi' && r.notesHindi) return r.notesHindi;
    if (language === 'bn' && r.notesBengali) return r.notesBengali;
    if (language === 'kn' && r.notesKannada) return r.notesKannada;
    return r.notes || '';
  };

  const getGameIcon = (gameType: GameType) => {
    switch (gameType) {
      case 'memory':
        return <Brain className="w-8 h-8 sm:w-10 sm:h-10" />;
      case 'attention':
        return <Target className="w-8 h-8 sm:w-10 sm:h-10" />;
      case 'pattern':
        return <Puzzle className="w-8 h-8 sm:w-10 sm:h-10" />;
      case 'routine':
        return <ListOrdered className="w-8 h-8 sm:w-10 sm:h-10" />;
    }
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

  // =========================================================================
  // BUILD DUOLINGO-STYLE STEPPING STONE PATH
  // 1. Earliest pending reminder (medicine/hydration) set by doctor/caretaker
  // 2. Prescribed doctor activities in exact prescribed order
  // 3. Daily milestone celebration node
  // =========================================================================
  const pathNodes: PathNode[] = [];
  let stepIndex = 1;

  // Step 1: Doctor/Caretaker's First Task or Reminder
  const firstReminder = reminders[0];
  if (firstReminder) {
    const isDone = firstReminder.status === 'completed' || journeyProgress.completedSteps.includes(`rem-${firstReminder.id}`);
    pathNodes.push({
      id: `rem-${firstReminder.id}`,
      stepNumber: stepIndex++,
      type: 'reminder',
      title: getReminderTitle(firstReminder),
      subtitle: `${firstReminder.time} • ${firstReminder.type.toUpperCase()}`,
      notes: getReminderNotes(firstReminder),
      reminder: firstReminder,
      completed: isDone,
      active: false, // will calculate below
      icon: firstReminder.type === 'medicine' 
        ? <Pill className="w-8 h-8 sm:w-10 sm:h-10 text-rose-600" />
        : <Droplet className="w-8 h-8 sm:w-10 sm:h-10 text-sky-600" />
    });
  }

  // Prescribed activities sorted by doctor's prescribed order
  const prescribedActivities = plan.activities
    .filter(a => a.enabled)
    .sort((a, b) => a.order - b.order);

  prescribedActivities.forEach((act) => {
    const stepId = `game-${act.gameType}`;
    const isDone = journeyProgress.completedSteps.includes(stepId);
    pathNodes.push({
      id: stepId,
      stepNumber: stepIndex++,
      type: 'game',
      title: getGameTitle(act.gameType),
      subtitle: `${act.rounds} Rounds Prescribed`,
      notes: act.doctorNotes || `Focus: ${act.targetFocus}`,
      gameType: act.gameType,
      rounds: act.rounds,
      completed: isDone,
      active: false,
      icon: getGameIcon(act.gameType)
    });
  });

  // Calculate the first incomplete step as the ACTIVE step
  let foundActive = false;
  for (const node of pathNodes) {
    if (!node.completed && !foundActive) {
      node.active = true;
      foundActive = true;
    }
  }

  // Total completed steps count
  const completedCount = pathNodes.filter(n => n.completed).length;
  const allCompleted = pathNodes.length > 0 && completedCount === pathNodes.length;
  const activeNode = pathNodes.find(n => n.active);

  // Handle Step Click
  const handleNodeClick = (node: PathNode) => {
    if (node.type === 'reminder' && node.reminder) {
      AudioSpeechService.playChime('success');
      onToggleReminder(node.reminder.id);
      StorageService.completePatientStep(patient.id, node.id);
      setJourneyProgress(StorageService.getPatientProgress(patient.id));
    } else if (node.type === 'game' && node.gameType) {
      AudioSpeechService.playChime('tap');
      StorageService.completePatientStep(patient.id, node.id);
      onStartGame(node.gameType, node.rounds);
    }
  };

  const handleResetProgress = () => {
    StorageService.resetPatientProgress(patient.id);
    setJourneyProgress({ completedSteps: [], currentStepIndex: 0 });
    AudioSpeechService.playChime('tap');
  };

  // Horizontal offset generator for Duolingo winding effect
  const getNodeOffsetClass = (index: number) => {
    const pattern = [
      'sm:translate-x-0',        // center
      'sm:-translate-x-16',      // left
      'sm:translate-x-16',       // right
      'sm:-translate-x-12',      // left
      'sm:translate-x-12',       // right
      'sm:translate-x-0'         // center
    ];
    return pattern[index % pattern.length];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-32">
      
      {/* =========================================================================
          TOP GREETING & DUOLINGO-STYLE PROGRESS BAR
         ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-xs mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-3xl font-black text-amber-900 shadow-inner shrink-0">
              {patient.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100/90 px-3 py-0.5 rounded-full border border-amber-200">
                  {patient.location}
                </span>
                <button
                  id="patient-speak-greeting-btn"
                  onClick={speakGreeting}
                  className="p-1 text-stone-500 hover:text-amber-800 transition cursor-pointer"
                  title="Listen aloud"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-['Outfit']">
                {getGreeting()}
              </h1>
              <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
                Prescribed by <strong className="text-teal-800">{plan.doctorName}</strong>
              </p>
            </div>
          </div>

          {/* Daily Streak & Progress Badge */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
              <Flame className="w-5 h-5 text-amber-600 fill-amber-500 animate-pulse" />
              <div>
                <span className="text-[10px] font-bold uppercase block text-amber-800">Daily Streak</span>
                <span className="text-sm font-black text-amber-950">3 Days Active</span>
              </div>
            </div>

            <button
              onClick={handleResetProgress}
              className="p-2.5 rounded-2xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition cursor-pointer"
              title="Restart Today's Path"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Tracker Bar */}
        <div className="mt-6 pt-6 border-t border-stone-100">
          <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-2">
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Today's Gentle Wellness Journey
            </span>
            <span className="text-amber-900 font-extrabold">
              {completedCount} of {pathNodes.length} Steps Complete
            </span>
          </div>

          <div className="w-full h-3.5 bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pathNodes.length > 0 ? (completedCount / pathNodes.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          DUOLINGO-STYLE STEPPING STONE PATHWAY
         ========================================================================= */}
      <div className="relative flex flex-col items-center py-6">
        
        {/* Background Connecting Path Curve */}
        <div className="absolute top-12 bottom-12 w-2.5 bg-gradient-to-b from-amber-300 via-emerald-300 to-teal-300 rounded-full -z-10 shadow-xs opacity-60" />

        <div className="space-y-16 w-full flex flex-col items-center">
          {pathNodes.map((node, index) => {
            const offsetClass = getNodeOffsetClass(index);

            return (
              <div 
                key={node.id}
                className={`flex flex-col items-center relative transition-transform duration-300 ${offsetClass}`}
              >
                {/* Floating "START HERE" Speech Bubble above Active Node */}
                {node.active && (
                  <div className="mb-3 animate-bounce">
                    <div className="bg-amber-600 text-white font-extrabold text-[11px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg border border-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      <span>Start Here</span>
                    </div>
                  </div>
                )}

                {/* Duolingo 3D Button Node */}
                <button
                  id={`path-step-${node.stepNumber}`}
                  onClick={() => handleNodeClick(node)}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-b-6 transition-all duration-150 flex items-center justify-center relative cursor-pointer active:translate-y-1.5 focus:outline-none ${
                    node.completed
                      ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700 text-white shadow-lg'
                      : node.active
                      ? 'bg-amber-500 hover:bg-amber-600 border-amber-700 text-white shadow-xl ring-6 ring-amber-300/80 scale-105'
                      : 'bg-stone-200 hover:bg-stone-300 border-stone-400 text-stone-500 shadow-md'
                  }`}
                >
                  {node.icon}

                  {/* Top-Right Badge: Checkmark or Star */}
                  {node.completed && (
                    <div className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-amber-400 border-2 border-white rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-4 h-4 text-amber-950 stroke-[3]" />
                    </div>
                  )}

                  {node.active && (
                    <div className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center shadow-md animate-pulse">
                      <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                    </div>
                  )}

                  {!node.completed && !node.active && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-stone-400 border-2 border-white rounded-full flex items-center justify-center shadow-xs">
                      <Lock className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>

                {/* Descriptive Card Below Node */}
                <div className={`mt-3 text-center max-w-xs bg-white/95 backdrop-blur-xs p-3.5 rounded-2xl border transition-all ${
                  node.active 
                    ? 'border-amber-400 shadow-md ring-2 ring-amber-300/30' 
                    : node.completed
                    ? 'border-emerald-200 shadow-xs'
                    : 'border-stone-200/80 opacity-75'
                }`}>
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-0.5">
                    Step {node.stepNumber}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-stone-900 leading-tight">
                    {node.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5 font-medium">
                    {node.subtitle}
                  </p>
                  {node.notes && (
                    <p className="text-[11px] text-teal-800 font-semibold mt-1 italic">
                      "{node.notes}"
                    </p>
                  )}

                  {/* Immediate Action Trigger for Active Step */}
                  {node.active && (
                    <button
                      onClick={() => handleNodeClick(node)}
                      className="mt-2.5 w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {node.type === 'reminder' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Done & Continue</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Start Exercise Now</span>
                        </>
                      )}
                    </button>
                  )}

                  {node.completed && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  )}
                </div>

              </div>
            );
          })}

          {/* FINAL MILESTONE / TROPHY NODE */}
          <div className="flex flex-col items-center">
            <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-b-8 flex items-center justify-center shadow-xl transition-all ${
              allCompleted
                ? 'bg-amber-400 border-amber-600 text-amber-950 scale-110 ring-8 ring-amber-200 animate-bounce'
                : 'bg-stone-100 border-stone-300 text-stone-400'
            }`}>
              <Trophy className="w-12 h-12" />
            </div>

            <div className="mt-4 text-center max-w-xs bg-white p-4 rounded-3xl border border-stone-200 shadow-xs">
              <h3 className="font-extrabold text-stone-900 text-base">
                {allCompleted ? '🎉 Daily Regimen Completed!' : 'Daily Wellness Goal'}
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                {allCompleted 
                  ? `Wonderful job today, ${patient.name}! You finished all prescribed tasks.`
                  : 'Complete all steps above to finish your daily cognitive path.'}
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* =========================================================================
          SUPPORTIVE COMPANIONS: Familiar Memories & Voice Assistant
         ========================================================================= */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div 
          onClick={onOpenMemories}
          className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 transition cursor-pointer flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌸</span>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">
                {getTranslation('familiarMemories', language)}
              </h3>
              <p className="text-xs text-stone-600">
                {getTranslation('familiarMemoriesBannerDesc', language)}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-700" />
        </div>

        <div 
          onClick={onOpenVoiceAssistant}
          className="p-5 rounded-3xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 hover:border-teal-300 transition cursor-pointer flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">
                Voice Assistant
              </h3>
              <p className="text-xs text-stone-600">
                Tap to speak or ask about your schedule
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-teal-700" />
        </div>
      </div>

      {/* Gentle Reassurance */}
      <div className="mt-8 p-4 rounded-2xl bg-stone-100 border border-stone-200 text-xs text-stone-600 flex items-start gap-2.5">
        <Heart className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {getTranslation('reassuranceNote', language)}
        </p>
      </div>

      {/* =========================================================================
          DUOLINGO-STYLE STICKY BOTTOM ACTION BAR (Impossible to get lost)
         ========================================================================= */}
      {activeNode && (
        <aside 
          aria-label="Continue Today's Care Path"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 p-4 shadow-2xl"
        >
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-left w-full sm:w-auto">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                {activeNode.icon}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                  Next on your path: Step {activeNode.stepNumber}
                </span>
                <h4 className="text-sm font-extrabold text-stone-900 truncate">
                  {activeNode.title} ({activeNode.subtitle})
                </h4>
              </div>
            </div>

            <button
              onClick={() => handleNodeClick(activeNode)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 active:translate-y-0.5 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>Continue Journey</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </aside>
      )}

    </div>
  );
};
