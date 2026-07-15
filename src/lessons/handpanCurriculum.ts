import { getHandpanBoard } from '../theory/handpanLayout';
import type { Lesson, LessonModule } from './types';
import { createCurriculum } from './curriculum';

/**
 * "First Strikes" -- a beginner handpan curriculum on the D Kurd scale,
 * covering striking technique, moving cleanly between tone fields, and
 * playing simple scale runs and melodic patterns across the instrument.
 *
 * Handpan has no strings or frets, so positions use `[string, fret]` tuples
 * resolved against getHandpanBoard(): `string` is always 0 (handpan has one
 * "virtual string"), and `fret` is the index into the 9 fixed D Kurd tones,
 * ordered low to high starting at the Ding. So `[0, 0]` means the Ding (D3),
 * `[0, 4]` means D4, `[0, 8]` means A4, etc. See handpanLayout.ts for the
 * full tone list.
 *
 * Important grading caveat: checkpoints in this app are graded purely by
 * PITCH + TIMING picked up from the mic -- how cleanly you strike a tone
 * field (finger position, follow-through, avoiding unwanted overtones from
 * neighboring fields) can't be auto-graded the same way. Those parts of
 * technique are taught as instructional content/tips; checkpoints only
 * cover the pitched, timeable part of each skill (striking the right tone
 * field, in time).
 */

const DING = 0, A3 = 1, BB3 = 2, C4 = 3, D4 = 4, E4 = 5, F4 = 6, G4 = 7, A4 = 8;

export const MODULES: LessonModule[] = [
  {
    id: 'foundations',
    title: 'Module 1 — Meet the Handpan',
    description: 'Your first strikes on the Ding and a tone field.',
  },
  {
    id: 'technique',
    title: 'Module 2 — Moving Around the Circle',
    description: 'Traveling cleanly between neighboring and skipped tone fields.',
  },
  {
    id: 'scales',
    title: 'Module 3 — Playing the Scale',
    description: 'Running the full D Kurd scale, ascending, descending, and round trip.',
  },
  {
    id: 'melody',
    title: 'Module 4 — Simple Patterns',
    description: 'A triad shape and a short original phrase that ties it together.',
  },
];

