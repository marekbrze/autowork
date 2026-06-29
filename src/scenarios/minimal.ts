import { captureStressorsMinimal } from './data/capture';
import { runsMinimal } from './data/run';
import type { AppData } from './types';

export function minimalScenario(): AppData {
  return {
    'capture:stressors': captureStressorsMinimal,
    'run:runs': runsMinimal,
  };
}
