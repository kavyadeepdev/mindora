import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ChevronRight, X, Play, RefreshCw, AlertCircle } from 'lucide-react';
import { StorageService } from '../../services/storage';

interface DemoStoryGuideProps {
  onClose: () => void;
  onSelectStep: (stepNumber: number) => void;
  currentStep: number;
}

const STEPS = [
  { step: 1, title: 'Open Patient Mode', desc: 'Display elderly-friendly home interface with large touch targets.' },
  { step: 2, title: 'Show Personalized Greeting', desc: '"Good morning, Anima 👋" with 80% daily progress bar.' },
  { step: 3, title: 'Start Memory Match', desc: 'Launch Game 1 featuring familiar cultural objects (Flowers, traditional crafts, tea garden motifs).' },
  { step: 4, title: 'Complete The Game', desc: 'Memorize objects within 5s, card hide, and identify target.' },
  { step: 5, title: 'Show Accuracy & Response Time', desc: 'Detailed post-game metrics (e.g. 88% accuracy, 4.2s time).' },
  { step: 6, title: 'Adaptive Engine Adjusts Difficulty', desc: 'Deterministic engine: ≥85% boosts difficulty from Level 2 to Level 3.' },
  { step: 7, title: 'Show Personalized Encouragement', desc: 'Reassuring feedback tailored to elderly comfort.' },
  { step: 8, title: 'Voice Assistant ("When is my medicine?")', desc: 'Query MINDORA via microphone or one-tap quick command.' },
  { step: 9, title: 'Show Medicine Reminder', desc: 'Voice & UI confirms 9:00 AM medicine reminder with action button.' },
  { step: 10, title: 'Switch to Caregiver Dashboard', desc: 'Access comprehensive multi-metric oversight for health worker/family.' },
  { step: 11, title: "Show Today's Completed Session", desc: 'Displays 85% completion, 82% average accuracy, High engagement.' },
  { step: 12, title: 'Show 7-Day Performance Trend', desc: 'Chart showing activity performance trend (NOT dementia severity).' },
  { step: 13, title: 'Show Adaptive Difficulty History', desc: 'Log explains why level changed based on recent scores.' },
  { step: 14, title: 'Toggle Offline Mode', desc: 'Simulate low-connectivity environment with zero network dependency.' },
  { step: 15, title: 'Complete Another Activity Offline', desc: 'Play attention or pattern game fully offline locally.' },
  { step: 16, title: 'Show "Activities Ready to Sync"', desc: 'Visual queue & one-tap sync reconciliation to cloud when network returns.' }
];

export const DemoStoryGuide: React.FC<DemoStoryGuideProps> = ({
  onClose,
  onSelectStep,
  currentStep
}) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([1, 2]);

  const toggleStepDone = (num: number) => {
    if (completedSteps.includes(num)) {
      setCompletedSteps(completedSteps.filter(s => s !== num));
    } else {
      setCompletedSteps([...completedSteps, num]);
    }
  };

  return (
    <aside aria-label="Guided product walkthrough" className="bg-stone-900 text-stone-100 border-b border-stone-800 p-4 shadow-xl">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Guided Product Tour & Interactive Walkthrough
                <span className="text-[11px] font-normal text-amber-300 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded-full">
                  16 Interactive Steps
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Click any step below to explore key features for patients, families, and caregivers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                StorageService.resetToDemo();
                window.location.reload();
              }}
              className="px-2.5 py-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg flex items-center gap-1 transition"
              title="Reset state to pristine demo"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Demo
            </button>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition"
              title="Close guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Steps Grid Carousel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 mt-3 overflow-x-auto pb-1">
          {STEPS.map((s) => {
            const isActive = currentStep === s.step;
            const isDone = completedSteps.includes(s.step);

            return (
              <div
                key={s.step}
                onClick={() => {
                  toggleStepDone(s.step);
                  onSelectStep(s.step);
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                  isActive
                    ? 'bg-amber-600/20 border-amber-500 text-white shadow-xs'
                    : isDone
                    ? 'bg-stone-800/80 border-emerald-800/60 text-stone-300 hover:bg-stone-800'
                    : 'bg-stone-800/40 border-stone-700/60 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-700/60 text-stone-200">
                      Step {s.step}
                    </span>
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-stone-600" />
                    )}
                  </div>
                  <h3 className="text-xs font-bold leading-tight mb-1 text-stone-100 line-clamp-1">
                    {s.title}
                  </h3>
                  <p className="text-[10px] text-stone-400 line-clamp-2 leading-snug">
                    {s.desc}
                  </p>
                </div>
                <div className="mt-2 pt-1.5 border-t border-stone-700/40 flex items-center justify-between text-[10px] text-amber-400 font-medium">
                  <span>Run Step</span>
                  <Play className="w-2.5 h-2.5 fill-amber-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
