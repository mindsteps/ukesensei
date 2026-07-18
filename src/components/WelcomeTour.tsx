import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

interface TourStep {
  emoji: string;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    emoji: '👋',
    title: 'Welcome to Uke Sensei',
    body:
      "This app listens through your microphone and gives you real-time feedback as you play -- notes, chords, and rhythm, all detected live. Let's take a 30-second look around.",
  },
  {
    emoji: '🎻',
    title: 'Pick your instrument',
    body:
      'The instrument switcher lives at the top left of the header. Uke, bass, and guitar get a fretboard and chord diagrams; clarinet and voice get pitch tracking; handpan and cajon get their own panels. Switch anytime -- your progress on each is kept separate.',
  },
  {
    emoji: '🎧',
    title: 'Free Play',
    body:
      "Hit Start Listening and just play. Detected notes light up as you go, and you can overlay a scale to see how what you're playing relates to it.",
  },
  {
    emoji: '📈',
    title: 'Exercises & Lessons',
    body:
      'Exercises are free-form -- pick a key, scale, or pattern and practice on your own clock. Lessons are structured: a guided curriculum with a checkpoint you pass to unlock the next one.',
  },
  {
    emoji: '🗂️',
    title: 'Library & sharing',
    body:
      'Practice sessions and recordings are saved to your Library so you can play them back later. From there you can also generate a link to share a session with someone else.',
  },
  {
    emoji: '✅',
    title: "You're all set",
    body:
      'That\'s the whole tour. If you want to see it again, open the menu next to your name (top right) and choose "Take the tour."',
  },
];

export function WelcomeTour() {
  const tourOpen = useAppStore((s) => s.tourOpen);
  const finishTour = useAppStore((s) => s.finishTour);
  const [step, setStep] = useState(0);

  if (!tourOpen) return null;

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const handleFinish = () => {
    finishTour();
    setStep(0);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome tour"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] shadow-xl p-6 sm:p-7 relative">
        <button
          onClick={handleFinish}
          aria-label="Skip tour"
          className="absolute top-4 right-4 text-xs font-medium text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition"
        >
          Skip
        </button>

        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-[var(--c-border)]'
              }`}
            />
          ))}
        </div>

        <span className="text-2xl">{current.emoji}</span>
        <h2
          className="text-2xl font-semibold text-[var(--c-text-strong)] mt-2 mb-3 tracking-tight"
          style={{ fontFamily: 'var(--font-arty)' }}
        >
          {current.title}
        </h2>
        <p className="text-sm text-[var(--c-text-muted)] leading-relaxed">{current.body}</p>

        <div className="flex items-center gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="px-4 py-2.5 rounded-xl text-sm text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition"
            >
              Back
            </button>
          )}
          <button
            onClick={() => (isLast ? handleFinish() : setStep((s) => Math.min(STEPS.length - 1, s + 1)))}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:from-emerald-500 hover:to-teal-500 transition"
          >
            {isLast ? 'Start playing' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
