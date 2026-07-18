import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

interface TourStep {
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    title: 'Welcome to Uke Sensei',
    body:
      "This app listens through your microphone and gives you real-time feedback as you play -- notes, chords, and rhythm, all detected live. Here's a quick look around.",
  },
  {
    title: 'Pick your instrument',
    body:
      'The switcher lives at the top left of the header. Uke, bass, and guitar get a fretboard and chord diagrams; clarinet and voice get pitch tracking; handpan and cajón get their own panels. Switch anytime -- progress on each is kept separate.',
  },
  {
    title: 'Free Play',
    body:
      "Hit Start Listening and just play. Detected notes light up as you go, and you can overlay a scale to see how what you're playing relates to it.",
  },
  {
    title: 'Exercises & Lessons',
    body:
      'Exercises are free-form -- pick a key, scale, or pattern and practice on your own clock. Lessons are structured: a guided curriculum with a checkpoint you pass to unlock the next one.',
  },
  {
    title: 'Library & sharing',
    body:
      'Practice sessions and recordings are saved to your Library so you can play them back later. From there you can also generate a link to share a session with someone else.',
  },
  {
    title: "You're all set",
    body:
      'That\'s the whole tour. Find it again anytime from the menu next to your name (top right), or from the About page.',
  },
];

/** Small on-brand mockup of the relevant screen for each step. Not a literal screenshot -- built from the app's own fretboard/UI tokens so it stays accurate as the UI evolves. */
function TourVisual({ step }: { step: number }) {
  return (
    <svg viewBox="0 0 320 150" className="w-full h-full" aria-hidden="true">
      <rect width="320" height="150" rx="16" className="fill-[var(--c-surface)]" />
      {step === 0 && <WelcomeVisual />}
      {step === 1 && <InstrumentVisual />}
      {step === 2 && <FreePlayVisual />}
      {step === 3 && <LessonsVisual />}
      {step === 4 && <LibraryVisual />}
      {step === 5 && <DoneVisual />}
    </svg>
  );
}

function WelcomeVisual() {
  return (
    <g>
      <circle cx="160" cy="75" r="46" className="fill-[var(--c-bg)]" />
      <circle cx="160" cy="75" r="46" className="stroke-[var(--c-accent)]" strokeWidth="1.5" fill="none" opacity="0.5" />
      {/* mic body */}
      <rect x="148" y="48" width="24" height="36" rx="12" className="fill-[var(--c-accent)]" />
      <path d="M138 74a22 22 0 0 0 44 0" className="stroke-[var(--c-accent)]" strokeWidth="3" fill="none" strokeLinecap="round" />
      <line x1="160" y1="96" x2="160" y2="106" className="stroke-[var(--c-accent)]" strokeWidth="3" strokeLinecap="round" />
      <line x1="148" y1="106" x2="172" y2="106" className="stroke-[var(--c-accent)]" strokeWidth="3" strokeLinecap="round" />
      {/* soundwave arcs */}
      {[16, 28, 40].map((r, i) => (
        <path
          key={r}
          d={`M ${160 - r} 75 A ${r} ${r} 0 0 1 ${160 + r} 75`}
          className="stroke-[var(--c-accent)]"
          strokeWidth="1.5"
          fill="none"
          opacity={0.35 - i * 0.08}
          transform={`rotate(180 160 75)`}
        />
      ))}
    </g>
  );
}

function InstrumentVisual() {
  const icons = ['🎻', '🎸', '🪈', '🎤', '🥁'];
  return (
    <g>
      {icons.map((icon, i) => {
        const x = 45 + i * 58;
        const active = i === 1;
        return (
          <g key={i}>
            <rect
              x={x - 22}
              y={49}
              width="44"
              height="52"
              rx="12"
              className={active ? 'fill-[var(--c-accent)]' : 'fill-[var(--c-bg)]'}
              opacity={active ? 0.18 : 1}
            />
            <rect
              x={x - 22}
              y={49}
              width="44"
              height="52"
              rx="12"
              fill="none"
              className={active ? 'stroke-[var(--c-accent)]' : 'stroke-[var(--c-border)]'}
              strokeWidth={active ? 2 : 1}
            />
            <text x={x} y={81} fontSize="22" textAnchor="middle">{icon}</text>
          </g>
        );
      })}
    </g>
  );
}

