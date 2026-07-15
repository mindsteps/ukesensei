import { Logo } from './Logo';

/**
 * Static informational page describing what Uke Sensei is and how it works.
 * No app state dependencies — safe to render standalone inside Layout.
 */
export function About() {
  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 space-y-8">
      <div className="text-center space-y-3">
        <Logo className="w-14 h-14 mx-auto" />
        <h1 className="text-2xl font-bold text-[var(--c-text-strong)] tracking-tight">
          About Uke Sensei
        </h1>
        <p className="text-sm text-[var(--c-text-muted)] max-w-md mx-auto">
          A browser-based practice companion that listens to your playing, detects notes and
          chords in real time, and guides you through exercises and lessons on an interactive
          fretboard.
        </p>
      </div>

      <div className="space-y-6">
        <Section title="How it works">
          <p>
            Uke Sensei uses your microphone to detect the pitch of what you're playing with
            sub-cent accuracy, then shows it instantly on a live fretboard and tuning meter. Play
            a chord and it identifies it from the notes ringing together, showing you a fretting
            diagram.
          </p>
        </Section>

        <Section title="Practice modes">
          <ul className="list-disc list-inside space-y-1.5">
            <li>
              <span className="text-[var(--c-text)] font-medium">Free Play</span> — play freely
              with an optional scale overlay to see how your notes relate to a key.
            </li>
            <li>
              <span className="text-[var(--c-text)] font-medium">Exercises</span> — practice
              scales note-by-note across 12 keys and 10 scale types.
            </li>
            <li>
              <span className="text-[var(--c-text)] font-medium">Lessons</span> — follow a guided
              curriculum with checkpoints to track your progress.
            </li>
            <li>
              <span className="text-[var(--c-text)] font-medium">Library</span> — review recorded
              practice sessions and performance feedback.
            </li>
          </ul>
        </Section>

        <Section title="Instruments">
          <p>
            Supports ukulele, bass, and guitar with an interactive fretboard, clarinet with a
            dedicated fingering chart, and voice with pitch-matching exercises and lessons of its
            own. Tunings can be selected manually or auto-detected as you play.
          </p>
        </Section>

        <Section title="Privacy">
          <p>
            All audio processing happens locally in your browser — nothing is sent anywhere
            unless you choose to save a session to your library.
          </p>
        </Section>

        <Section title="Made by and for musicians">
          <p>
            Uke Sensei is built by musicians, for musicians. It will always be free to use, with
            no account lock-in — your practice history is yours. Every recording you save is
            downloadable and stays in your personal archive, not locked behind a subscription.
          </p>
          <p>
            A donation option is planned for the future for anyone who'd like to support ongoing
            development, but the core app will never require payment.
          </p>
        </Section>

        <Section title="Community">
          <p>
            Join the Uke Sensei Discord to share feedback, ask questions, and connect with other
            players.
          </p>
          <a
            href="https://discord.gg/HARxJJTRb"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5865F2] text-white text-sm font-medium hover:bg-[#4752c4] transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.834 19.834 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.028ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.955 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.419-2.157 2.419Z" />
            </svg>
            Join our Discord
          </a>
        </Section>
      </div>

      <div className="text-center text-xs text-[var(--c-text-muted)] space-y-1">
        <p>Made by Hans Speijer and Claude.</p>
        <p>Built with React, TypeScript, and a Rust/WebAssembly audio engine.</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-[var(--c-text-muted)] uppercase tracking-wider">
        {title}
      </h2>
      <div className="text-sm text-[var(--c-text)] leading-relaxed space-y-2">{children}</div>
    </div>
  );
}
