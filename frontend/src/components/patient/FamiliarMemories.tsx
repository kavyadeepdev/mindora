import React from 'react';
import { ArrowLeft, Volume2, Sparkles, Heart } from 'lucide-react';
import { Language } from '../../types';
import { AudioSpeechService } from '../../services/audioSpeech';
import { getTranslation } from '../../utils/translations';

interface FamiliarMemoriesProps {
  onBack: () => void;
  language: Language;
}

interface MemoryItem {
  id: string;
  title: string;
  titleAssamese: string;
  titleHindi: string;
  titleBengali: string;
  titleKannada: string;
  location: string;
  emoji: string;
  story: string;
  storyAssamese: string;
  storyHindi: string;
  storyBengali: string;
  storyKannada: string;
  tags: string[];
}

const MEMORIES: MemoryItem[] = [
  {
    id: 'kopou',
    title: 'Foxtail Orchid Blossoms',
    titleAssamese: 'বসন্তৰ কপৌ ফুল',
    titleHindi: 'वसंत के सुंदर ऑर्किड',
    titleBengali: 'বসন্তের সুবাসিত অর্কিড',
    titleKannada: 'ವಸಂತದ ಸುಂದರ ಆರ್ಕಿಡ್ ಹೂವುಗಳು',
    location: 'Gardens & Green Trees',
    emoji: '🌸',
    story: 'The delicate pink orchid blooms every spring on old mango and jackfruit trees, spreading a gentle scent across the peaceful courtyard.',
    storyAssamese: 'বসন্তৰ আগমনত গছৰ ডালত ফুলা সুবাসিত কপৌ ফুল। চোতালত বিহুৰ আনন্দ আৰু মলয়া বতাহৰ সতে ই এক স্নিগ্ধ পৰিৱেশ সৃষ্টি কৰে।',
    storyHindi: 'वसंत के आगमन पर आम और कटहल के पेड़ों पर खिलने वाले गुलाबी ऑर्किड, जो आंगन में मीठी खुशबू फैलाते हैं।',
    storyBengali: 'বসন্তের শুরুতে আম ও কাঁঠাল গাছে ফোটা মিষ্টি গোলাপি অর্কিড ফুল, যা উঠোনে এক অপূর্ব স্নিগ্ধতা ছড়ায়।',
    storyKannada: 'ವಸಂತ ಋತುವಿನಲ್ಲಿ ಮರಗಳ ಮೇಲೆ ಅರಳುವ ಗುಲಾಬಿ ಬಣ್ಣದ ಆರ್ಕಿಡ್ ಹೂವುಗಳು ಅಂಗಳದಲ್ಲಿ ತಂಪಾದ ಸುಗಂಧವನ್ನು ಹರಡುತ್ತವೆ.',
    tags: ['Nature', 'Flowers', 'Springtime']
  },
  {
    id: 'tea-estate',
    title: 'Misty Green Tea Gardens',
    titleAssamese: 'সেউজ চাহ বাগিচা',
    titleHindi: 'हरे-भरे चाय के बागान',
    titleBengali: 'সবুজ চা বাগান',
    titleKannada: 'ಹಚ್ಚ ಹಸಿರಿನ ಚಹಾ ತೋಟಗಳು',
    location: 'Hills & Gentle Valleys',
    emoji: '🍵',
    story: 'Gentle morning fog rolling over miles of lush green tea shrubs, followed by the comforting warmth of a fresh golden cup of tea.',
    storyAssamese: 'পুৱাৰ সেউজীয়া চাহ গছৰ পাতৰ সুগন্ধি আৰু কুঁৱলীৰ মাজত সোণালী ৰঙৰ চাহৰ একাপ তৃপ্তি।',
    storyHindi: 'सुबह की हल्की धुंध के बीच फैली हरी-भरी चाय की पत्तियां और उसके बाद गरमा-गरम चाय की चुस्की का सुकून।',
    storyBengali: 'ভোরের কুয়াশায় ঘেরা সবুজ চা বাগান এবং এক কাপ তাজা গরম চায়ের তৃপ্তি।',
    storyKannada: 'ಮುಂಜಾನೆಯ ಮಂಜಿನಲ್ಲಿ ಕಂಗೊಳಿಸುವ ಹಸಿರು ಚಹಾ ಗಿಡಗಳು ಮತ್ತು ಬೆಚ್ಚಗಿನ ರುಚಿಕರ ಚಹಾದ ಅನುಭವ.',
    tags: ['Tea Gardens', 'Morning Routine', 'Nature']
  },
  {
    id: 'majuli-mask',
    title: 'Handcrafted Heritage Masks',
    titleAssamese: 'ঐতিহ্যমণ্ডিত মুখাশিল্প',
    titleHindi: 'हस्तनिर्मित पारंपरिक मुखौटे',
    titleBengali: 'ঐতিহ্যবাহী হস্তশিল্পের মুখোশ',
    titleKannada: 'ಪಾರಂಪರಿಕ ಕಲಾತ್ಮಕ ಮುಖವಾಡಗಳು',
    location: 'River Island & Craft Villages',
    emoji: '🎭',
    story: 'Carved with devotion out of bamboo and clay by skilled traditional artisans, bringing to life beloved sacred folklore.',
    storyAssamese: 'বাঁহ আৰু বোকাৰে তৈয়াৰী ঐতিহ্যমণ্ডিত ভাওনাৰ পবিত্ৰ মুখাশিল্প। শ্ৰীমন্ত শংকৰদেৱৰ অনুপম সংস্কৃতি।',
    storyHindi: 'बांस और मिट्टी से बने पारंपरिक कलात्मक मुखौटे, जो सांस्कृतिक लोकनाटकों को जीवंत बनाते हैं।',
    storyBengali: 'বাঁশ ও কাদা মাটির নিখুঁত কারুকাজে তৈরি ঐতিহ্যবাহী পৌরাণিক মুখোশ।',
    storyKannada: 'ಬಿದಿರು ಮತ್ತು ಜೇಡಿಮಣ್ಣಿನಿಂದ ಕಲಾತ್ಮಕವಾಗಿ ತಯಾರಿಸಿದ ಪಾರಂಪರಿಕ ಸಾಂಸ್ಕೃತಿಕ ಮುಖವಾಡಗಳು.',
    tags: ['Craft', 'Art', 'Heritage']
  },
  {
    id: 'bihu-dhol',
    title: 'Melodious Festive Drums & Flutes',
    titleAssamese: 'বিহু ঢোল আৰু পেঁপা',
    titleHindi: 'उत्सव के ढोल और मधुर बांसुरी',
    titleBengali: 'উৎসবের ঢোল ও মধুর বাঁশি',
    titleKannada: 'ಹಬ್ಬದ ನಾದಮಯ ಡ್ರಮ್ ಮತ್ತು ಕೊಳಲು',
    location: 'Open Courtyards & Green Fields',
    emoji: '🥁',
    story: 'The heartwarming, joyous rhythm of handcrafted wooden drums and flutes echoing across open fields to celebrate spring and harvest.',
    storyAssamese: 'বহাগৰ বতৰত আকাশ বতাহ কঁপাই তোলা ঢোলৰ চাপৰ আৰু পেঁপাৰ সুৰীয়া তান, যিয়ে আনন্দ কঢ়িয়াই আনে।',
    storyHindi: 'फसल और नववर्ष के आगमन पर बजने वाले ढोल और बांसुरी की मधुर धुन जो मन में खुशी भर देती है।',
    storyBengali: 'নতুন ফসল ও উৎসবের আনন্দে বাজা ঢোল ও বাঁশির মিষ্টি সুর।',
    storyKannada: 'ಸುಗ್ಗಿಯ ಹಬ್ಬದ ಸಂಭ್ರಮದಲ್ಲಿ ಮೊಳಗುವ ನಾದಮಯ ಡ್ರಮ್ ಮತ್ತು ಕೊಳಲಿನ ಮಧುರ ಧ್ವನಿ.',
    tags: ['Music', 'Celebration', 'Spring']
  }
];

