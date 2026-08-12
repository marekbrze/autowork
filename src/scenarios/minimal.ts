import { captureStressorsMinimal } from './data/capture';
import { runsMinimal } from './data/run';
import { stressorsKey } from '@/shared/funnel-storage';
import type { AppData } from './types';

/** Minimal scenario — one active Run to start the funnel (per-Run data, ADR 0044). */
const RUN_ID = 'run-min-1';

export function minimalScenario(): AppData {
  return {
    [stressorsKey(RUN_ID)]: captureStressorsMinimal(RUN_ID),
    'run:runs': runsMinimal,
    'run:active': RUN_ID,
  };
}
