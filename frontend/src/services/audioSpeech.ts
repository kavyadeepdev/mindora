/**
 * Audio and Speech Service for MINDORA
 * Supports Web Speech API (SpeechSynthesis & SpeechRecognition)
 * with audio tone synthesizer and simulated fallback for browsers/environments
 * that restrict microphone in sandboxed iframes.
 */

export class AudioSpeechService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;

  /**
   * Speak a friendly text message to the elderly user
   */
  static speak(text: string, language: 'en' | 'hi' | 'as' = 'en', onEnd?: () => void): void {
    if (!this.synth || typeof window === 'undefined') {
      if (onEnd) setTimeout(onEnd, 1000);
      return;
    }

    try {
      this.synth.cancel(); // stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; // slightly slower, clearer pace for elderly users
      utterance.pitch = 1.05; // calm, warm pitch

      if (language === 'hi') {
        utterance.lang = 'hi-IN';
      } else if (language === 'as') {
        // Many browsers don't have native Assamese TTS, fallback smoothly to Bengali/Hindi or English
        utterance.lang = 'bn-IN';
      } else {
        utterance.lang = 'en-IN';
      }

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error or blocked:', e);
      if (onEnd) onEnd();
    }
  }

  static stopSpeaking(): void {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Play gentle chime tone for confirmation / success using Web Audio API
   */
  static playChime(type: 'success' | 'tap' | 'celebrate' = 'tap'): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'tap') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'success') {
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
          gain.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.1);
          osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
        });
      } else if (type === 'celebrate') {
        [440, 554.37, 659.25, 880].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
          gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.12);
          osc.stop(ctx.currentTime + idx * 0.12 + 0.4);
        });
      }
    } catch {
      // AudioContext might be muted or restricted by browser autoplay policy
    }
  }

  /**
   * Check if SpeechRecognition is available in current browser
   */
  static isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    );
  }
}
