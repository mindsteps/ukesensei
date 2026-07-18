import { getCelloPitchBoard } from '../theory/celloPitches';
import type { Lesson, LessonModule } from './types';
import { createCurriculum } from './curriculum';

/**
 * "Cello Fundamentals" — a comprehensive beginner-to-intermediate cello curriculum
 * covering posture, bow hold, open strings, tone production, simple melodies,
 * and expressive technique.
 *
 * Cello is a FRETLESS instrument with four open strings tuned A-D-G-C.
 * Unlike fretted instruments, cello players find pitches by ear and through
 * precise finger placement on the fingerboard.
 *
 * This curriculum uses a virtual pitch board where positions are [string, semitone_offset]:
 * - string: 0 = A string, 1 = D string, 2 = G string, 3 = C string
 * - semitone_offset: how many semitones above the open string pitch
 *
 * For example: [0, 0] = open A, [0, 2] = B (two semitones above A),
 * [0, 4] = C#, [1, 0] = open D, etc.
 */

const celloPitchBoard = getCelloPitchBoard();

export const MODULES: LessonModule[] = [
  {
    id: 'setup',
    title: 'Module 1 — Setup & Open Strings',
    description: 'Posture, bow hold, and mastering the four open strings.',
  },
  {
    id: 'first-steps',
    title: 'Module 2 — Playing on the Strings',
    description: 'Finger placement, intonation, and simple pitch control.',
  },
  {
    id: 'bow-technique',
    title: 'Module 3 — Bow Control & Tone Production',
    description: 'Bow distribution, pressure, speed, and producing a beautiful sound.',
  },
  {
    id: 'scales',
    title: 'Module 4 — Scales & Arpeggios',
    description: 'Building technique and ear training with systematic scales.',
  },
  {
    id: 'repertoire',
    title: 'Module 5 — Simple Melodies & Repertoire',
    description: 'Playing recognizable pieces and folk songs.',
  },
];

