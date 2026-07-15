import type { Lesson, LessonModule } from './types';
import { createCurriculum } from './curriculum';

/**
 * "First Grooves" -- a beginner cajon curriculum covering the three core
 * strokes (bass, slap, ghost), basic grooves, syncopated subdivisions, and
 * a couple of short original solos that put it all together.
 *
 * Cajon has no reference board at all -- checkpoints and practice drills use
 * `pattern` (a sequence of hit-type + beat-offset steps) instead of the
 * `positions` tuples every pitched instrument uses, graded by
 * useRhythmExercise.ts against real mic-detected onsets from
 * useOnsetDetection.ts rather than pitch.
 *
 * Important grading caveat: unlike bass/voice/handpan, cajon checkpoints
 * really are graded on the *technique* itself (hit type + timing), because
 * onset detection can tell bass/slap/ghost strokes apart by ear the same
 * way a listener would. What still can't be auto-graded is tone quality and
 * dynamics -- how resonant a bass tone rings, how sharp a slap cracks, or
 * how deliberately quiet a ghost note is relative to the hits around it.
 * Those nuances are taught as instructional content/tips.
 */

export const MODULES: LessonModule[] = [
  {
    id: 'foundations',
    title: 'Module 1 — Bass, Slap, and Ghost',
    description: 'The three core strokes every cajon groove is built from.',
  },
  {
    id: 'grooves',
    title: 'Module 2 — Basic Grooves',
    description: 'Combining strokes into steady, repeatable patterns.',
  },
  {
    id: 'rhythm',
    title: 'Module 3 — Syncopation & Subdivision',
    description: 'Eighth notes, ghost-note fills, and off-beat accents.',
  },
  {
    id: 'performance',
    title: 'Module 4 — Dynamics & Simple Solos',
    description: 'Accents, dynamics, and a couple of original closing grooves.',
  },
];