function FreePlayVisual() {
  const strings = [40, 58, 76, 94];
  const frets = [70, 120, 170, 220, 270];
  return (
    <g>
      <rect x="30" y="30" width="260" height="90" rx="8" className="fill-[var(--c-fb-bg)]" />
      <line x1="55" y1="30" x2="55" y2="120" className="stroke-[var(--c-fb-nut)]" strokeWidth="4" />
      {frets.map((x) => (
        <line key={x} x1={x} y1="30" x2={x} y2="120" className="stroke-[var(--c-fb-fret)]" strokeWidth="1.5" />
      ))}
      {strings.map((y, i) => (
        <line key={y} x1="55" y1={y} x2="290" y2={y} className="stroke-[var(--c-fb-string)]" strokeWidth={1 + i * 0.3} />
      ))}
      {/* detected note glow */}
      <circle cx="170" cy="58" r="11" className="fill-[var(--color-accent-green)]" opacity="0.9">
        <animate attributeName="r" values="9;13;9" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.9;0.5;0.9" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <circle cx="170" cy="58" r="6" className="fill-[var(--c-fb-note-text)]" />
    </g>
  );
}

function LessonsVisual() {
  const nodes = [
    { x: 55, done: true },
    { x: 125, done: true },
    { x: 195, done: false, current: true },
    { x: 265, done: false, current: false },
  ];
  return (
    <g>
      <line x1="55" y1="75" x2="265" y2="75" className="stroke-[var(--c-border)]" strokeWidth="3" />
      <line x1="55" y1="75" x2="195" y2="75" className="stroke-[var(--c-accent)]" strokeWidth="3" />
      {nodes.map((n, i) => (
        <g key={i}>
          <circle
            cx={n.x}
            cy="75"
            r="17"
            className={n.done ? 'fill-[var(--c-accent)]' : n.current ? 'fill-[var(--c-bg)]' : 'fill-[var(--c-surface)]'}
            stroke={n.current ? 'var(--c-accent)' : 'none'}
            strokeWidth={n.current ? 3 : 0}
          />
          {n.done ? (
            <path d={`M ${n.x - 7} 75 l 5 5 l 9 -10`} fill="none" className="stroke-[var(--c-surface)]" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <text x={n.x} y="80" fontSize="13" textAnchor="middle" className="fill-[var(--c-text-muted)]" fontWeight="600">{i + 1}</text>
          )}
        </g>
      ))}
    </g>
  );
}

function LibraryVisual() {
  const cards = [
    { y: 32, w: 260 },
    { y: 58, w: 244 },
    { y: 84, w: 260 },
  ];
  return (
    <g>
      {cards.map((c, i) => (
        <g key={i}>
          <rect x="30" y={c.y} width={c.w} height="20" rx="7" className="fill-[var(--c-bg)]" stroke="var(--c-border)" strokeWidth="1" />
          <path
            d={`M 42 ${c.y + 10} l 6 -5 l 6 8 l 6 -10 l 6 6 l 6 -4`}
            fill="none"
            className="stroke-[var(--c-accent)]"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={i === 1 ? 1 : 0.4}
          />
        </g>
      ))}
      {/* share glyph on the middle (active) card */}
      <g transform="translate(268, 68)">
        <circle r="10" className="fill-[var(--c-accent)]" />
        <circle cx="-3" cy="-3" r="1.6" className="fill-[var(--c-bg)]" />
        <circle cx="3" cy="0" r="1.6" className="fill-[var(--c-bg)]" />
        <circle cx="-3" cy="3" r="1.6" className="fill-[var(--c-bg)]" />
        <line x1="-3" y1="-3" x2="3" y2="0" className="stroke-[var(--c-bg)]" strokeWidth="1" />
        <line x1="-3" y1="3" x2="3" y2="0" className="stroke-[var(--c-bg)]" strokeWidth="1" />
      </g>
    </g>
  );
}

