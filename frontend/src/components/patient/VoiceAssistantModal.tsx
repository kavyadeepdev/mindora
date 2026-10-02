import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Volume2, Sparkles, MessageSquareQuote, Check } from 'lucide-react';
import { AudioSpeechService } from '../../services/audioSpeech';
import { AiAssistantService } from '../../services/aiAssistant';
import { Language } from '../../types';

interface VoiceAssistantModalProps {
  onClose: () => void;
  language: Language;
  onNavigateGame?: (gameType: 'memory' | 'attention' | 'pattern' | 'routine') => void;
  onViewReminders?: () => void;
}

interface ChatMessage {
  sender: 'user' | 'mindora';
  text: string;
  isAiGenerated?: boolean;
}

const PRESET_COMMANDS = [
  'When should I take my medicine?',
  'What is my next activity?',
  'Start today\'s memory game.',
  'Show my reminders.',
  'How did I perform today?'
];

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  onClose,
  language,
  onNavigateGame,
  onViewReminders
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'mindora',
      text: 'Good morning Anima! I am MINDORA, your daily companion. You can ask me about your medicine, your routine, or start your daily game.'
    }
  ]);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initial friendly greeting aloud
    AudioSpeechService.speak(messages[0].text, language);

    // Setup speech recognition if supported
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const reco = new SpeechRecognition();
        reco.continuous = false;
        reco.interimResults = false;
        reco.lang = language === 'hi' ? 'hi-IN' : language === 'as' ? 'bn-IN' : 'en-IN';

        reco.onresult = (event: any) => {
          const speechResult = event.results[0][0].transcript;
          setTranscript(speechResult);
          setIsListening(false);
          handleSendQuery(speechResult);
        };

        reco.onerror = () => {
          setIsListening(false);
        };

        reco.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = reco;
      } catch (e) {
        console.warn('Speech recognition setup error:', e);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      AudioSpeechService.stopSpeaking();
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
    } else {
      AudioSpeechService.stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
          return;
        } catch {
          // fallback to simulation
        }
      }
      // If mic API unavailable in sandbox iframe, use friendly prompt
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        const randomCommand = PRESET_COMMANDS[Math.floor(Math.random() * PRESET_COMMANDS.length)];
        handleSendQuery(randomCommand);
      }, 1500);
    }
  };

  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    // Append user message
    const updatedMessages: ChatMessage[] = [...messages, { sender: 'user', text: queryText }];
    setMessages(updatedMessages);
    setIsThinking(true);

    try {
      const response = await AiAssistantService.askVoiceAssistant(queryText);
      const newMessages: ChatMessage[] = [
        ...updatedMessages,
        {
          sender: 'mindora',
          text: response.answer,
          isAiGenerated: response.isAiGenerated
        }
      ];
      setMessages(newMessages);
      setIsThinking(false);

      // Speak answer aloud warmly
      AudioSpeechService.speak(response.answer, language);

      // Check for navigation commands
      const lower = queryText.toLowerCase();
      if ((lower.includes('start') || lower.includes('play')) && lower.includes('memory')) {
        setTimeout(() => {
          if (onNavigateGame) onNavigateGame('memory');
          onClose();
        }, 2200);
      } else if (lower.includes('show') && lower.includes('reminder')) {
        setTimeout(() => {
          if (onViewReminders) onViewReminders();
          onClose();
        }, 2000);
      }
    } catch {
      setIsThinking(false);
      const fallback = 'I am here with you. Your next reminder is your morning water at 10:30 AM.';
      setMessages([...updatedMessages, { sender: 'mindora', text: fallback }]);
      AudioSpeechService.speak(fallback, language);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 text-stone-800 animate-in fade-in flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900 font-['Outfit']">
                Talk to MINDORA
              </h2>
              <p className="text-xs text-stone-500">
                Voice Assistant for Reminders, Activities & Routine
              </p>
            </div>
          </div>

          <button
            id="voice-close-btn"
            onClick={() => {
              AudioSpeechService.stopSpeaking();
              onClose();
            }}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Conversation Transcript Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-[220px]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm sm:text-base leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-amber-600 text-white rounded-br-xs font-semibold'
                    : 'bg-stone-100 text-stone-900 rounded-bl-xs border border-stone-200/80 font-medium'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs opacity-75 font-bold uppercase tracking-wider">
                    {m.sender === 'user' ? 'Anima' : 'MINDORA'}
                  </span>
                  {m.sender === 'mindora' && (
                    <button
                      onClick={() => AudioSpeechService.speak(m.text, language)}
                      className="text-stone-500 hover:text-amber-700 p-0.5"
                      title="Replay speech"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p>{m.text}</p>
                {m.isAiGenerated && (
                  <div className="mt-1 text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded inline-block font-semibold">
                    AI-Assisted
                  </div>
                )}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-stone-100 rounded-2xl p-3 border border-stone-200 text-xs text-stone-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-bounce [animation-delay:0.4s]" />
                <span>MINDORA is thinking calmly...</span>
              </div>
            </div>
          )}
        </div>

        {/* Large Microphone Centerpiece */}
        <div className="pt-4 border-t border-stone-100 text-center">
          <div className="mb-4">
            <button
              id="voice-mic-main-btn"
              onClick={toggleListening}
              className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center transition shadow-lg cursor-pointer transform active:scale-95 ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse ring-8 ring-rose-200'
                  : 'bg-amber-600 text-white hover:bg-amber-700 ring-6 ring-amber-100'
              }`}
              title="Click to speak"
            >
              {isListening ? <Mic className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
            </button>
            <div className="mt-2 text-xs font-bold text-stone-700">
              {isListening ? 'Listening to your voice... Speak now' : 'Tap to Speak to MINDORA'}
            </div>
          </div>

          {/* Quick elderly command chips */}
          <div className="text-left">
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
              Or tap a common question:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COMMANDS.map((cmd, idx) => (
                <button
                  key={idx}
                  id={`voice-preset-${idx}`}
                  onClick={() => handleSendQuery(cmd)}
                  className="text-xs bg-stone-100 hover:bg-amber-100 text-stone-800 border border-stone-200 hover:border-amber-300 px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
