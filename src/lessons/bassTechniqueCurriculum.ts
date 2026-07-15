import { BASS_TUNINGS, generateFretboard } from '../theory/fretboard';
import type { Lesson, LessonModule } from './types';
import { createCurriculum } from './curriculum';

/**
 * "Percussive Bass Techniques" -- a technique-focused curriculum inspired by
 * Adam Ben Ezra's percussive solo bass style (thumb attacks, ghost notes,
 * two-handed tapping, and ringing harmonics), NOT a transcription of any of
 * his specific compositions. His pieces (e.g. "Can't Stop Running") are
 * copyrighted and sold as official transcriptions -- see
 * https://www.adambenezra.com/transcriptions/ -- and the "Signature Sounds
 * of Adam Ben Ezra" course on Discover Double Bass teaches the exact hits
 * note-for-note if you want 1:1 accuracy.
 *
 * Important grading caveat: lesson checkpoints in this app are graded purely
 * by PITCH + TIMING picked up from the mic. True percussive techniques
 * (ghost notes, muted slaps, body hits) have no stable pitch and cannot be
 * auto-graded the same way. Those techniques are taught as instructional
 * content/tips; checkpoints only cover the pitched, timeable part of each
 * skill (fretted/tapped notes, harmonics, groove timing).
 *
 * Positions use [string, fret] tuples resolved against BASS_TUNINGS.bass_standard,
 * where string 0 = G, 1 = D, 2 = A, 3 = E (top-to-bottom, thinnest first).
 */

export const MODULES: LessonModule[] = [
  {
    id: 'percussion',
    title: 'Module 1 — Percussive Foundations',
    description: 'The thumb attack, muting, and the ghost-note feel that give a bass groove its punch.',
  },
  {
    id: 'twohand',
    title: 'Module 2 — Two-Handed Coordination',
    description: 'Bring the fretting hand into the rhythm with taps that ring real pitches.',
  },
  {
    id: 'harmonics',
    title: 'Module 3 — Harmonics',
    description: 'Bell-like tones that ring above the string, a signature sound of percussive solo bass.',
  },
  {
    id: 'groove',
    title: 'Module 4 — Groove Assembly',
    description: 'Combine everything into a full percussive groove in a minor key.',
  },
];

