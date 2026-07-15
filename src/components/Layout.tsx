import type { ReactNode } from 'react';
import type { AppView, Instrument, TuningKey, Theme } from '../store/useAppStore';
import { TUNINGS_BY_INSTRUMENT, isStringInstrument } from '../theory/fretboard';
import { useAuth } from '../auth/AuthProvider';
import { Logo } from './Logo';

interface LayoutProps {
  view: AppView;
  onViewChange: (view: AppView) => void;
  instrument: Instrument;
  onInstrumentChange: (instrument: Instrument) => void;
  tuningKey: TuningKey;
  onTuningChange: (key: TuningKey) => void;
  tuningAutoDetected: boolean;
  theme: Theme;
  onToggleTheme: () => void;
  /** Whether the current instrument has a lesson curriculum to show. */
  lessonsAvailable: boolean;
  /** Whether the current instrument supports the fretboard-based exercises view. */
  exercisesAvailable: boolean;
  children: ReactNode;
}

export function Layout({
  view,
  onViewChange,
  instrument,
  onInstrumentChange,
  tuningKey,
  onTuningChange,
  tuningAutoDetected,
  theme,
  onToggleTheme,
  lessonsAvailable,
  exercisesAvailable,
  children,
}: LayoutProps) {
  const tunings = isStringInstrument(instrument) ? TUNINGS_BY_INSTRUMENT[instrument] : null;
  const { profile, configured } = useAuth();
  const showUser = configured && profile?.onboarding_complete;

  return (
    <div className="min-h-screen bg-[var(--c-bg)] flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--c-border-subtle)] px-3 sm:px-4 lg:px-6 py-2 sm:py-3 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Logo className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onToggleTheme}
                aria-label="Toggle theme"
                className="p-1.5 sm:p-2 rounded-lg text-[var(--c-text-muted)] hover:text-[var(--c-text-strong)] hover:bg-[var(--c-surface)] transition-all"
              >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.061l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.061l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.061 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06L5.404 4.344a.75.75 0 10-1.06 1.06l1.06 1.061z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" clipRule="evenodd" />
                </svg>
              )}
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <select
                value={instrument}
                onChange={(e) => onInstrumentChange(e.target.value as Instrument)}
                aria-label="Instrument"
                className="bg-[var(--c-surface)] text-[var(--c-text-on-input)] border border-[var(--c-border)] rounded-lg px-2 py-1 text-xs sm:text-sm font-medium"
              >
                <option value="ukulele">Uke</option>
                <option value="bass">Bass</option>
                <option value="guitar">Guitar</option>
                <option value="clarinet">Clarinet</option>
                <option value="voice">Voice</option>
                <option value="handpan">Handpan</option>
                <option value="cajon">Cajón</option>
              </select>

              {tunings && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <select
                    value={tuningKey}
                    onChange={(e) => onTuningChange(e.target.value as TuningKey)}
                    aria-label="Tuning"
                    className="bg-[var(--c-surface)] text-[var(--c-text-on-input)] border border-[var(--c-border)] rounded-lg px-2 py-1 text-xs max-w-[140px] sm:max-w-none"
                  >
                    {Object.entries(tunings).map(([key, t]) => (
                      <option key={key} value={key}>{t.name}</option>
                    ))}
                  </select>
                  {tuningAutoDetected && (
                    <span className="text-[10px] text-emerald-400 font-medium">auto</span>
                  )}
                </div>
              )}
            </div>

            <nav
              role="tablist"
              aria-label="Main navigation"
              className="flex gap-3 sm:gap-4 lg:gap-6 border-b border-[var(--c-border-subtle)] overflow-x-auto scrollbar-none"
            >
              <TabButton
                active={view === 'freeplay'}
                onClick={() => onViewChange('freeplay')}
              >
                Free Play
              </TabButton>
              {exercisesAvailable && (
                <TabButton
                  active={view === 'exercises'}
                  onClick={() => onViewChange('exercises')}
                >
                  Exercises
                </TabButton>
              )}
              {lessonsAvailable && (
                <TabButton
                  active={view === 'lessons'}
                  onClick={() => onViewChange('lessons')}
                >
                  Lessons
                </TabButton>
              )}
              <TabButton
                active={view === 'library' || view === 'playback'}
                onClick={() => onViewChange('library')}
              >
                Library
              </TabButton>
              {showUser && profile?.is_admin && (
                <TabButton
                  active={view === 'admin'}
                  onClick={() => onViewChange('admin')}
                >
                  Admin
                </TabButton>
              )}
              <TabButton
                active={view === 'about'}
                onClick={() => onViewChange('about')}
              >
                About
              </TabButton>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 min-w-0">
        <div className="max-w-6xl mx-auto min-w-0">{children}</div>
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`
        px-0.5 pb-1.5 sm:pb-2 -mb-px border-b-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0
        ${active
          ? 'border-teal-600 text-[var(--c-text-strong)]'
          : 'border-transparent text-[var(--c-text-muted)] hover:text-[var(--c-text-strong)]'
        }
      `}
    >
      {children}
    </button>
  );
}