export const FamiliarMemories: React.FC<FamiliarMemoriesProps> = ({ onBack, language }) => {
  const getStory = (m: MemoryItem) => {
    if (language === 'as') return m.storyAssamese;
    if (language === 'hi') return m.storyHindi;
    if (language === 'bn') return m.storyBengali;
    if (language === 'kn') return m.storyKannada;
    return m.story;
  };

  const getTitle = (m: MemoryItem) => {
    if (language === 'as') return m.titleAssamese;
    if (language === 'hi') return m.titleHindi;
    if (language === 'bn') return m.titleBengali;
    if (language === 'kn') return m.titleKannada;
    return m.title;
  };

  const handleReadStory = (m: MemoryItem) => {
    const text = getStory(m);
    AudioSpeechService.speak(text, language);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
        <button
          id="memories-back-btn"
          onClick={onBack}
          className="px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-stone-700 font-bold text-sm hover:bg-stone-50 flex items-center gap-2 shadow-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{getTranslation('backToHome', language)}</span>
        </button>

        <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
          {getTranslation('reminiscenceTagline', language)}
        </span>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-['Outfit'] mb-2">
          {getTranslation('familiarMemories', language)}
        </h1>
        <p className="text-stone-600 text-base max-w-xl mx-auto">
          {getTranslation('familiarMemoriesSubtitle', language)}
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MEMORIES.map((item) => (
          <div
            key={item.id}
            className="bg-white border-2 border-stone-200/90 rounded-3xl p-6 shadow-xs hover:border-amber-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-4xl shadow-inner">
                  {item.emoji}
                </div>
                <button
                  id={`read-story-${item.id}`}
                  onClick={() => handleReadStory(item)}
                  className="p-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 flex items-center gap-1.5 text-xs font-bold transition cursor-pointer"
                  title={getTranslation('listenAloud', language)}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{getTranslation('listen', language)}</span>
                </button>
              </div>

              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                {item.location}
              </span>

              <h2 className="text-xl font-bold text-stone-900 mt-2 font-['Outfit']">
                {getTitle(item)}
              </h2>

              <p className="text-stone-600 text-sm mt-2 leading-relaxed">
                {getStory(item)}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap gap-1.5">
              {item.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
