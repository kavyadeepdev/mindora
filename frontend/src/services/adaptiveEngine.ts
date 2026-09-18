import { GameType, AdaptiveDifficultyState, GameSession } from '../types';
import { StorageService } from './storage';

export interface AdaptiveResult {
  previousDifficulty: number;
  newDifficulty: number;
  adjusted: boolean;
  direction: 'increased' | 'decreased' | 'unchanged';
  patientMessage: string;
  caregiverExplanation: string;
  rollingAccuracy: number;
}

export class AdaptiveDifficultyEngine {
  /**
   * Evaluates session and adjusts difficulty using deterministic rules
   * based on recent rolling performance metrics.
   */
  static evaluatePerformance(
    gameType: GameType,
    currentSessionAccuracy: number,
    _responseTimeSeconds: number,
    _attempts: number
  ): AdaptiveResult {
    const states = StorageService.getAdaptiveStates();
    const currentState: AdaptiveDifficultyState = states[gameType] || {
      gameType,
      currentDifficulty: 2,
      recentAccuracyAverage: currentSessionAccuracy,
      historyExplanation: [],
      lastAdjustedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    };

    const previousDifficulty = currentState.currentDifficulty;

    // Fetch previous sessions for this specific game type to compute rolling recent accuracy
    const allSessions = StorageService.getSessions().filter(s => s.gameType === gameType);
    const recentAccuracies = [currentSessionAccuracy, ...allSessions.slice(0, 3).map(s => s.accuracy)];
    const rollingAccuracy = Math.round(
      recentAccuracies.reduce((sum, val) => sum + val, 0) / recentAccuracies.length
    );

    let newDifficulty = previousDifficulty;
    let direction: 'increased' | 'decreased' | 'unchanged' = 'unchanged';
    let patientMessage = 'Well done! You maintained steady focus and completed the challenge.';
    let caregiverExplanation = `Difficulty maintained at Level ${previousDifficulty} (Recent average accuracy: ${rollingAccuracy}%).`;

    // Core deterministic thresholds
    if (rollingAccuracy >= 85) {
      if (previousDifficulty < 5) {
        newDifficulty = previousDifficulty + 1;
        direction = 'increased';
        patientMessage = '🌟 Great job! Your next challenge will be slightly more engaging.';
        caregiverExplanation = `Difficulty promoted to Level ${newDifficulty} because patient recent accuracy reached ${rollingAccuracy}% (Threshold: ≥85%).`;
      } else {
        patientMessage = '🌟 Masterful performance! You are at the top challenge level.';
        caregiverExplanation = `Patient achieved ${rollingAccuracy}% accuracy. Already at peak engagement Level 5.`;
      }
    } else if (rollingAccuracy < 60) {
      if (previousDifficulty > 1) {
        newDifficulty = previousDifficulty - 1;
        direction = 'decreased';
        patientMessage = "🌸 Let's make the next challenge gentler and more comfortable.";
        caregiverExplanation = `Difficulty lowered to Level ${newDifficulty} because recent accuracy was ${rollingAccuracy}% (<60%), preserving confidence and reducing cognitive fatigue.`;
      } else {
        patientMessage = 'Comfortable pace maintained. Take as much calm time as you like.';
        caregiverExplanation = `Patient accuracy was ${rollingAccuracy}%. Kept at supportive foundational Level 1.`;
      }
    } else {
      // 60% - 84%: keep unchanged
      direction = 'unchanged';
      patientMessage = 'Wonderful effort! Your activity pace is well-balanced.';
      caregiverExplanation = `Difficulty kept at Level ${previousDifficulty} because patient accuracy was ${rollingAccuracy}% (Within optimal engagement window 60% - 84%).`;
    }

    const adjusted = newDifficulty !== previousDifficulty;
    const nowStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    // Update adaptive state
    const updatedHistory = [caregiverExplanation, ...(currentState.historyExplanation || [])].slice(0, 8);
    states[gameType] = {
      gameType,
      currentDifficulty: newDifficulty,
      recentAccuracyAverage: rollingAccuracy,
      historyExplanation: updatedHistory,
      lastAdjustedDate: nowStr
    };
    StorageService.saveAdaptiveStates(states);

    // If adjusted, create a caregiver alert
    if (adjusted) {
      StorageService.addAlert({
        id: `alert-diff-${Date.now()}`,
        type: 'info',
        title: `Difficulty Adjusted: ${this.getGameTitle(gameType)}`,
        message: caregiverExplanation,
        timestamp: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        read: false,
        actionLabel: 'Review Adaptive Engine'
      });
    }

    return {
      previousDifficulty,
      newDifficulty,
      adjusted,
      direction,
      patientMessage,
      caregiverExplanation,
      rollingAccuracy
    };
  }

  static getGameTitle(gameType: GameType): string {
    switch (gameType) {
      case 'memory':
        return 'Memory Match';
      case 'attention':
        return 'Attention Challenge';
      case 'pattern':
        return 'Pattern Recognition';
      case 'routine':
        return 'Daily Routine Recall';
    }
  }

  static getCurrentDifficulty(gameType: GameType): number {
    const states = StorageService.getAdaptiveStates();
    return states[gameType]?.currentDifficulty || 2;
  }
}
