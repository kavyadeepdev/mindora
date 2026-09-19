import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Target, RotateCcw, Sparkles } from 'lucide-react';
import { GameType } from '../../types';
import { AdaptiveResult } from '../../services/adaptiveEngine';
import { AudioSpeechService } from '../../services/audioSpeech';

interface GameResultModalProps {
  gameType: GameType;
  gameTitle: string;
  score: number;
  accuracy: number;
  responseTime: number;
  adaptiveResult: AdaptiveResult;
  isOffline: boolean;
  onPlayAgain: () => void;
  onReturnHome: () => void;
}

export const GameResultModal: React.FC<GameResultModalProps> = ({
  gameTitle,
  score,
  accuracy,
  responseTime,
  adaptiveResult,
  isOffline,
  onPlayAgain,
  onReturnHome
}) => {
  useEffect(() => {
    // Fire celebratory confetti for good effort
    try {
      confetti({
        particleCount: accuracy >= 80 ? 60 : 30,
        spread: 70,
        origin: { y: 0.6 }
      });
      AudioSpeechService.playChime('celebrate');
    } catch {
      // ignore
    }
  }, [accuracy]);

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 text-stone-800 animate-in fade-in zoom-in-95">
        
        {/* Header with badge */}
        <div className="text-center pb-5 border-b border-stone-100">
          <div className="w-18 h-18 mx-auto rounded-3xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-700 shadow-inner mb-3">
            <Trophy className="w-9 h-9" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Activity Completed
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-2 font-['Outfit']">
            {gameTitle}
          </h2>
          <p className="text-stone-600 text-sm mt-1">
            {adaptiveResult.patientMessage}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 my-5">
          <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center text-stone-500 mb-1">
              <Target className="w-4 h-4" />
            </div>
            <span className="text-xs text-stone-500 font-medium">Accuracy</span>
            <div className="text-2xl font-black text-stone-900">{accuracy}%</div>
          </div>

          <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center text-stone-500 mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xs text-stone-500 font-medium">Response</span>
            <div className="text-2xl font-black text-stone-900">{responseTime}s</div>
          </div>

          <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center text-amber-600 mb-1">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs text-stone-500 font-medium">Score</span>
            <div className="text-2xl font-black text-amber-800">{score}</div>
          </div>
        </div>

        {/* Gentle Rounds Completed Card */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              Activity Rounds Completed
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
              Session Finished
            </span>
          </div>
          <p className="text-xs text-stone-700 leading-relaxed font-medium">
            <strong className="text-emerald-950">Caregiver Note:</strong> {adaptiveResult.caregiverExplanation}
          </p>
          {isOffline && (
            <div className="mt-2 pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-900 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Saved in offline storage. Ready to reconcile when network returns.
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            id="game-result-retry-btn"
            onClick={onPlayAgain}
            className="w-full py-3.5 px-4 rounded-2xl border-2 border-stone-300 text-stone-800 font-bold text-base hover:bg-stone-100 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>

          <button
            id="game-result-continue-btn"
            onClick={onReturnHome}
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-600 text-white font-bold text-base hover:bg-amber-700 transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <span>Continue →</span>
          </button>
        </div>

      </div>
    </div>
  );
};