export const LESSONS: Lesson[] = [
  // ============== Module 1: Setup & Open Strings ==============

  {
    id: 'c1-posture',
    moduleId: 'setup',
    title: 'Posture & Holding the Cello',
    category: 'technique',
    summary: 'Set up your body and instrument for healthy, efficient playing.',
    content: [
      {
        type: 'paragraph',
        text: 'The cello rests between your knees with its neck angling slightly away from your body. Sit upright with your feet flat on the floor. Your back should be straight but not rigid. Let gravity do the work; tension in your neck or shoulders will limit your range and tire you quickly.',
      },
      {
        type: 'paragraph',
        text: 'The C-peg (bottom tuning peg, nearest you) should be at a comfortable height near your left shoulder. Adjust the endpin length so the cello sits at a slight angle and the fingerboard is accessible without hunching.',
      },
      {
        type: 'tip',
        text: 'Good check: you should be able to drop your bow arm to your side without it hitting the cello. If it does, your cello is too far out.',
      },
    ],
    practice: [],
    checkpoint: {
      title: 'Hold proper posture',
      instructions: 'Sit with the cello in proper posture and play the four open strings.',
      root: 'A',
      scaleKey: 'ionian',
      positions: [[0, 0], [1, 0], [2, 0], [3, 0]],
      requiredAccuracy: 0.8,
      bpm: 60,
    },
  },

  {
    id: 'c2-bow-hold',
    moduleId: 'setup',
    title: 'Bow Hold Basics',
    category: 'technique',
    summary: 'Develop a relaxed, natural bow hold that lets you control tone.',
    content: [
      {
        type: 'paragraph',
        text: 'Hold the bow stick gently with all five fingers. Your thumb goes under the frog (the wooden part), slightly curved. Your index and middle fingers rest on top of the stick, while your ring and pinky fingers round over it. The bow should feel like a natural extension of your arm.',
      },
      {
        type: 'paragraph',
        text: 'Your wrist should be fairly straight (not bent down), and your hand relaxed. At the frog, your fingers do most of the gripping; at the tip, your hold is lighter and more fingery.',
      },
      {
        type: 'tip',
        text: 'Common mistake: gripping the bow too hard. Let gravity and the weight of your arm do the work. Think "hold, do not squeeze."',
      },
    ],
    practice: [],
    checkpoint: {
      title: 'Demonstrate proper bow hold',
      instructions: 'Hold the bow in proper position and play a sustained open A.',
      root: 'A',
      scaleKey: 'ionian',
      positions: [[0, 0]],
      requiredAccuracy: 1.0,
      bpm: 30,
    },
  },

  {
    id: 'c3-open-strings',
    moduleId: 'setup',
    title: 'Four Open Strings',
    category: 'technique',
    summary: 'Play the A, D, G, and C strings open and learn their distinct tones.',
    content: [
      {
        type: 'paragraph',
        text: 'The cello has four open strings: A (thinnest, brightest), D (warm), G (rich), and C (deepest, fullest). Each one has a different character. Draw your bow slowly across each string, using the middle third of the bow. Keep steady pressure not too light (scratchy), not too heavy (strained).',
      },
      {
        type: 'paragraph',
        text: 'Listen for a clear, singing tone on each one. A good open string should sustain smoothly for several seconds with no scratches or squeaks. Pay attention to the unique resonance of each string.',
      },
      {
        type: 'tip',
        text: 'Start slowly. The cello resonates best when you give it time and consistent pressure. Rushing or squeezing will fight against the instruments natural tone.',
      },
    ],
    practice: [
      {
        id: 'c3-p1',
        title: 'A String open',
        instructions: 'Bow the A string slowly and steadily for 4 beats.',
        root: 'A',
        scaleKey: 'ionian',
        positions: [[0, 0]],
        bpm: 30,
      },
      {
        id: 'c3-p2',
        title: 'D String open',
        instructions: 'Bow the D string slowly and steadily for 4 beats.',
        root: 'D',
        scaleKey: 'ionian',
        positions: [[1, 0]],
        bpm: 30,
      },
      {
        id: 'c3-p3',
        title: 'G String open',
        instructions: 'Bow the G string slowly and steadily for 4 beats.',
        root: 'G',
        scaleKey: 'ionian',
        positions: [[2, 0]],
        bpm: 30,
      },
      {
        id: 'c3-p4',
        title: 'C String open',
        instructions: 'Bow the C string slowly and steadily for 4 beats.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[3, 0]],
        bpm: 30,
      },
    ],
    checkpoint: {
      title: 'Play all four open strings in sequence',
      instructions: 'Bow each open string cleanly in order: A, D, G, C. One note per click.',
      root: 'A',
      scaleKey: 'ionian',
      positions: [[0, 0], [1, 0], [2, 0], [3, 0]],
      requiredAccuracy: 0.8,
      bpm: 60,
    },
  },

  // ============== Module 2: Playing on the Strings ==============

  {
    id: 'c4-finger-placement',
    moduleId: 'first-steps',
    title: 'Finger Placement & First Notes',
    category: 'technique',
    summary: 'Place your fingers on the A string and play simple pitches by ear.',
    content: [
      {
        type: 'paragraph',
        text: 'On cello, you find pitches by ear and through careful finger placement. Start on the A string (the thinnest one). Place your index finger roughly 3-4 centimeters from the nut (the ridge at the top of the fingerboard) and listen for B (one whole step above A).',
      },
      {
        type: 'paragraph',
        text: 'Use your ear and a reference pitch to guide you. The most important skill in fretless playing is learning to hear the target pitch and then place your finger exactly where it needs to be. This takes time and patient listening.',
      },
      {
        type: 'tip',
        text: 'Do not press down hard. Use just enough pressure to stop the string cleanly. Beginners often press too hard, which causes tension and fatigue. Listen for buzzes or scratches; they often mean you are pressing unevenly.',
      },
    ],
    practice: [
      {
        id: 'c4-p1',
        title: 'A to B on the A string',
        instructions: 'Play open A, then place your finger for B. Match the pitch carefully by ear.',
        root: 'A',
        scaleKey: 'ionian',
        positions: [[0, 0], [0, 2]],
        bpm: 30,
      },
      {
        id: 'c4-p2',
        title: 'A string open notes',
        instructions: 'Play a sequence of pitches on the A string: A (open), B, C#, D.',
        root: 'A',
        scaleKey: 'ionian',
        positions: [[0, 0], [0, 2], [0, 4], [0, 5]],
        bpm: 30,
      },
    ],
    checkpoint: {
      title: 'A string simple scale: A, B, C#, D',
      instructions: 'Play these four pitches in sequence on the A string. Focus on clean intonation.',
      root: 'A',
      scaleKey: 'ionian',
      positions: [[0, 0], [0, 2], [0, 4], [0, 5]],
      requiredAccuracy: 0.75,
      bpm: 45,
    },
  },

  {
    id: 'c5-d-string-pitches',
    moduleId: 'first-steps',
    title: 'Pitches on the D String',
    category: 'technique',
    summary: 'Play D, E, F#, and G on the D string.',
    content: [
      {
        type: 'paragraph',
        text: 'The D string is deeper and mellower than the A string. Play the same fingering patterns you learned on A, but now on D. The muscle memory from the A string translates, but pay attention to the different resonance and tone color.',
      },
    ],
    practice: [
      {
        id: 'c5-p1',
        title: 'D string notes: D, E, F#, G',
        instructions: 'Play the D string open, then place fingers for E, F#, and G.',
        root: 'D',
        scaleKey: 'ionian',
        positions: [[1, 0], [1, 2], [1, 4], [1, 5]],
        bpm: 30,
      },
    ],
    checkpoint: {
      title: 'D string scale: D, E, F#, G',
      instructions: 'Play these pitches cleanly on the D string.',
      root: 'D',
      scaleKey: 'ionian',
      positions: [[1, 0], [1, 2], [1, 4], [1, 5]],
      requiredAccuracy: 0.75,
      bpm: 45,
    },
  },

  {
    id: 'c6-g-string-pitches',
    moduleId: 'first-steps',
    title: 'Pitches on the G String',
    category: 'technique',
    summary: 'Play G, A, B, and C on the G string.',
    content: [
      {
        type: 'paragraph',
        text: 'The G string is deeper still, with a rich, full tone. Apply the same principles: place your fingers by ear, listen carefully for the target pitch, and adjust with your finger until it matches.',
      },
    ],
    practice: [
      {
        id: 'c6-p1',
        title: 'G string notes: G, A, B, C',
        instructions: 'Play the G string open, then E, F#, and G.',
        root: 'G',
        scaleKey: 'ionian',
        positions: [[2, 0], [2, 2], [2, 4], [2, 5]],
        bpm: 30,
      },
    ],
    checkpoint: {
      title: 'G string scale: G, A, B, C',
      instructions: 'Play these pitches cleanly on the G string.',
      root: 'G',
      scaleKey: 'ionian',
      positions: [[2, 0], [2, 2], [2, 4], [2, 5]],
      requiredAccuracy: 0.75,
      bpm: 45,
    },
  },

  {
    id: 'c7-c-string-pitches',
    moduleId: 'first-steps',
    title: 'Pitches on the C String',
    category: 'technique',
    summary: 'Play C, D, E, and F on the C string.',
    content: [
      {
        type: 'paragraph',
        text: 'The C string is the thickest and deepest, with the warmest resonance. It can be harder to control at first because it requires more weight and stability from your bow arm. Be patient with yourself as you develop the sensitivity to play cleanly on this string.',
      },
    ],
    practice: [
      {
        id: 'c7-p1',
        title: 'C string notes: C, D, E, F',
        instructions: 'Play the C string open, then D, E, and F.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[3, 0], [3, 2], [3, 4], [3, 5]],
        bpm: 30,
      },
    ],
    checkpoint: {
      title: 'C string scale: C, D, E, F',
      instructions: 'Play these pitches cleanly on the C string.',
      root: 'C',
      scaleKey: 'ionian',
      positions: [[3, 0], [3, 2], [3, 4], [3, 5]],
      requiredAccuracy: 0.75,
      bpm: 45,
    },
  },

  // ============== Module 3: Bow Control & Tone ==============

  {
    id: 'c8-long-tones',
    moduleId: 'bow-technique',
    title: 'Long Tones & Steady Bow Pressure',
    category: 'technique',
    summary: 'Develop consistent tone by sustaining notes with even bow pressure.',
    content: [
      {
        type: 'paragraph',
        text: 'Long tones are the foundation of beautiful cello playing. Hold a single pitch and focus on making the tone as pure, centered, and unwavering as possible. This teaches your bow arm consistency and your ear precision.',
      },
      {
        type: 'paragraph',
        text: 'The goal: draw the bow at a steady speed and pressure so the note neither gets louder nor softer, and the pitch stays rock-solid. Any wobble, fade, or wavering is feedback that your bow pressure or speed needs adjustment.',
      },
    ],
    practice: [
      {
        id: 'c8-p1',
        title: 'Long tone on open A',
        instructions: 'Hold the A string for 8 counts, using steady, even bow pressure.',
        root: 'A',
        scaleKey: 'ionian',
        positions: [[0, 0]],
        bpm: 30,
      },
      {
        id: 'c8-p2',
        title: 'Long tone on open D',
        instructions: 'Hold the D string for 8 counts with even pressure.',
        root: 'D',
        scaleKey: 'ionian',
        positions: [[1, 0]],
        bpm: 30,
      },
    ],
    checkpoint: {
      title: 'Sustained open A for 8 beats',
      instructions: 'Play a clear, steady A string with no wobbles or fades.',
      root: 'A',
      scaleKey: 'ionian',
      positions: [[0, 0], [0, 0], [0, 0], [0, 0]],
      requiredAccuracy: 0.85,
      bpm: 30,
    },
  },

  {
    id: 'c9-bow-changes',
    moduleId: 'bow-technique',
    title: 'Smooth Bow Direction Changes',
    category: 'technique',
    summary: 'Practice seamless transitions between up-bow and down-bow.',
    content: [
      {
        type: 'paragraph',
        text: 'A smooth bow change happens when your bow reverses direction (down-bow to up-bow, or vice versa) without any audible break or pause in the sound. The key: keep consistent pressure and speed through the transition.',
      },
      {
        type: 'paragraph',
        text: 'Plan your bow direction ahead. Typically, longer notes get one direction, and shorter notes alternate. The balance point of the bow (the middle) is where transitions are most natural.',
      },
    ],
    practice: [
      {
        id: 'c9-p1',
        title: 'Bow changes on open A',
        instructions: 'Alternate between down-bow and up-bow on open A. No break between notes.',
        root: 'A',
        scaleKey: 'ionian',
        positions: [[0, 0], [0, 0], [0, 0], [0, 0]],
        bpm: 60,
      },
    ],
    checkpoint: {
      title: 'Four smooth bow changes on open A',
      instructions: 'Play four notes with seamless bow direction changes.',
      root: 'A',
      scaleKey: 'ionian',
      positions: [[0, 0], [0, 0], [0, 0], [0, 0]],
      requiredAccuracy: 0.8,
      bpm: 60,
    },
  },

  // ============== Module 4: Scales & Arpeggios ==============

  {
    id: 'c10-a-major-scale',
    moduleId: 'scales',
    title: 'A Major Scale (One Octave)',
    category: 'practice',
    summary: 'Play a complete A major scale using multiple strings.',
    content: [
      {
        type: 'paragraph',
        text: 'A major scale is the foundation of Western music. Playing it on cello teaches your fingers the interval relationships and trains your ear. You will play A, B, C#, D, E, F#, and G# mostly on the A and D strings, with the highest note on the D string.',
      },
    ],
    practice: [
      {
        id: 'c10-p1',
        title: 'A major scale ascending',
        instructions: 'Play A up to the high A one octave above.',
        root: 'A',
        scaleKey: 'ionian',
        positions: [
          [0, 0], [0, 2], [0, 4], [0, 5],
          [1, 2], [1, 4], [1, 5], [1, 7],
        ],
        bpm: 60,
      },
    ],
    checkpoint: {
      title: 'A major scale (up and back)',
      instructions: 'Play A major ascending and descending smoothly.',
      root: 'A',
      scaleKey: 'ionian',
      positions: [
        [0, 0], [0, 2], [0, 4], [0, 5],
        [1, 2], [1, 4], [1, 5], [1, 7],
        [1, 7], [1, 5], [1, 4], [1, 2],
        [0, 5], [0, 4], [0, 2], [0, 0],
      ],
      requiredAccuracy: 0.75,
      bpm: 60,
    },
  },

  {
    id: 'c11-d-major-scale',
    moduleId: 'scales',
    title: 'D Major Scale (One Octave)',
    category: 'practice',
    summary: 'Play a complete D major scale.',
    content: [
      {
        type: 'paragraph',
        text: 'D major is another fundamental scale for cello. It sits naturally on the D and G strings. Building comfort with this scale strengthens your muscle memory and ear training across the fingerboard.',
      },
    ],
    practice: [
      {
        id: 'c11-p1',
        title: 'D major scale',
        instructions: 'Play D major up and back.',
        root: 'D',
        scaleKey: 'ionian',
        positions: [
          [1, 0], [1, 2], [1, 4], [1, 5],
          [2, 2], [2, 4], [2, 5], [2, 7],
          [2, 7], [2, 5], [2, 4], [2, 2],
          [1, 5], [1, 4], [1, 2], [1, 0],
        ],
        bpm: 60,
      },
    ],
    checkpoint: {
      title: 'D major scale (up and back)',
      instructions: 'Play D major cleanly and in time.',
      root: 'D',
      scaleKey: 'ionian',
      positions: [
        [1, 0], [1, 2], [1, 4], [1, 5],
        [2, 2], [2, 4], [2, 5], [2, 7],
        [2, 7], [2, 5], [2, 4], [2, 2],
        [1, 5], [1, 4], [1, 2], [1, 0],
      ],
      requiredAccuracy: 0.75,
      bpm: 60,
    },
  },

  // ============== Module 5: Simple Melodies & Repertoire ==============

  {
    id: 'c12-mary-had-lamb',
    moduleId: 'repertoire',
    title: 'Mary Had a Little Lamb',
    category: 'practice',
    summary: 'Your first complete melody on cello.',
    content: [
      {
        type: 'paragraph',
        text: 'Mary Had a Little Lamb is a perfect introduction to playing a real piece. It uses only the A and D strings and simple intervals, so you can focus on tone quality and smooth bow transitions while playing something recognizable.',
      },
    ],
    practice: [
      {
        id: 'c12-p1',
        title: 'Mary opening phrase',
        instructions: 'Play the opening of the melody: E, D, C#, D, E, E, E.',
        root: 'E',
        scaleKey: 'ionian',
        positions: [[1, 2], [1, 0], [0, 4], [1, 0], [1, 2], [1, 2], [1, 2]],
        bpm: 60,
      },
    ],
    checkpoint: {
      title: 'Mary Had a Little Lamb (complete)',
      instructions: 'Play the full melody with clean bowing and intonation.',
      root: 'E',
      scaleKey: 'ionian',
      positions: [
        [1, 2], [1, 0], [0, 4], [1, 0], [1, 2], [1, 2], [1, 2],
        [1, 0], [1, 2], [1, 4], [1, 5],
        [1, 5], [1, 5], [1, 5], [1, 2], [1, 2], [1, 2], [1, 2],
        [1, 0], [1, 5], [1, 4], [1, 2], [1, 0],
      ],
      requiredAccuracy: 0.7,
      bpm: 60,
    },
  },

  {
    id: 'c13-twinkle',
    moduleId: 'repertoire',
    title: 'Twinkle, Twinkle, Little Star',
    category: 'practice',
    summary: 'A beloved classic melody for cello.',
    content: [
      {
        type: 'paragraph',
        text: 'Twinkle, Twinkle is a gentle, familiar melody that builds bow control and ear training. It sits beautifully on the A and D strings.',
      },
    ],
    practice: [
      {
        id: 'c13-p1',
        title: 'Twinkle opening',
        instructions: 'Play the opening phrase.',
        root: 'D',
        scaleKey: 'ionian',
        positions: [[1, 0], [1, 0], [1, 0], [0, 5], [0, 5], [0, 5]],
        bpm: 60,
      },
    ],
    checkpoint: {
      title: 'Twinkle, Twinkle (complete)',
      instructions: 'Play the full melody expressively.',
      root: 'D',
      scaleKey: 'ionian',
      positions: [
        [1, 0], [1, 0], [1, 0], [0, 5], [0, 5], [0, 5],
        [0, 7], [0, 9], [0, 10], [0, 12], [1, 2],
        [1, 2], [1, 2], [1, 2], [1, 4], [1, 2],
        [1, 0],
      ],
      requiredAccuracy: 0.7,
      bpm: 60,
    },
  },
];

export const celloCurriculum = createCurriculum({
  id: 'cello-fundamentals',
  title: 'Cello Fundamentals',
  description:
    'A comprehensive beginner curriculum for fretless cello, covering posture, bow technique, pitch placement by ear, tone production, and simple repertoire.',
  referenceBoard: celloPitchBoard,
  modules: MODULES,
  lessons: LESSONS,
});
