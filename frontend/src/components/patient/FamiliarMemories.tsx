import React from 'react';
import { ArrowLeft, Volume2, Sparkles, Heart } from 'lucide-react';
import { Language } from '../../types';
import { AudioSpeechService } from '../../services/audioSpeech';

interface FamiliarMemoriesProps {
  onBack: () => void;
  language: Language;
}

interface MemoryItem {
  id: string;
  title: string;
  titleAssamese: string;
  location: string;
  emoji: string;
  story: string;
  storyAssamese: string;
  tags: string[];
}

const MEMORIES: MemoryItem[] = [
  {
    id: 'kopou',
    title: 'Kopou Orchid Blossoms (কপৌ ফুল)',
    titleAssamese: 'বসন্তৰ কপৌ ফুল',
    location: 'Dibrugarh & Sibsagar Gardens',
    emoji: '🌸',
    story: 'The delicate pink Kopou orchid blooms every spring on old mango and jackfruit trees. In Assam, its fragrant petals are lovingly tucked into braided hair during Rongali Bihu dances.',
    storyAssamese: 'বসন্তৰ আগমনত গছৰ ডালত ফুলা সুবাসিত কপৌ ফুল। বিহু নাচনৰ খোপাত কপৌ ফুল গুজি অসমীয়া জীয়ৰীসকলে বিহু উদযাপন কৰে।',
    tags: ['Nature', 'Flowers', 'Bihu Tradition']
  },
  {
    id: 'tea-estate',
    title: 'Misty Tea Gardens of Upper Assam',
    titleAssamese: 'উজনি অসমৰ সেউজ চাহ বাগিচা',
    location: 'Jorhat & Dibrugarh',
    emoji: '🍵',
    story: 'Gentle morning fog rolling over miles of lush green tea shrubs. The rhythmic sound of fresh two leaves and a bud being plucked into cane baskets, followed by a warm cup of rich golden brew.',
    storyAssamese: 'পুৱাৰ সেউজীয়া চাহ গছৰ পাতৰ সুগন্ধি। দুপতীয়া এনুখিলা চাহপাতৰ সতে সোণালী ৰঙৰ চাহৰ একাপ তৃপ্তি।',
    tags: ['Tea Gardens', 'Morning Routine', 'Upper Assam']
  },
  {
    id: 'majuli-mask',
    title: 'Traditional Majuli Sattras & Masks',
    titleAssamese: 'মাজুলীৰ মুখাশিল্প আৰু সত্ৰ',
    location: 'Majuli River Island',
    emoji: '🎭',
    story: 'Carved out of bamboo, clay, and cloth by master artisans in Samaguri Sattra. These masks bring to life mythological characters in sacred Bhaona plays under temple lights.',
    storyAssamese: 'মাজুলীৰ চামগুৰি সত্ৰৰ বাঁহ আৰু বোকাৰে তৈয়াৰী ঐতিহ্যমণ্ডিত ভাওনাৰ মুখা। শ্ৰীমন্ত শংকৰদেৱৰ পবিত্ৰ সংস্কৃতি।',
    tags: ['Craft', 'Majuli', 'Bhaona Heritage']
  },
  {
    id: 'bihu-dhol',
    title: 'Bihu Dhol & Pepa Symphony',
    titleAssamese: 'বিহু ঢোল আৰু মহৰ শিঙৰ পেঁপা',
    location: 'Assam Valley',
    emoji: '🥁',
    story: 'The thunderous beat of the handcrafted wooden dhol drum paired with buffalo horn pepa echoing across paddy fields to welcome the New Year and bountiful harvest.',
    storyAssamese: 'বহাগৰ বতৰত আকাশ বতাহ কপাই তোলা ঢোলৰ চাপৰ আৰু পেঁপাৰ সুৰীয়া তান।',
    tags: ['Music', 'Harvest', 'Celebration']
  }
];

export const FamiliarMemories: React.FC<FamiliarMemoriesProps> = ({ onBack, language }) => {
  const handleReadStory = (m: MemoryItem) => {
    const text = language === 'as' ? m.storyAssamese : m.story;
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
          <span>Back to Home</span>
        </button>

        <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
          Reminiscence & Cultural Comfort
        </span>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-['Outfit'] mb-2">
          Familiar Memories of the North East
        </h1>
        <p className="text-stone-600 text-base max-w-xl mx-auto">
          Calm reflections and cherished traditions from Assam and the Brahmaputra valley. Tap the speaker to listen to each story.
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
                  title="Listen to story aloud"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Listen</span>
                </button>
              </div>

              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                {item.location}
              </span>

              <h2 className="text-xl font-bold text-stone-900 mt-2 font-['Outfit']">
                {language === 'as' ? item.titleAssamese : item.title}
              </h2>

              <p className="text-stone-600 text-sm mt-2 leading-relaxed">
                {language === 'as' ? item.storyAssamese : item.story}
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
