import type { Instrument } from '../theory/fretboard';
import type { Curriculum } from './curriculum';
import { bluesCurriculum } from './bluesCurriculum';
import { bassTechniqueCurriculum } from './bassTechniqueCurriculum';
import { voiceCurriculum } from './voiceCurriculum';
import { handpanCurriculum } from './handpanCurriculum';
import { cajonCurriculum } from './cajonCurriculum';
import { harmonicaCurriculum } from './harmonicaCurriculum';

/** Maps each instrument to its lesson curriculum, if it has one. Guitar and clarinet have none yet. */
export const CURRICULA: Partial<Record<Instrument, Curriculum>> = {
  ukulele: bluesCurriculum,
  bass: bassTechniqueCurriculum,
  voice: voiceCurriculum,
  handpan: handpanCurriculum,
  cajon: cajonCurriculum,
  harmonica: harmonicaCurriculum,
};

export function getCurriculumForInstrument(instrument: Instrument): Curriculum | null {
  return CURRICULA[instrument] ?? null;
}

export function hasCurriculum(instrument: Instrument): boolean {
  return CURRICULA[instrument] != null;
}
