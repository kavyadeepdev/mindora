import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  HeartHandshake,
  Stethoscope,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Volume2,
  WifiOff,
  Languages,
  Flower2,
  Drum,
  Bird,
  CupSoda
} from 'lucide-react';
import { Language } from '../../types';
import { getTranslation } from '../../utils/translations';

interface LandingPageProps {
  onStartPatient: () => void;
  onOpenCaregiver: () => void;
  onOpenDoctor: () => void;
  language: Language;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const }
  })
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartPatient,
  onOpenCaregiver,
  onOpenDoctor,
  language
}) => {
  const reduce = useReducedMotion();

  return (
    <div className="bg-[#faf9f5] text-[#1c1917]">
      {/* HERO: asymmetric split, left copy and right photography */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 md:pt-16 pb-12">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-center">
          <motion.div
            variants={fadeUp}
            initial={reduce ? undefined : 'hidden'}
            animate={reduce ? undefined : 'show'}
            className="mindora-rise"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#e7e0d3] text-[12px] font-bold text-[#9a3412]">
              <span className="w-2 h-2 rounded-full bg-[#4d7c0f]" aria-hidden />
              Gentle care for every family
            </span>
            <h1 className="font-display font-medium text-4xl md:text-6xl leading-[1.05] mt-5 max-w-[12ch]">
              A familiar companion for memory and daily care.
            </h1>
            <p className="text-base md:text-lg text-[#44403c] leading-relaxed mt-4 max-w-[44ch]">
              Gentle activities, routine reminders and family telemetry in one calm place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <button
                id="landing-open-patient-btn"
                onClick={onStartPatient}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#9a3412] hover:bg-[#7c2d12] active:scale-[0.98] text-white font-bold text-sm min-h-[52px] transition"
              >
                Begin patient visit
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                id="landing-open-caregiver-btn"
                onClick={onOpenCaregiver}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white border border-[#e7e0d3] hover:bg-[#f5f0e8] active:scale-[0.98] font-bold text-sm min-h-[52px] transition"
              >
                <ShieldCheck className="w-4 h-4 text-[#9a3412]" />
                Open caretaker view
              </button>
            </div>
            <p className="text-[13px] text-[#78716c] mt-4 font-medium">
              {getTranslation('appTagline', language)}
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial={reduce ? undefined : 'hidden'}
            whileInView={reduce ? undefined : 'show'}
            viewport={{ once: true, amount: 0.3 }}
            className="relative"
          >
            <div className="rounded-[28px] overflow-hidden border border-[#e7e0d3] shadow-[0_18px_50px_rgba(154,52,18,0.12)] bg-white">
              {/* TODO: hero photo, calm morning garden, 880x1040 */}
              <img
                src="https://picsum.photos/seed/mindora-calm-morning/880/1040"
                alt="Morning light over a calm garden"
                className="w-full aspect-[5/6] sm:aspect-[4/4.4] object-cover"
                loading="eager"
              />
            </div>
            <div className="absolute -left-3 sm:-left-6 bottom-8 w-[62%] rounded-[20px] bg-white/95 backdrop-blur border border-[#e7e0d3] shadow-[0_18px_50px_rgba(28,25,23,0.14)] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#78716c]">Today's gentle plan</p>
              <ul className="mt-2 space-y-1.5 text-[13px] font-semibold">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#4d7c0f]" /> Familiar memory activity</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#4d7c0f]" /> Morning tea and medicine</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#e7e0d3]" /> Garden walk with family</li>
              </ul>
            </div>
            <div className="absolute -right-2 sm:-right-4 top-6 rounded-full bg-[#1c1917] text-white pl-2 pr-4 py-2 flex items-center gap-2 shadow-lg">
              <span className="w-8 h-8 rounded-full bg-[#4d7c0f] flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </span>
              <span className="text-[12px] font-bold">Voice guidance in 5 languages</span>
            </div>
          </motion.div>
        </div>

        {/* Trust bar lives under the hero, never inside it */}
        <div className="mt-10 flex flex-wrap items-center gap-2.5 text-[12px] font-bold text-[#6b5f52]">
          <span className="px-4 py-2 rounded-full bg-white border border-[#e7e0d3]">doctor portal</span>
          <span className="px-4 py-2 rounded-full bg-white border border-[#e7e0d3]">caretaker portal</span>
          <span className="px-4 py-2 rounded-full bg-[#9a3412] text-white border border-[#9a3412]">patient companion</span>
          <span className="px-4 py-2 rounded-full bg-[#f5f0e8] border border-[#e7e0d3] font-semibold">Offline ready</span>
        </div>
      </section>

      {/* BENTO: one calm home for three kinds of care */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20">
        <motion.div
          variants={fadeUp}
          initial={reduce ? undefined : 'hidden'}
          whileInView={reduce ? undefined : 'show'}
          viewport={{ once: true, amount: 0.3 }}
          className="max-w-2xl"
        >
          <h2 className="font-display font-medium text-3xl md:text-4xl leading-tight">One calm home for three kinds of care</h2>
          <p className="text-[#44403c] mt-3 leading-relaxed">Clinicians prescribe, families organise, elders enjoy. Each portal stays simple on purpose.</p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3 mt-8">
          <article className="rounded-[20px] bg-[#0f766e] text-white p-7 flex flex-col justify-between min-h-[320px] overflow-hidden relative">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/15 px-3 py-1 rounded-full">
                <Stethoscope className="w-3.5 h-3.5" /> Clinical
              </span>
              <h3 className="font-display text-2xl mt-4">Prescribe with a light touch</h3>
              <p className="text-sm text-white/85 mt-2 leading-relaxed">Choose activities, set round counts, follow progress trends without any clinical jargon for families.</p>
            </div>
            <button
              id="landing-open-doctor-btn"
              onClick={onOpenDoctor}
              className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-[#0f766e] font-bold text-sm min-h-[48px] hover:bg-[#dcf5f0] transition"
            >
              Open clinical view <ArrowRight className="w-4 h-4" />
            </button>
          </article>

          <article className="rounded-[20px] bg-white border border-[#e7e0d3] overflow-hidden flex flex-col min-h-[320px]">
            {/* TODO: caretaker photo, family kitchen, 640x400 */}
            <img
              src="https://picsum.photos/seed/mindora-family-kitchen/640/400"
              alt="Family sharing morning tea at home"
              className="w-full aspect-[16/10] object-cover"
              loading="lazy"
            />
            <div className="p-7">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-[#f5f0e8] text-[#6b5f52] px-3 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" /> Family
              </span>
              <h3 className="font-display text-2xl mt-3">Daily rhythm, held gently</h3>
              <p className="text-sm text-[#44403c] mt-2 leading-relaxed">Medicine, hydration and walk reminders. Pair the patient screen in one tap.</p>
            </div>
          </article>

          <article className="rounded-[20px] bg-[#fbe9dc] border border-[#e8c9b0] p-7 flex flex-col justify-between min-h-[320px]">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white px-3 py-1 rounded-full text-[#9a3412]">
                <HeartHandshake className="w-3.5 h-3.5" /> Elder
              </span>
              <h3 className="font-display text-2xl mt-4">Big buttons, kind words</h3>
              <p className="text-sm text-[#6b4a35] mt-2 leading-relaxed">Photo cards instead of passwords. Spoken hellos, no timers, no wrong answers.</p>
              <ul className="mt-4 space-y-2 text-[13px] font-semibold text-[#6b4a35]">
                <li className="flex items-center gap-2"><Volume2 className="w-4 h-4" /> Listen aloud everywhere</li>
                <li className="flex items-center gap-2"><WifiOff className="w-4 h-4" /> Keeps working offline</li>
                <li className="flex items-center gap-2"><Languages className="w-4 h-4" /> Five familiar languages</li>
              </ul>
            </div>
            <button
              onClick={onStartPatient}
              className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#9a3412] hover:bg-[#7c2d12] text-white font-bold text-sm min-h-[48px] transition"
            >
              Begin patient visit <ArrowRight className="w-4 h-4" />
            </button>
          </article>
        </div>
      </section>

      {/* CULTURE: full width photo band, asymmetric editorial */}
      <section className="bg-[#1c1917] text-[#faf9f5] rounded-[28px] mx-3 sm:mx-6 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-center">
          <div>
            <h2 className="font-display font-medium text-3xl md:text-4xl leading-tight">Made of familiar things</h2>
            <p className="text-[#c9c0b2] mt-3 leading-relaxed text-[15px]">Activities use objects elders already know. Tea cups, hand fans, garden flowers, festival drums. Recognition feels like home.</p>
          </div>
          <ul className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: CupSoda, title: 'Morning tea rituals', body: 'Tea time and garden walks set the daily rhythm.', img: 'https://picsum.photos/seed/mindora-morning-tea/560/420' },
              { icon: Flower2, title: 'Woven textiles and crafts', body: 'Familiar textures appear across memory cards.', img: 'https://picsum.photos/seed/mindora-woven-craft/560/420' },
              { icon: Drum, title: 'Festival music and drums', body: 'Celebration sounds cue joy, never pressure.', img: 'https://picsum.photos/seed/mindora-festival-drum/560/420' },
              { icon: Bird, title: 'Garden birds and trees', body: 'Birds, leaves and river scenes keep play familiar.', img: 'https://picsum.photos/seed/mindora-garden-birds/560/420' }
            ].map((c) => (
              <li key={c.title} className="rounded-[20px] overflow-hidden bg-white/5 border border-white/10">
                <img src={c.img} alt={c.title} className="w-full aspect-[4/3] object-cover" loading="lazy" />
                <div className="p-5">
                  <p className="flex items-center gap-2 font-bold text-[14px]"><c.icon className="w-4 h-4 text-[#e8a55a]" />{c.title}</p>
                  <p className="text-[13px] text-[#c9c0b2] mt-1.5 leading-relaxed">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FLOW: verb led, no numbered step labels */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20">
        <h2 className="font-display font-medium text-3xl md:text-4xl">How a day flows</h2>
        <div className="grid gap-5 md:grid-cols-3 mt-8">
          {[
            { verb: 'Prescribe', title: 'Doctor shapes the plan', body: 'The clinician picks activities and round counts for the week. Families see the same plan in plain words.' },
            { verb: 'Pair', title: 'Family connects the screen', body: 'The caretaker pairs the elder screen once. After that the elder just taps a photo to begin.' },
            { verb: 'Play', title: 'Elder enjoys at ease', body: 'Calm games, spoken guidance and reminders. Progress syncs quietly when signal returns.' }
          ].map((s) => (
            <article key={s.verb} className="rounded-[20px] bg-white border border-[#e7e0d3] p-7">
              <p className="font-display italic text-xl text-[#9a3412] pb-1">{s.verb}</p>
              <h3 className="font-bold text-lg mt-1">{s.title}</h3>
              <p className="text-sm text-[#44403c] mt-2 leading-relaxed">{s.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[20px] bg-[#f5f0e8] border border-[#e7e0d3] p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4">
          <ShieldCheck className="w-8 h-8 text-[#0f766e] shrink-0" />
          <p className="text-sm leading-relaxed text-[#44403c]">
            <strong className="text-[#1c1917]">A note on care.</strong> Mindora supports everyday engagement and routine. It does not diagnose, predict decline or replace a clinician. It gives families structure and clinicians gentle observational notes.
          </p>
        </div>
      </section>

      {/* CLOSER: editorial manifesto, centered is allowed here */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 pt-4 text-center">
        <h2 className="font-display font-medium text-3xl md:text-5xl leading-[1.08]">Slow mornings, familiar faces, steady care.</h2>
        <p className="text-[#44403c] mt-4 leading-relaxed">Begin with the patient screen. Everything else follows quietly.</p>
        <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={onStartPatient}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#9a3412] hover:bg-[#7c2d12] text-white font-bold text-sm min-h-[56px] transition"
          >
            Begin patient visit
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
