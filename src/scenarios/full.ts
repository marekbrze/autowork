import { captureStressorsFull } from './data/capture';
import { buildDecomposeSeedFull } from './data/decompose';
import type { AppData } from './types';

export function fullScenario(): AppData {
  const firstStressorId = captureStressorsFull[0].id;
  const decompose = buildDecomposeSeedFull(firstStressorId);

  return {
    'capture:stressors': captureStressorsFull,
    'decompose:reasons': decompose.reasons,
    'decompose:nextActions': decompose.nextActions,
    'decompose:tasks': decompose.tasks,
    'decompose:doneVisions': Object.fromEntries([decompose.doneVision]),
  };
}