function DoneVisual() {
  const confetti = [
    [70, 30, 'var(--color-accent-yellow)'],
    [250, 40, 'var(--c-accent)'],
    [60, 110, 'var(--color-accent-green)'],
    [255, 105, 'var(--color-accent-yellow)'],
    [95, 20, 'var(--c-accent)'],
    [230, 20, 'var(--color-accent-green)'],
  ] as const;
  return (
    <g>
      {confetti.map(([x, y, color], i) => (
        <rect key={i} x={x} y={y} width="6" height="6" rx="1.5" fill={color} opacity="0.8" transform={`rotate(${i * 35} ${x} ${y})`} />
      ))}
      <circle cx="160" cy="75" r="38" className="fill-[var(--c-accent)]" opacity="0.16" />
      <circle cx="160" cy="75" r="30" className="fill-[var(--c-accent)]" />
      <path d="M146 76 l10 10 l20 -22" fill="none" stroke="var(--c-bg)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

export function WelcomeTour() {
  const tourOpen = useAppStore((s) => s.tourOpen);
  const finishTour = useAppStore((s) => s.finishTour);
  const [step, setStep] = useState(0);

  const isLast = step === STEPS.length - 1;

  const handleFinish = () => {
    finishTour();
    setStep(0);
  };

  const goNext = () => (isLast ? handleFinish() : setStep((s) => Math.min(STEPS.length - 1, s + 1)));
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  useEffect(() => {
    if (!tourOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleFinish();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goBack();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourOpen, step]);

  if (!tourOpen) return null;

  const current = STEPS[step];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome tour"
      onClick={(e) => { if (e.target === e.currentTarget) handleFinish(); }}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] shadow-xl relative flex flex-col max-h-[88vh] sm:max-h-[85vh] pb-[env(safe-area-inset-bottom)]"
      >
        {/* Close target: large enough to be a comfortable mobile tap target */}
        <button
          onClick={handleFinish}
          aria-label="Skip tour"
          className="absolute top-2 right-2 sm:top-3 sm:right-3 w-10 h-10 flex items-center justify-center rounded-full text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg)] transition z-10"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>

        {/* Drag-handle affordance for the mobile sheet */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[var(--c-border)]" />
        </div>

        <div className="overflow-y-auto px-5 sm:px-7 pt-3 sm:pt-7">
          <div className="rounded-xl overflow-hidden border border-[var(--c-border-subtle)] mb-5">
            <TourVisual step={step} />
          </div>

          <p className="text-xs font-medium text-[var(--c-text-muted)] mb-1.5">
            Step {step + 1} of {STEPS.length}
          </p>
          <h2
            className="text-xl sm:text-2xl font-semibold text-[var(--c-text-strong)] mb-2.5 tracking-tight"
            style={{ fontFamily: 'var(--font-arty)' }}
          >
            {current.title}
          </h2>
          <p className="text-sm text-[var(--c-text-muted)] leading-relaxed pb-2">{current.body}</p>
        </div>

        {/* Sticky footer keeps navigation reachable without scrolling, even on short screens */}
        <div className="shrink-0 px-5 sm:px-7 pt-3 pb-4 sm:pb-6 border-t border-[var(--c-border-subtle)] bg-[var(--c-surface)] rounded-b-3xl sm:rounded-b-2xl">
          <div className="flex items-center justify-center gap-2.5 mb-4" role="tablist" aria-label="Tour steps">
            {STEPS.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === step}
                aria-label={`Go to step ${i + 1}: ${STEPS[i].title}`}
                onClick={() => setStep(i)}
                className="p-2 -m-2"
              >
                <span
                  className={`block rounded-full transition-all ${
                    i === step
                      ? 'w-5 h-2 bg-gradient-to-r from-emerald-500 to-teal-400'
                      : i < step
                        ? 'w-2 h-2 bg-[var(--c-accent)]'
                        : 'w-2 h-2 bg-[var(--c-border)]'
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                onClick={goBack}
                className="px-4 py-3 sm:py-2.5 rounded-xl text-sm text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg)] transition"
              >
                Back
              </button>
            )}
            <button
              onClick={goNext}
              className="flex-1 px-4 py-3 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:from-emerald-500 hover:to-teal-500 transition"
            >
              {isLast ? 'Start playing' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
