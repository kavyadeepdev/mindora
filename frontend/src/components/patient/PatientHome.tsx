import React, { useState } from 'react';
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
  Clock
} from 'lucide-react';
import { Language, PatientProfile, Reminder, GameSession } from '../../types';
import { getTranslation } from '../../utils/translations';
import { AudioSpeechService } from '../../services/audioSpeech';
import { StorageService } from '../../services/storage';

interface PatientHomeProps {
  patient: PatientProfile;
  reminders: Reminder[];
  onToggleReminder: (reminderId: string) => void;
  onStartGame: (gameType: 'memory' | 'attention' | 'pattern' | 'routine') => void;
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
  const [completedMemory, setCompletedMemory] = useState(true);

  const getGreeting = () => {
    if (language === 'as') return `শুভ প্ৰভাত, ${patient.name} 👋`;
    if (language === 'hi') return `सुप्रभात, ${patient.name} 👋`;
    return `Good morning, ${patient.name} 👋`;
  };

  const speakGreeting = () => {
    AudioSpeechService.speak(
      `${getGreeting()}. Today you have 4 gentle activities and your routine reminders. You are doing wonderful.`,
      language
    );
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'medicine':
        return <Pill className="w-6 h-6 text-rose-600" />;
      case 'hydration':
        return <Droplet className="w-6 h-6 text-sky-600" />;
      case 'activity':
        return <Footprints className="w-6 h-6 text-emerald-600" />;
      case 'appointment':
        return <Calendar className="w-6 h-6 text-amber-600" />;
      default:
        return <Clock className="w-6 h-6 text-stone-600" />;
    }
  };

  const getReminderTitle = (r: Reminder) => {
    if (language === 'as' && r.titleAssamese) return r.titleAssamese;
    if (language === 'hi' && r.titleHindi) return r.titleHindi;
    return r.title;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {/* Patient Greeting & Supportive Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-stone-50 rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/90 px-3 py-1 rounded-full border border-amber-200">
              {patient.location}
            </span>
            <button
              id="patient-speak-greeting-btn"
              onClick={speakGreeting}
              className="p-1 text-stone-500 hover:text-amber-800 transition"
              title="Listen aloud"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-['Outfit']">
            {getGreeting()}
          </h1>
          <p className="text-stone-600 text-base sm:text-lg mt-1 max-w-xl font-medium">
            Welcome to your calm daily space. Let's spend a few peaceful minutes together.
          </p>
        </div>

        {/* Big Voice Assistant Button */}
        <div className="w-full md:w-auto shrink-0">
          <button
            id="patient-ask-mindora-btn"
            onClick={onOpenVoiceAssistant}
            className="w-full md:w-auto py-4 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-lg shadow-lg flex items-center justify-center gap-3 transition transform hover:scale-102 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Mic className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-amber-100 uppercase tracking-wider">
                Voice Companion
              </div>
              <div className="text-lg font-black leading-tight">
                🎙️ {getTranslation('askMindora', language)}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Today's Progress Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-stone-900">
              {getTranslation('todaysProgress', language)}
            </h2>
          </div>
          <span className="text-base font-extrabold text-amber-800 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
            80% Completed
          </span>
        </div>

        {/* Visual Progress Bar (as specified in prompt: ████████░░ 80%) */}
        <div className="w-full bg-stone-100 rounded-2xl h-4 overflow-hidden p-0.5 border border-stone-200">
          <div
            className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-xl transition-all duration-700"
            style={{ width: '80%' }}
          />
        </div>
        <p className="text-stone-500 text-xs sm:text-sm mt-2 font-medium">
          🌟 Wonderful work, Anima! You completed 4 daily routine steps and your morning memory exercise.
        </p>
      </div>

      {/* Main 2-Column Layout: Activities on Left, Reminders on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Today's Activities (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <h2 className="text-xl font-extrabold text-stone-900 font-['Outfit'] flex items-center gap-2">
              <Brain className="w-5 h-5 text-amber-700" />
              {getTranslation('todaysActivities', language)}
            </h2>
            <span className="text-xs text-stone-500 font-medium">Adaptive difficulty enabled</span>
          </div>

          {/* Activity 1: Memory Activity */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-stone-200 hover:border-amber-300 transition shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-3xl shrink-0">
                🧠
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-stone-900">
                    {getTranslation('memoryActivity', language)}
                  </h3>
                  <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </span>
                </div>
                <p className="text-stone-600 text-sm mt-0.5">
                  Familiar flowers & objects from Anima's Assam garden.
                </p>
              </div>
            </div>

            <button
              id="patient-start-memory-btn"
              onClick={() => onStartGame('memory')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>Play Again</span>
              <Play className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Activity 2: Attention Activity */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-amber-300/80 bg-amber-50/20 hover:border-amber-400 transition shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-3xl shrink-0">
                🎯
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-stone-900">
                    {getTranslation('attentionActivity', language)}
                  </h3>
                  <span className="text-[11px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    ○ Up Next
                  </span>
                </div>
                <p className="text-stone-600 text-sm mt-0.5">
                  Spot and tap all the red items with calm focus.
                </p>
              </div>
            </div>

            <button
              id="patient-start-attention-btn"
              onClick={() => onStartGame('attention')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-base shadow-sm transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>{getTranslation('start', language)}</span>
              <Play className="w-4 h-4 fill-white" />
            </button>
          </div>

          {/* Activity 3: Pattern Activity */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-stone-200 hover:border-amber-300 transition shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-3xl shrink-0">
                🧩
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  {getTranslation('patternActivity', language)}
                </h3>
                <p className="text-stone-600 text-sm mt-0.5">
                  Traditional Gamosa border & sequence recognition.
                </p>
              </div>
            </div>

            <button
              id="patient-start-pattern-btn"
              onClick={() => onStartGame('pattern')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>{getTranslation('start', language)}</span>
              <Play className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Activity 4: Daily Routine Recall */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-stone-200 hover:border-amber-300 transition shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-3xl shrink-0">
                📋
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  {getTranslation('routineActivity', language)}
                </h3>
                <p className="text-stone-600 text-sm mt-0.5">
                  Anima's morning routine reconstruction.
                </p>
              </div>
            </div>

            <button
              id="patient-start-routine-btn"
              onClick={() => onStartGame('routine')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>{getTranslation('start', language)}</span>
              <Play className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Familiar Memories Card Banner */}
          <div 
            onClick={onOpenMemories}
            className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 transition cursor-pointer flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌸</span>
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  {getTranslation('familiarMemories', language)}
                </h3>
                <p className="text-xs text-stone-600">
                  Explore familiar photos, tea gardens, traditional crafts & festive melodies
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-700" />
          </div>
        </div>

        {/* Right Column: Reminders (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <h2 className="text-xl font-extrabold text-stone-900 font-['Outfit'] flex items-center gap-2">
              <span>🔔</span>
              {getTranslation('reminders', language)}
            </h2>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Today's Schedule
            </span>
          </div>

          {/* Reminders List */}
          <div className="space-y-3">
            {reminders.map((rem) => {
              const isDone = rem.status === 'completed';

              return (
                <div
                  key={rem.id}
                  id={`reminder-card-${rem.id}`}
                  className={`p-4 sm:p-5 rounded-3xl border-2 transition shadow-xs flex items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-stone-50 border-stone-200 opacity-80'
                      : 'bg-white border-amber-200/90 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center shrink-0">
                      {getReminderIcon(rem.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md">
                          {rem.time}
                        </span>
                        {isDone && (
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        )}
                      </div>
                      <h3 className={`font-bold text-base mt-1 ${isDone ? 'line-through text-stone-500' : 'text-stone-900'}`}>
                        {getReminderTitle(rem)}
                      </h3>
                      {rem.notes && (
                        <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{rem.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Mark as Done Toggle Button */}
                  <button
                    id={`reminder-toggle-${rem.id}`}
                    onClick={() => {
                      AudioSpeechService.playChime('tap');
                      onToggleReminder(rem.id);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300/60'
                        : 'bg-amber-600 hover:bg-amber-700 active:scale-95 text-white shadow-xs'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <span>Mark Done</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Reassuring Note for Elderly Users */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5">
            <Heart className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              Take your time with every activity. There is no rush, no countdown pressure, and no wrong answers. Everything is here to support your daily rhythm.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