export const LESSONS: Lesson[] = [
  // ---------------- Module 1: Percussive Foundations ----------------
  {
    id: 'bt-thumb-attack',
    moduleId: 'percussion',
    title: 'The Percussive Thumb Attack',
    category: 'technique',
    summary: 'Strike the string like a kick drum, not just a pluck.',
    content: [
      { type: 'paragraph', text: 'Percussive solo bassists like Adam Ben Ezra get a drum-like "kick" out of the instrument by striking the string firmly with the side of the thumb, rather than plucking gently. The attack is fast and firm, then the hand relaxes immediately so the note rings.' },
      { type: 'paragraph', text: 'Try exaggerating the attack more than feels natural at first -- a percussive groove needs a much harder, punchier hit than typical fingerstyle playing.' },
      { type: 'tip', text: 'This app grades pitch and timing, not force. Use the checkpoint to lock in your timing, but focus on making the attack itself feel percussive while you play -- that part is on you to self-judge.' },
    ],
    practice: [
      {
        id: 'bt-p1-1',
        title: 'Firm low-E attack',
        instructions: 'Strike the open low E string hard and let it ring. Repeat four times, relaxing your hand fully between hits.',
        root: 'E',
        scaleKey: 'aeolian',
        positions: [[3, 0], [3, 0], [3, 0], [3, 0]],
        bpm: null,
      },
      {
        id: 'bt-p1-2',
        title: 'Alternating G / E attack',
        instructions: 'Alternate a firm attack between the open G and open E strings, in time with the click.',
        root: 'E',
        scaleKey: 'aeolian',
        positions: [[0, 0], [3, 0], [0, 0], [3, 0]],
        bpm: 70,
      },
    ],
    checkpoint: {
      title: 'Steady percussive pulse on E',
      instructions: 'With the metronome on, strike the open low E string once per click, eight times. Keep every hit even and punchy.',
      root: 'E',
      scaleKey: 'aeolian',
      positions: [[3, 0], [3, 0], [3, 0], [3, 0], [3, 0], [3, 0], [3, 0], [3, 0]],
      requiredAccuracy: 0.75,
      bpm: 80,
    },
  },
  {
    id: 'bt-ghost-notes',
    moduleId: 'percussion',
    title: 'Muting & Ghost Notes',
    category: 'technique',
    summary: 'The percussive "click" between the notes that makes a groove breathe.',
    content: [
      { type: 'paragraph', text: 'A ghost note is a percussive hit on a muted string -- your fretting hand deadens the pitch, so the attack lands as a rhythmic "tick" or "click" with no clear note. Adam Ben Ezra uses these constantly to fill the gaps between real notes with a drum-like texture.' },
      { type: 'paragraph', text: 'Because a ghost note has no stable pitch, this app cannot grade it the way it grades a fretted note. Practice ghost notes by ear and feel; the checkpoint below instead trains the rhythmic spacing around them using real, gradable notes.' },
      { type: 'tip', text: 'Mute the string with the side of your fretting hand and try adding a ghost-note "click" in the silence between the real notes below. The app only listens for the real notes, but the space you leave is where the groove lives.' },
    ],
    practice: [
      {
        id: 'bt-p2-1',
        title: 'Space between hits',
        instructions: 'Play the open E string, then leave a full beat of silence (try adding a muted ghost-note click there) before playing it again.',
        root: 'E',
        scaleKey: 'aeolian',
        positions: [[3, 0], [3, 0]],
        bpm: 70,
      },
    ],
    checkpoint: {
      title: 'Groove with space: E-E-G-E-E-G',
      instructions: 'Play this six-note pattern in time. Add a ghost-note click in the gaps if you like -- only the real notes below are graded.',
      root: 'E',
      scaleKey: 'aeolian',
      positions: [[3, 0], [3, 0], [0, 0], [3, 0], [3, 0], [0, 0]],
      requiredAccuracy: 0.75,
      bpm: 75,
    },
  },

  // ---------------- Module 2: Two-Handed Coordination ----------------
  {
    id: 'bt-taps',
    moduleId: 'twohand',
    title: 'Fretting-Hand Taps',
    category: 'technique',
    summary: 'Your fretting hand can play real notes on its own.',
    content: [
      { type: 'paragraph', text: 'Unlike a ghost note, a hammer-on tap with the fretting hand rings out a clear, real pitch -- which means the app *can* grade it. This is the building block for two-handed percussive playing: the fretting hand becomes a second voice, not just a pitch-selector for the plucking hand.' },
      { type: 'paragraph', text: 'Tap firmly enough that the string rings without needing to pluck it at all. It should feel almost like drumming on the fretboard.' },
    ],
    practice: [
      {
        id: 'bt-p3-1',
        title: 'Tap up the A string',
        instructions: 'Pluck the open A, then tap up to C with your fretting hand alone -- no second pluck.',
        root: 'A',
        scaleKey: 'aeolian',
        positions: [[2, 0], [2, 3]],
        bpm: 65,
      },
      {
        id: 'bt-p3-2',
        title: 'Tap up the E string',
        instructions: 'Same idea on the low E string: pluck open, then tap up to G.',
        root: 'E',
        scaleKey: 'aeolian',
        positions: [[3, 0], [3, 3]],
        bpm: 65,
      },
    ],
    checkpoint: {
      title: 'Tap up and down the A string',
      instructions: 'Pluck the open A, then tap A-C-D-E going up, and tap your way back down. One pluck, six taps.',
      root: 'A',
      scaleKey: 'aeolian',
      positions: [[2, 0], [2, 3], [2, 5], [2, 7], [2, 5], [2, 3], [2, 0]],
      requiredAccuracy: 0.8,
      bpm: 80,
    },
  },
  {
    id: 'bt-two-hand-groove',
    moduleId: 'twohand',
    title: 'Combining Pluck + Tap',
    category: 'practice',
    summary: 'Two independent voices from one bass -- the "one-man band" sound.',
    content: [
      { type: 'paragraph', text: 'This is the trick behind the "how is that just one bass?" reaction Adam Ben Ezra gets: the plucking hand holds down a steady root note while the fretting hand answers with its own tapped melody, so it sounds like two instruments playing at once.' },
      { type: 'paragraph', text: 'Keep the plucked root dead steady first. Only add the tapped answer once the root feels automatic -- rushing this step is the most common way this pattern falls apart.' },
    ],
    practice: [
      {
        id: 'bt-p4-1',
        title: 'Root + tap on E',
        instructions: 'Pluck the root (open E), then tap the answer (G) with your fretting hand.',
        root: 'E',
        scaleKey: 'aeolian',
        positions: [[3, 0], [3, 3]],
        bpm: 75,
      },
      {
        id: 'bt-p4-2',
        title: 'Root + tap on D',
        instructions: 'Same idea on the D string: pluck the root, tap the answer.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[1, 0], [1, 3]],
        bpm: 75,
      },
    ],
    checkpoint: {
      title: 'Two-handed root + answer groove',
      instructions: 'Play the full pattern in time: pluck-E, tap-G, pluck-E, tap-G, pluck-D, tap-F, pluck-D, tap-F.',
      root: 'E',
      scaleKey: 'aeolian',
      positions: [[3, 0], [3, 3], [3, 0], [3, 3], [1, 0], [1, 3], [1, 0], [1, 3]],
      requiredAccuracy: 0.8,
      bpm: 80,
    },
  },

  // ---------------- Module 3: Harmonics ----------------
  {
    id: 'bt-harmonics-12',
    moduleId: 'harmonics',
    title: 'Natural Harmonics: the 12th Fret',
    category: 'technique',
    summary: 'A bell-like tone, one octave above the open string.',
    content: [
      { type: 'paragraph', text: 'A natural harmonic is produced by touching the string lightly -- without pressing it to the fretboard -- directly above a fret wire, then plucking. Over the 12th fret, this rings out a clear, bell-like tone exactly one octave above the open string.' },
      { type: 'paragraph', text: 'These chime-like harmonics are one of Adam Ben Ezra\'s signature sounds, often used for airy, melodic hooks that contrast with the percussive groove underneath.' },
      { type: 'tip', text: 'Touch, don\'t press. Lift your fretting finger the instant after you pluck and let the harmonic ring on its own.' },
    ],
    practice: [
      {
        id: 'bt-p5-1',
        title: '12th-fret harmonic on E and A',
        instructions: 'Play the 12th-fret harmonic on the low E string, then the A string.',
        root: 'E',
        scaleKey: 'aeolian',
        positions: [[3, 12], [2, 12]],
        bpm: null,
      },
    ],
    checkpoint: {
      title: 'Play the 12th-fret harmonic on all four strings',
      instructions: 'Play the 12th-fret harmonic on each string, G-D-A-E, letting each one ring clearly.',
      root: 'D',
      scaleKey: 'aeolian',
      positions: [[0, 12], [1, 12], [2, 12], [3, 12]],
      requiredAccuracy: 0.75,
      bpm: null,
    },
  },
  {
    id: 'bt-harmonics-7',
    moduleId: 'harmonics',
    title: 'Natural Harmonics: the 7th Fret',
    category: 'technique',
    summary: 'A higher, ringing harmonic a fifth above the octave.',
    content: [
      { type: 'paragraph', text: 'The harmonic over the 7th fret rings an octave and a fifth above the open string -- a different, brighter pitch than the 12th-fret harmonic. Because a bass is tuned in perfect fourths, this means the 7th-fret harmonic on any string always matches the pitch of the fretted note at the 7th fret of that same string.' },
      { type: 'paragraph', text: 'There is also a natural harmonic over the 5th fret, but it happens to ring the exact same pitch class as the open string (two octaves up), so we won\'t give it a separate checkpoint here -- try it by ear as a bonus once the 7th and 12th fret harmonics feel comfortable.' },
    ],
    practice: [
      {
        id: 'bt-p6-1',
        title: '7th-fret harmonic on E and A',
        instructions: 'Play the 7th-fret harmonic on the low E string, then the A string.',
        root: 'E',
        scaleKey: 'aeolian',
        positions: [[3, 7], [2, 7]],
        bpm: null,
      },
    ],
    checkpoint: {
      title: '7th-fret harmonics across the strings',
      instructions: 'Play the 7th-fret harmonic on each string, E-A-D-G.',
      root: 'D',
      scaleKey: 'aeolian',
      positions: [[3, 7], [2, 7], [1, 7], [0, 7]],
      requiredAccuracy: 0.75,
      bpm: null,
    },
  },
  {
    id: 'bt-harmonic-groove',
    moduleId: 'harmonics',
    title: 'Combining Harmonics with the Groove',
    category: 'practice',
    summary: 'Use a harmonic as a bright accent inside a percussive pattern.',
    content: [
      { type: 'paragraph', text: 'Now drop a harmonic into a groove as a punctuation mark -- three grounded, percussive root notes followed by a bright 12th-fret harmonic accent. This kind of contrast (low and punchy, then high and ringing) is a hallmark of percussive solo-bass arranging.' },
      { type: 'list', items: ['Percussive attack (Module 1) for the low notes', 'A light touch (Module 3) for the harmonic accent', 'Keep the tempo locked across both'] },
    ],
    practice: [
      {
        id: 'bt-p7-1',
        title: 'Groove into a harmonic',
        instructions: 'Play the open E three times, then the 12th-fret harmonic on E as an accent.',
        root: 'E',
        scaleKey: 'aeolian',
        positions: [[3, 0], [3, 0], [3, 0], [3, 12]],
        bpm: 75,
      },
    ],
    checkpoint: {
      title: 'Groove with a harmonic accent',
      instructions: 'Play the pattern twice through: E-E-E-(harmonic E), repeated.',
      root: 'E',
      scaleKey: 'aeolian',
      positions: [[3, 0], [3, 0], [3, 0], [3, 12], [3, 0], [3, 0], [3, 0], [3, 12]],
      requiredAccuracy: 0.8,
      bpm: 80,
    },
  },

  // ---------------- Module 4: Groove Assembly ----------------
  {
    id: 'bt-minor-turnaround',
    moduleId: 'groove',
    title: 'The Minor-Key Root Walk (i–VII–VI–V)',
    category: 'theory',
    summary: 'A classic descending minor-key movement used across flamenco, film scoring, and percussive bass grooves.',
    content: [
      { type: 'paragraph', text: 'This descending progression -- i (Dm), VII (C), VI (Bb), V (A) -- is one of the most recognizable chord movements in minor-key music, often called the Andalusian cadence. It shows up constantly in flamenco, film scores, and the kind of dramatic, driving minor-key grooves percussive solo bassists favor.' },
      { type: 'paragraph', text: 'Play just the root of each chord as a walking bass movement: D, C, Bb, A. Once that feels solid, layer the percussive attack from Module 1 back in.' },
      { type: 'tip', text: 'This is a generic progression, not a transcription of any specific song -- a great, legally-clear pattern to build your own percussive grooves around.' },
    ],
    practice: [
      {
        id: 'bt-p8-1',
        title: 'Root movement',
        instructions: 'Walk the four chord roots in order: D, C, Bb, A.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[1, 0], [2, 3], [0, 3], [2, 0]],
        bpm: 70,
      },
      {
        id: 'bt-p8-2',
        title: 'Root movement, faster',
        instructions: 'Same root walk, picking up the tempo.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[1, 0], [2, 3], [0, 3], [2, 0]],
        bpm: 85,
      },
    ],
    checkpoint: {
      title: 'Play the i–VII–VI–V root walk: D, C, Bb, A',
      instructions: 'Play the four chord roots in time with the metronome: D (i), C (VII), Bb (VI), A (V).',
      root: 'D',
      scaleKey: 'aeolian',
      positions: [[1, 0], [2, 3], [0, 3], [2, 0]],
      requiredAccuracy: 0.8,
      bpm: 75,
    },
  },
  {
    id: 'bt-full-groove',
    moduleId: 'groove',
    title: 'Full Percussive Groove in D Minor',
    category: 'practice',
    summary: 'Your graduation piece: percussive attack, root movement, and a harmonic flourish.',
    content: [
      { type: 'paragraph', text: 'This combines everything: a percussive Dm groove, the i-VII-VI-V root walk, a return to the V, and a ringing 12th-fret harmonic to finish -- all in the spirit of the driving, dynamic percussive bass style Adam Ben Ezra is known for.' },
      { type: 'list', items: ['i (Dm) groove: D, D', 'VII (C) then VI (Bb)', 'Back to i (Dm) groove: D, D', 'V (A), then the turnaround VII-VI-V again', 'Finish on a 12th-fret D harmonic'] },
      { type: 'tip', text: 'For the exact, note-for-note version of a real Adam Ben Ezra piece like "Can\'t Stop Running," his official transcription (adambenezra.com/transcriptions) or the "Signature Sounds of Adam Ben Ezra" course on Discover Double Bass are the accurate sources -- this exercise teaches the technique, not that specific composition.' },
    ],
    practice: [
      {
        id: 'bt-p9-1',
        title: 'Dm groove into the turnaround',
        instructions: 'Play the Dm groove, then the C-Bb turnaround.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[1, 0], [1, 0], [2, 3], [0, 3]],
        bpm: 80,
      },
      {
        id: 'bt-p9-2',
        title: 'Resolve to V and finish on the harmonic',
        instructions: 'Play the V chord root, then the closing 12th-fret D harmonic.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[2, 0], [1, 12]],
        bpm: 80,
      },
    ],
    checkpoint: {
      title: 'Full graduation groove',
      instructions: 'Play the complete sequence: Dm groove (D-D), VII-VI turnaround (C-Bb), back to Dm groove (D-D), V (A), the turnaround again (C-Bb), V (A), and finish on the D harmonic.',
      root: 'D',
      scaleKey: 'aeolian',
      positions: [
        // i (Dm) groove
        [1, 0], [1, 0],
        // VII - VI
        [2, 3], [0, 3],
        // back to i (Dm) groove
        [1, 0], [1, 0],
        // V
        [2, 0],
        // turnaround again
        [2, 3], [0, 3],
        // V resolve
        [2, 0],
        // closing harmonic flourish
        [1, 12],
      ],
      requiredAccuracy: 0.85,
      bpm: 80,
    },
  },
];

export const bassTechniqueCurriculum = createCurriculum({
  id: 'bass-percussive-techniques',
  title: 'Percussive Bass Techniques',
  description: 'Thumb attacks, two-handed taps, and ringing harmonics -- the technique vocabulary behind percussive solo bass playing.',
  referenceBoard: generateFretboard(BASS_TUNINGS.bass_standard),
  modules: MODULES,
  lessons: LESSONS,
});

export const {
  resolvePositions,
  getLessonById,
  getLessonIndex,
  getNextLessonId,
  getLessonsForModule,
  isLessonUnlocked,
} = bassTechniqueCurriculum;
