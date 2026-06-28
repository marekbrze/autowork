import { captureStressorsMinimal } from './data/capture';
import type { AppData } from './types';

export function minimalScenario(): AppData {
  return { 'capture:stressors': captureStressorsMinimal };
}