export const LESSONS: Lesson[] = [
  // ---------------- Module 1: Meet the Handpan ----------------
  {
    id: 'hp1-first-strike',
    moduleId: 'foundations',
    title: 'Your First Strike',
    category: 'technique',
    summary: 'Find the Ding and strike it cleanly with a relaxed hand.',
    content: [
      { type: 'paragraph', text: 'A handpan is played with bare hands, no mallets. The deep note in the very center of the top shell is called the "Ding" -- it\'s usually the lowest note on the instrument and the one many players return to as a home base.' },
      { type: 'paragraph', text: 'Strike it with the pad of your finger or the heel of your palm, close to the center, and let your hand bounce back off the shell immediately -- pressing down or lingering muffles the tone.' },
      { type: 'tip', text: 'This app grades pitch and timing, not strike quality. Use the checkpoint to confirm you\'re landing on the right tone field -- but a clean, ringing tone with no buzz is on you to self-judge by ear.' },
    ],
    practice: [
      {
        id: 'hp1-p1',
        title: 'Strike the Ding',
        instructions: 'Strike the center Ding note once and let it ring out fully before striking again.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[0, DING]],
        bpm: null,
      },
      {
        id: 'hp1-p2',
        title: 'Strike and repeat',
        instructions: 'Strike the Ding, let it ring, then strike it again.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[0, DING], [0, DING]],
        bpm: null,
      },
    ],
    checkpoint: {
      title: 'Strike the Ding four times, in time',
      instructions: 'Strike the Ding once per click, four times, with a relaxed bounce-back each time.',
      root: 'D',
      scaleKey: 'aeolian',
      positions: [[0, DING], [0, DING], [0, DING], [0, DING]],
      requiredAccuracy: 0.75,
      bpm: 60,
    },
  },
  {
    id: 'hp2-tone-field',
    moduleId: 'foundations',
    title: 'Your First Tone Field',
    category: 'technique',
    summary: 'Find the root tone field, D4, and alternate it with the Ding.',
    content: [
      { type: 'paragraph', text: 'Surrounding the Ding are the "tone fields" -- shallow dents hammered into the shell, each tuned to one fixed pitch. Unlike a string, you can\'t bend or slide a tone field\'s pitch; every field always rings the same note.' },
      { type: 'paragraph', text: 'Tap a tone field in the panel below to hear its reference pitch, then find it on your own instrument. The root tone field, D4, is usually placed directly next to the Ding.' },
    ],
    practice: [
      {
        id: 'hp2-p1',
        title: 'Strike D4 alone',
        instructions: 'Tap D4 in the handpan panel to hear it, then strike that tone field a few times.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[0, D4]],
        bpm: null,
      },
      {
        id: 'hp2-p2',
        title: 'Ding, then D4',
        instructions: 'Strike the Ding, then the D4 tone field, then back to the Ding.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[0, DING], [0, D4], [0, DING]],
        bpm: null,
      },
    ],
    checkpoint: {
      title: 'Alternate Ding and D4 in time',
      instructions: 'Strike this pattern in time with the click: Ding, D4, Ding, D4.',
      root: 'D',
      scaleKey: 'aeolian',
      positions: [[0, DING], [0, D4], [0, DING], [0, D4]],
      requiredAccuracy: 0.75,
      bpm: 70,
    },
  },

  // ---------------- Module 2: Moving Around the Circle ----------------
  {
    id: 'hp3-neighbor-fields',
    moduleId: 'technique',
    title: 'Neighboring Tone Fields',
    category: 'practice',
    summary: 'Move smoothly between two tone fields that sit next to each other.',
    content: [
      { type: 'paragraph', text: 'D4 and E4 sit side by side around the circle. Moving between neighboring fields is the most common hand motion on a handpan, so it\'s worth building a light, confident touch here before trying bigger jumps.' },
      { type: 'tip', text: 'Keep your hand low and close to the shell as you move between fields -- a big swinging motion wastes time and makes it easy to clip the wrong field by accident.' },
    ],
    practice: [
      {
        id: 'hp3-p1',
        title: 'D4 to E4 and back',
        instructions: 'Strike D4, then E4, then back to D4.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[0, D4], [0, E4], [0, D4]],
        bpm: 70,
      },
      {
        id: 'hp3-p2',
        title: 'Extend to F4',
        instructions: 'Strike D4, E4, F4, then back down E4, D4.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[0, D4], [0, E4], [0, F4], [0, E4], [0, D4]],
        bpm: 70,
      },
    ],
    checkpoint: {
      title: 'D4-E4-F4-E4-D4 in time',
      instructions: 'Strike this five-note pattern in time with the click.',
      root: 'D',
      scaleKey: 'aeolian',
      positions: [[0, D4], [0, E4], [0, F4], [0, E4], [0, D4]],
      requiredAccuracy: 0.8,
      bpm: 75,
    },
  },
  {
    id: 'hp4-skips',
    moduleId: 'technique',
    title: 'Skipping a Tone Field',
    category: 'practice',
    summary: 'Jump over a tone field instead of striking every one in between.',
    content: [
      { type: 'paragraph', text: 'D4 to F4 skips over E4 -- a minor third, and the same shape you\'ll hear as the backbone of the D minor triad later in this curriculum. Skips ask your hand to judge distance rather than just moving to whatever is next.' },
      { type: 'paragraph', text: 'Look at (or feel for) the target field before you strike the first note, so your hand is already moving toward it rather than reacting after the fact.' },
    ],
    practice: [
      {
        id: 'hp4-p1',
        title: 'D4 to F4 and back',
        instructions: 'Strike D4, skip up to F4, then back down to D4.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[0, D4], [0, F4], [0, D4]],
        bpm: 65,
      },
      {
        id: 'hp4-p2',
        title: 'One field higher',
        instructions: 'Same skip, one tone field higher: E4 to G4 to E4.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[0, E4], [0, G4], [0, E4]],
        bpm: 65,
      },
    ],
    checkpoint: {
      title: 'Two skips: D4-F4-D4, E4-G4-E4',
      instructions: 'Strike the pattern in time: D4, F4, D4, E4, G4, E4.',
      root: 'D',
      scaleKey: 'aeolian',
      positions: [[0, D4], [0, F4], [0, D4], [0, E4], [0, G4], [0, E4]],
      requiredAccuracy: 0.8,
      bpm: 70,
    },
  },

  // ---------------- Module 3: Playing the Scale ----------------
  {
    id: 'hp5-scale-up',
    moduleId: 'scales',
    title: 'The Full Scale, Ascending',
    category: 'theory',
    summary: 'Every tone field on the instrument, low to high: Ding up to A4.',
    content: [
      { type: 'paragraph', text: 'D Kurd is built from the same whole/half-step shape as a D natural minor scale: D, E, F, G, A, Bb, C, D. On this handpan that shape stretches from the Ding all the way around the circle to the highest tone field, A4.' },
      { type: 'paragraph', text: 'Play slowly at first, checking each tone field name against the panel, then gradually speed up once the path around the circle feels secure.' },
    ],
    practice: [
      {
        id: 'hp5-p1',
        title: 'Lower half',
        instructions: 'Strike Ding, A3, Bb3, C4, moving outward from the center.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[0, DING], [0, A3], [0, BB3], [0, C4]],
        bpm: 70,
      },
      {
        id: 'hp5-p2',
        title: 'Full run, slow',
        instructions: 'Strike every tone field from the Ding up to A4, slowly.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[0, DING], [0, A3], [0, BB3], [0, C4], [0, D4], [0, E4], [0, F4], [0, G4], [0, A4]],
        bpm: 65,
      },
    ],
    checkpoint: {
      title: 'Play the full scale ascending',
      instructions: 'Strike every tone field from the Ding up to A4, one per click.',
      root: 'D',
      scaleKey: 'aeolian',
      positions: [[0, DING], [0, A3], [0, BB3], [0, C4], [0, D4], [0, E4], [0, F4], [0, G4], [0, A4]],
      requiredAccuracy: 0.8,
      bpm: 80,
    },
  },
  {
    id: 'hp6-scale-down',
    moduleId: 'scales',
    title: 'The Full Scale, Descending',
    category: 'theory',
    summary: 'The trip back down from A4 to the Ding.',
    content: [
      { type: 'paragraph', text: 'Coming back down the circle asks your hand to retrace its path in reverse, which is a different motor skill than going up -- it\'s common to rush or clip a neighboring field on the way down.' },
      { type: 'tip', text: 'If your accuracy dips here compared to the ascending version, slow the tempo back down and rebuild the path deliberately before speeding up again.' },
    ],
    practice: [
      {
        id: 'hp6-p1',
        title: 'Top half, descending',
        instructions: 'Strike A4, G4, F4, E4, coming down from the top.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[0, A4], [0, G4], [0, F4], [0, E4]],
        bpm: 70,
      },
      {
        id: 'hp6-p2',
        title: 'Full run, descending',
        instructions: 'Strike every tone field from A4 down to the Ding.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[0, A4], [0, G4], [0, F4], [0, E4], [0, D4], [0, C4], [0, BB3], [0, A3], [0, DING]],
        bpm: 65,
      },
    ],
    checkpoint: {
      title: 'Play the full scale descending',
      instructions: 'Strike every tone field from A4 down to the Ding, one per click.',
      root: 'D',
      scaleKey: 'aeolian',
      positions: [[0, A4], [0, G4], [0, F4], [0, E4], [0, D4], [0, C4], [0, BB3], [0, A3], [0, DING]],
      requiredAccuracy: 0.8,
      bpm: 80,
    },
  },
  {
    id: 'hp7-scale-round-trip',
    moduleId: 'scales',
    title: 'Round the Whole Circle',
    category: 'practice',
    summary: 'Combine both directions into one continuous trip around the instrument.',
    content: [
      { type: 'paragraph', text: 'Now put the two directions together: up from the Ding to A4, then straight back down. This is as much a hand-path exercise as a pitch one -- your hand should already know where the next field is before you strike the current one.' },
      { type: 'tip', text: 'If the tempo trips you up, it\'s a sign to practice the path itself more slowly, not to force the speed.' },
    ],
    practice: [
      {
        id: 'hp7-p1',
        title: 'Half round trip',
        instructions: 'Strike up from D4 to A4, then back down to D4.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[0, D4], [0, E4], [0, F4], [0, G4], [0, A4], [0, G4], [0, F4], [0, E4], [0, D4]],
        bpm: 80,
      },
    ],
    checkpoint: {
      title: 'Full circle, up and down',
      instructions: 'Strike the complete scale up to A4 and back down to the Ding, in time with the click.',
      root: 'D',
      scaleKey: 'aeolian',
      positions: [
        [0, DING], [0, A3], [0, BB3], [0, C4], [0, D4], [0, E4], [0, F4], [0, G4], [0, A4],
        [0, G4], [0, F4], [0, E4], [0, D4], [0, C4], [0, BB3], [0, A3], [0, DING],
      ],
      requiredAccuracy: 0.8,
      bpm: 85,
    },
  },

  // ---------------- Module 4: Simple Patterns ----------------
  {
    id: 'hp8-triad',
    moduleId: 'melody',
    title: 'The D Minor Triad',
    category: 'practice',
    summary: 'Strike the three tone fields that outline a D minor chord.',
    content: [
      { type: 'paragraph', text: 'D4, F4, and A4 outline a D minor triad -- root, minor third, and fifth. This same "skip, skip" shape you practiced in Module 2 is the harmonic backbone of most simple handpan phrases.' },
      { type: 'paragraph', text: 'Feel free to use the Ding underneath this shape too -- many players anchor a phrase by returning to the Ding between triad strikes.' },
    ],
    practice: [
      {
        id: 'hp8-p1',
        title: 'Up the triad',
        instructions: 'Strike D4, F4, A4, rising through the chord shape.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[0, D4], [0, F4], [0, A4]],
        bpm: 70,
      },
      {
        id: 'hp8-p2',
        title: 'Up and down the triad',
        instructions: 'Strike D4, F4, A4, then back down F4, D4.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[0, D4], [0, F4], [0, A4], [0, F4], [0, D4]],
        bpm: 70,
      },
    ],
    checkpoint: {
      title: 'D minor triad, up and down',
      instructions: 'Strike D4, F4, A4, F4, D4 in time with the click.',
      root: 'D',
      scaleKey: 'aeolian',
      positions: [[0, D4], [0, F4], [0, A4], [0, F4], [0, D4]],
      requiredAccuracy: 0.8,
      bpm: 80,
    },
  },
  {
    id: 'hp9-graduation-phrase',
    moduleId: 'melody',
    title: 'Graduation Phrase',
    category: 'practice',
    summary: 'A short original phrase combining the Ding, steps, and the triad shape.',
    content: [
      { type: 'paragraph', text: 'This closing phrase weaves together everything from this curriculum: a return to the Ding, a neighboring-field step, a skip up to the triad, and a scale-step way home -- a simple original pattern, not a copy of any existing song.' },
      { type: 'list', items: ['The Ding (Module 1) as a home base to open and close on', 'Neighboring and skipped fields (Module 2) for the middle movement', 'The D minor triad shape (this module) for the lift in the phrase'] },
      { type: 'tip', text: 'Play it slowly a few times before attempting the checkpoint tempo -- getting the hand path right matters more than speed here.' },
    ],
    practice: [
      {
        id: 'hp9-p1',
        title: 'Opening phrase',
        instructions: 'Strike the opening: Ding, D4, E4, D4.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[0, DING], [0, D4], [0, E4], [0, D4]],
        bpm: 80,
      },
      {
        id: 'hp9-p2',
        title: 'The lift and the return',
        instructions: 'Strike the triad lift and the way home: F4, A4, F4, E4, D4, Ding.',
        root: 'D',
        scaleKey: 'aeolian',
        positions: [[0, F4], [0, A4], [0, F4], [0, E4], [0, D4], [0, DING]],
        bpm: 80,
      },
    ],
    checkpoint: {
      title: 'Full graduation phrase',
      instructions: 'Strike the complete phrase in time: Ding, D4, E4, D4, F4, A4, F4, E4, D4, Ding.',
      root: 'D',
      scaleKey: 'aeolian',
      positions: [
        [0, DING], [0, D4], [0, E4], [0, D4],
        [0, F4], [0, A4], [0, F4], [0, E4], [0, D4], [0, DING],
      ],
      requiredAccuracy: 0.85,
      bpm: 85,
    },
  },
];

export const handpanCurriculum = createCurriculum({
  id: 'first-strikes',
  title: 'First Strikes',
  description: 'Striking technique, moving around the circle, and playing scale runs and simple patterns on D Kurd.',
  referenceBoard: getHandpanBoard(),
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
} = handpanCurriculum;