export const LESSONS: Lesson[] = [
  // ---------------- Module 1: Bass, Slap, and Ghost ----------------
  {
    id: 'cj1-bass-tone',
    moduleId: 'foundations',
    title: 'The Bass Tone',
    category: 'technique',
    summary: 'The deep, resonant tone from striking the center of the head.',
    content: [
      { type: 'paragraph', text: 'Strike the center of the front plate with your fingers or the heel of your palm, then let your hand bounce back off immediately. This gives the deepest, most resonant tone the cajon can produce -- the foundation of almost every groove.' },
      { type: 'tip', text: 'Onset detection listens for a strong burst of low-frequency energy to recognize a bass tone. If your hits aren\'t registering, try striking closer to the center and with a fuller, more relaxed hand.' },
    ],
    practice: [
      {
        id: 'cj1-p1',
        title: 'One bass hit',
        instructions: 'Strike a single bass tone in the center of the head.',
        pattern: [{ hit: 'bass', beat: 0 }],
        beatsPerLoop: 1,
        loops: 1,
        bpm: 70,
      },
      {
        id: 'cj1-p2',
        title: 'Two bass hits',
        instructions: 'Strike two bass tones, evenly spaced.',
        pattern: [{ hit: 'bass', beat: 0 }, { hit: 'bass', beat: 1 }],
        beatsPerLoop: 2,
        loops: 1,
        bpm: 70,
      },
    ],
    checkpoint: {
      title: 'Four steady bass tones',
      instructions: 'Strike a bass tone once per click, four times in a row.',
      pattern: [{ hit: 'bass', beat: 0 }, { hit: 'bass', beat: 1 }, { hit: 'bass', beat: 2 }, { hit: 'bass', beat: 3 }],
      beatsPerLoop: 4,
      loops: 1,
      bpm: 70,
      requiredAccuracy: 0.75,
    },
  },
  {
    id: 'cj2-slap-tone',
    moduleId: 'foundations',
    title: 'The Slap Tone',
    category: 'technique',
    summary: 'A bright, cracking tone from striking near the top edge.',
    content: [
      { type: 'paragraph', text: 'Strike near the top edge of the head with your fingertips, keeping your hand loose and your fingers slightly spread. This produces a sharp, high-pitched "slap" that cuts through a groove -- a totally different color from the bass tone.' },
      { type: 'tip', text: 'A clean slap is mostly high-frequency energy, which is exactly what tells it apart from a bass tone in this app\'s grading. If your slaps keep registering as bass hits, try striking closer to the edge and lifting your hand away faster.' },
    ],
    practice: [
      {
        id: 'cj2-p1',
        title: 'One slap hit',
        instructions: 'Strike a single slap tone near the top edge.',
        pattern: [{ hit: 'slap', beat: 0 }],
        beatsPerLoop: 1,
        loops: 1,
        bpm: 70,
      },
      {
        id: 'cj2-p2',
        title: 'Bass, then slap',
        instructions: 'Strike a bass tone, then a slap tone.',
        pattern: [{ hit: 'bass', beat: 0 }, { hit: 'slap', beat: 1 }],
        beatsPerLoop: 2,
        loops: 1,
        bpm: 70,
      },
    ],
    checkpoint: {
      title: 'Alternate bass and slap',
      instructions: 'Strike this pattern in time with the click: bass, slap, bass, slap.',
      pattern: [{ hit: 'bass', beat: 0 }, { hit: 'slap', beat: 1 }, { hit: 'bass', beat: 2 }, { hit: 'slap', beat: 3 }],
      beatsPerLoop: 4,
      loops: 1,
      bpm: 75,
      requiredAccuracy: 0.75,
    },
  },
  {
    id: 'cj3-ghost-notes',
    moduleId: 'foundations',
    title: 'Ghost Notes',
    category: 'technique',
    summary: 'Quiet, muted taps that fill space without dominating the groove.',
    content: [
      { type: 'paragraph', text: 'A ghost note is a very light, quiet tap -- often played with a muted or resting hand -- that fills in the rhythm between the louder bass and slap tones without drawing attention to itself.' },
      { type: 'paragraph', text: 'Ghost notes are what separate a flat, mechanical groove from one that feels alive. They\'re graded here by overall level: anything clearly quieter than your bass and slap tones will register as a ghost note.' },
    ],
    practice: [
      {
        id: 'cj3-p1',
        title: 'One ghost tap',
        instructions: 'Strike a single quiet ghost note.',
        pattern: [{ hit: 'ghost', beat: 0 }],
        beatsPerLoop: 1,
        loops: 1,
        bpm: 70,
      },
      {
        id: 'cj3-p2',
        title: 'Bass, ghost, bass',
        instructions: 'Strike bass, a quiet ghost tap, then bass again.',
        pattern: [{ hit: 'bass', beat: 0 }, { hit: 'ghost', beat: 1 }, { hit: 'bass', beat: 2 }],
        beatsPerLoop: 3,
        loops: 1,
        bpm: 70,
      },
    ],
    checkpoint: {
      title: 'Bass, ghost, slap, ghost',
      instructions: 'Strike this pattern in time: bass, ghost, slap, ghost.',
      pattern: [{ hit: 'bass', beat: 0 }, { hit: 'ghost', beat: 1 }, { hit: 'slap', beat: 2 }, { hit: 'ghost', beat: 3 }],
      beatsPerLoop: 4,
      loops: 1,
      bpm: 75,
      requiredAccuracy: 0.75,
    },
  },

  // ---------------- Module 2: Basic Grooves ----------------
  {
    id: 'cj4-basic-groove',
    moduleId: 'grooves',
    title: 'The Basic Groove',
    category: 'practice',
    summary: 'Bass and slap alternating on every beat -- the foundation of most cajon grooves.',
    content: [
      { type: 'paragraph', text: 'This alternating bass-slap-bass-slap pattern is the most common cajon groove there is. Once it\'s steady, it becomes the base you\'ll layer ghost notes and syncopation onto in later lessons.' },
      { type: 'tip', text: 'Focus on keeping the bass and slap tones evenly spaced before worrying about speed -- a slow, rock-solid groove is more useful than a fast, wobbly one.' },
    ],
    practice: [
      {
        id: 'cj4-p1',
        title: 'One measure',
        instructions: 'Strike bass, slap, bass, slap once through.',
        pattern: [{ hit: 'bass', beat: 0 }, { hit: 'slap', beat: 1 }, { hit: 'bass', beat: 2 }, { hit: 'slap', beat: 3 }],
        beatsPerLoop: 4,
        loops: 1,
        bpm: 80,
      },
      {
        id: 'cj4-p2',
        title: 'Two measures',
        instructions: 'Repeat the same groove for two measures without stopping.',
        pattern: [{ hit: 'bass', beat: 0 }, { hit: 'slap', beat: 1 }, { hit: 'bass', beat: 2 }, { hit: 'slap', beat: 3 }],
        beatsPerLoop: 4,
        loops: 2,
        bpm: 80,
      },
    ],
    checkpoint: {
      title: 'Basic groove, two measures',
      instructions: 'Play bass, slap, bass, slap, twice through, locked to the click.',
      pattern: [{ hit: 'bass', beat: 0 }, { hit: 'slap', beat: 1 }, { hit: 'bass', beat: 2 }, { hit: 'slap', beat: 3 }],
      beatsPerLoop: 4,
      loops: 2,
      bpm: 80,
      requiredAccuracy: 0.8,
    },
  },
  {
    id: 'cj5-backbeat-groove',
    moduleId: 'grooves',
    title: 'The Backbeat Groove',
    category: 'practice',
    summary: 'Bass tones drive the pulse, with a single slap accent on the backbeat.',
    content: [
      { type: 'paragraph', text: 'Instead of alternating every beat, this groove leans on the bass tone for most of the measure and saves the slap for one accented "backbeat" -- the same role a snare drum plays in a drum kit groove.' },
      { type: 'paragraph', text: 'This shape shows up constantly in real music, so it\'s worth internalizing the feel of "mostly bass, with one sharp accent" before moving on to busier grooves.' },
    ],
    practice: [
      {
        id: 'cj5-p1',
        title: 'One measure',
        instructions: 'Strike bass, bass, slap, bass once through.',
        pattern: [{ hit: 'bass', beat: 0 }, { hit: 'bass', beat: 1 }, { hit: 'slap', beat: 2 }, { hit: 'bass', beat: 3 }],
        beatsPerLoop: 4,
        loops: 1,
        bpm: 85,
      },
      {
        id: 'cj5-p2',
        title: 'Two measures',
        instructions: 'Repeat the backbeat groove for two measures.',
        pattern: [{ hit: 'bass', beat: 0 }, { hit: 'bass', beat: 1 }, { hit: 'slap', beat: 2 }, { hit: 'bass', beat: 3 }],
        beatsPerLoop: 4,
        loops: 2,
        bpm: 85,
      },
    ],
    checkpoint: {
      title: 'Backbeat groove, two measures',
      instructions: 'Play bass, bass, slap, bass, twice through, locked to the click.',
      pattern: [{ hit: 'bass', beat: 0 }, { hit: 'bass', beat: 1 }, { hit: 'slap', beat: 2 }, { hit: 'bass', beat: 3 }],
      beatsPerLoop: 4,
      loops: 2,
      bpm: 85,
      requiredAccuracy: 0.8,
    },
  },

  // ---------------- Module 3: Syncopation & Subdivision ----------------
  {
    id: 'cj6-eighth-subdivision',
    moduleId: 'rhythm',
    title: 'Eighth-Note Fills',
    category: 'theory',
    summary: 'Filling the space between beats with quiet ghost notes.',
    content: [
      { type: 'paragraph', text: 'So far every hit has landed exactly on a beat. Here we split each beat in half, filling the off-beat "and" counts with quiet ghost notes -- the first step toward a busier, groovier feel.' },
      { type: 'tip', text: 'Count "1-and-2-and" out loud while you play -- the ghost notes land on each "and."' },
    ],
    practice: [
      {
        id: 'cj6-p1',
        title: 'Bass and ghost',
        instructions: 'Strike a bass tone, then a quiet ghost note on the very next off-beat.',
        pattern: [{ hit: 'bass', beat: 0 }, { hit: 'ghost', beat: 0.5 }],
        beatsPerLoop: 1,
        loops: 1,
        bpm: 75,
      },
      {
        id: 'cj6-p2',
        title: 'Bass-ghost, slap-ghost',
        instructions: 'Strike bass, ghost, slap, ghost, filling every off-beat.',
        pattern: [
          { hit: 'bass', beat: 0 }, { hit: 'ghost', beat: 0.5 },
          { hit: 'slap', beat: 1 }, { hit: 'ghost', beat: 1.5 },
        ],
        beatsPerLoop: 2,
        loops: 1,
        bpm: 75,
      },
    ],
    checkpoint: {
      title: 'Bass-ghost, slap-ghost, twice through',
      instructions: 'Play bass, ghost, slap, ghost, twice through, in time with the click.',
      pattern: [
        { hit: 'bass', beat: 0 }, { hit: 'ghost', beat: 0.5 },
        { hit: 'slap', beat: 1 }, { hit: 'ghost', beat: 1.5 },
      ],
      beatsPerLoop: 2,
      loops: 2,
      bpm: 80,
      requiredAccuracy: 0.8,
    },
  },
  {
    id: 'cj7-ghost-shuffle',
    moduleId: 'rhythm',
    title: 'The Ghost Note Shuffle',
    category: 'practice',
    summary: 'A full measure of eighth notes, with ghost notes filling every off-beat.',
    content: [
      { type: 'paragraph', text: 'Now extend the eighth-note fill from the last lesson across a full measure: bass and slap alternate on the beats, with a ghost note tucked into every single off-beat in between.' },
      { type: 'paragraph', text: 'This is a busy, satisfying groove once it locks in -- expect it to take a few slow passes before it feels natural.' },
    ],
    practice: [
      {
        id: 'cj7-p1',
        title: 'Half the shuffle',
        instructions: 'Strike bass, ghost, slap, ghost -- the first half of the full shuffle.',
        pattern: [
          { hit: 'bass', beat: 0 }, { hit: 'ghost', beat: 0.5 },
          { hit: 'slap', beat: 1 }, { hit: 'ghost', beat: 1.5 },
        ],
        beatsPerLoop: 2,
        loops: 1,
        bpm: 80,
      },
      {
        id: 'cj7-p2',
        title: 'Full shuffle, one measure',
        instructions: 'Play the complete shuffle across a full measure, once through.',
        pattern: [
          { hit: 'bass', beat: 0 }, { hit: 'ghost', beat: 0.5 },
          { hit: 'slap', beat: 1 }, { hit: 'ghost', beat: 1.5 },
          { hit: 'bass', beat: 2 }, { hit: 'ghost', beat: 2.5 },
          { hit: 'slap', beat: 3 }, { hit: 'ghost', beat: 3.5 },
        ],
        beatsPerLoop: 4,
        loops: 1,
        bpm: 80,
      },
    ],
    checkpoint: {
      title: 'Ghost note shuffle, two measures',
      instructions: 'Play the full ghost-note shuffle groove, twice through, locked to the click.',
      pattern: [
        { hit: 'bass', beat: 0 }, { hit: 'ghost', beat: 0.5 },
        { hit: 'slap', beat: 1 }, { hit: 'ghost', beat: 1.5 },
        { hit: 'bass', beat: 2 }, { hit: 'ghost', beat: 2.5 },
        { hit: 'slap', beat: 3 }, { hit: 'ghost', beat: 3.5 },
      ],
      beatsPerLoop: 4,
      loops: 2,
      bpm: 80,
      requiredAccuracy: 0.8,
    },
  },
  {
    id: 'cj8-tresillo',
    moduleId: 'rhythm',
    title: 'The Tresillo Groove',
    category: 'practice',
    summary: 'A classic 3-3-2 syncopated pattern borrowed from Afro-Cuban and flamenco rhythm.',
    content: [
      { type: 'paragraph', text: 'Tresillo places three hits across a measure at uneven spacing -- on the beat, an eighth note before the halfway point, and on the last beat -- creating a bouncy, syncopated feel found across Afro-Cuban, flamenco, and countless modern grooves.' },
      { type: 'tip', text: 'The middle hit lands on the "and" of beat 2 (beat 1.5), not on a downbeat -- that\'s what gives tresillo its characteristic lean and push.' },
    ],
    practice: [
      {
        id: 'cj8-p1',
        title: 'The three hits, slow',
        instructions: 'Strike bass, slap, bass at beats 0, 1.5, and 3, slowly.',
        pattern: [{ hit: 'bass', beat: 0 }, { hit: 'slap', beat: 1.5 }, { hit: 'bass', beat: 3 }],
        beatsPerLoop: 4,
        loops: 1,
        bpm: 75,
      },
      {
        id: 'cj8-p2',
        title: 'Two measures',
        instructions: 'Repeat the tresillo pattern for two measures.',
        pattern: [{ hit: 'bass', beat: 0 }, { hit: 'slap', beat: 1.5 }, { hit: 'bass', beat: 3 }],
        beatsPerLoop: 4,
        loops: 2,
        bpm: 80,
      },
    ],
    checkpoint: {
      title: 'Tresillo groove, two measures',
      instructions: 'Play the tresillo pattern (bass, slap, bass at beats 0, 1.5, 3), twice through.',
      pattern: [{ hit: 'bass', beat: 0 }, { hit: 'slap', beat: 1.5 }, { hit: 'bass', beat: 3 }],
      beatsPerLoop: 4,
      loops: 2,
      bpm: 85,
      requiredAccuracy: 0.8,
    },
  },

  // ---------------- Module 4: Dynamics & Simple Solos ----------------
  {
    id: 'cj9-dynamics',
    moduleId: 'performance',
    title: 'Accents and Dynamics',
    category: 'theory',
    summary: 'Making one hit in a groove stand out by playing it louder.',
    content: [
      { type: 'paragraph', text: 'Revisit the backbeat groove from Module 2, but this time deliberately play the slap accent noticeably louder than the surrounding bass tones -- that contrast in volume, not just hit type, is what makes a backbeat feel like a real accent instead of just another note.' },
      { type: 'tip', text: 'This app grades hit type and timing, not loudness -- so the checkpoint below will pass either way. The dynamic contrast itself is on you to practice and self-judge by ear.' },
    ],
    practice: [
      {
        id: 'cj9-p1',
        title: 'Accented backbeat, one measure',
        instructions: 'Play bass, bass, slap, bass -- make the slap clearly louder than the bass tones.',
        pattern: [{ hit: 'bass', beat: 0 }, { hit: 'bass', beat: 1 }, { hit: 'slap', beat: 2 }, { hit: 'bass', beat: 3 }],
        beatsPerLoop: 4,
        loops: 1,
        bpm: 85,
      },
    ],
    checkpoint: {
      title: 'Accented backbeat, two measures',
      instructions: 'Play bass, bass, slap, bass, twice through, accenting the slap each time.',
      pattern: [{ hit: 'bass', beat: 0 }, { hit: 'bass', beat: 1 }, { hit: 'slap', beat: 2 }, { hit: 'bass', beat: 3 }],
      beatsPerLoop: 4,
      loops: 2,
      bpm: 90,
      requiredAccuracy: 0.8,
    },
  },
  {
    id: 'cj10-graduation-groove',
    moduleId: 'performance',
    title: 'Graduation Groove',
    category: 'practice',
    summary: 'A short original groove weaving together everything from this curriculum.',
    content: [
      { type: 'paragraph', text: 'This closing groove combines the bass/slap backbone (Module 2), ghost-note fills (Module 3), and a touch of tresillo-style syncopation -- a simple original pattern, not a copy of any existing song.' },
      { type: 'list', items: ['Bass and slap on the strong beats (Module 2) for the backbone', 'Ghost notes filling the off-beats (Module 3) for texture', 'A syncopated slap, off the beat, borrowed from the tresillo feel (Module 3)'] },
      { type: 'tip', text: 'Loop it slowly a few times before attempting the checkpoint tempo -- getting the shape right matters more than speed here.' },
    ],
    practice: [
      {
        id: 'cj10-p1',
        title: 'Opening half',
        instructions: 'Strike bass, ghost, slap -- the opening half of the groove.',
        pattern: [{ hit: 'bass', beat: 0 }, { hit: 'ghost', beat: 0.5 }, { hit: 'slap', beat: 1 }],
        beatsPerLoop: 2,
        loops: 1,
        bpm: 85,
      },
      {
        id: 'cj10-p2',
        title: 'Full groove, one measure',
        instructions: 'Play the complete groove once through.',
        pattern: [
          { hit: 'bass', beat: 0 }, { hit: 'ghost', beat: 0.5 }, { hit: 'slap', beat: 1 },
          { hit: 'bass', beat: 2 }, { hit: 'ghost', beat: 2.5 }, { hit: 'slap', beat: 3.5 },
        ],
        beatsPerLoop: 4,
        loops: 1,
        bpm: 85,
      },
    ],
    checkpoint: {
      title: 'Full graduation groove, two measures',
      instructions: 'Play the complete groove, twice through, locked to the click.',
      pattern: [
        { hit: 'bass', beat: 0 }, { hit: 'ghost', beat: 0.5 }, { hit: 'slap', beat: 1 },
        { hit: 'bass', beat: 2 }, { hit: 'ghost', beat: 2.5 }, { hit: 'slap', beat: 3.5 },
      ],
      beatsPerLoop: 4,
      loops: 2,
      bpm: 90,
      requiredAccuracy: 0.85,
    },
  },
];

export const cajonCurriculum = createCurriculum({
  id: 'first-grooves',
  title: 'First Grooves',
  description: 'Bass, slap, and ghost strokes; basic grooves; syncopation; and a couple of original closing solos.',
  modules: MODULES,
  lessons: LESSONS,
});

export const {
  getLessonById,
  getLessonIndex,
  getNextLessonId,
  getLessonsForModule,
  isLessonUnlocked,
} = cajonCurriculum;
