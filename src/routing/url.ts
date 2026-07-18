import type { AppView } from '../store/useAppStore';

export interface RouteState {
  view: AppView;
  lessonId: string | null;
  sessionId: string | null;
}

/** Map the current app state to a URL path. */
export function stateToPath(view: AppView, lessonId: string | null, sessionId: string | null): string {
  switch (view) {
    case 'exercises':
      return '/exercises';
    case 'lessons':
      return lessonId ? `/lessons/${lessonId}` : '/lessons';
    case 'library':
      return '/library';
    case 'playback':
      return sessionId ? `/library/${sessionId}` : '/library';
    case 'stems':
      return '/stems';
    case 'admin':
      return '/admin';
    case 'about':
      return '/about';
    case 'profile':
      return '/profile';
    case 'freeplay':
    default:
      return '/';
  }
}

/** Parse a URL path back into app state. */
export function pathToState(pathname: string): RouteState {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) {
    return { view: 'freeplay', lessonId: null, sessionId: null };
  }

  const [head, second] = parts;
  switch (head) {
    case 'exercises':
      return { view: 'exercises', lessonId: null, sessionId: null };
    case 'lessons':
      return { view: 'lessons', lessonId: second ?? null, sessionId: null };
    case 'library':
      return second
        ? { view: 'playback', lessonId: null, sessionId: second }
        : { view: 'library', lessonId: null, sessionId: null };
    case 'stems':
      return { view: 'stems', lessonId: null, sessionId: null };
    case 'admin':
      return { view: 'admin', lessonId: null, sessionId: null };
    case 'about':
      return { view: 'about', lessonId: null, sessionId: null };
    case 'profile':
      return { view: 'profile', lessonId: null, sessionId: null };
    case 'freeplay':
      return { view: 'freeplay', lessonId: null, sessionId: null };
    default:
      return { view: 'freeplay', lessonId: null, sessionId: null };
  }
}
