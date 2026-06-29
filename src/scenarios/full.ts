import { captureStressorsFull } from './data/capture';
import { buildFocusSeed } from './data/focus';
import { runsFull } from './data/run';
import type { AppData } from './types';

export function fullScenario(): AppData {
  // Reuse bogatego seedu `focus` (atrybuowane taski + materiał WHY). Jego 3 tematy
  // (podatki / samochód / podwyżka) istnieją już w brain dumpie, więc przekazujemy
  // te stresory bez duplikatów. Dzięki temu dominujący Run (`run-finanse`, krok
  // `focus`) jest kontynuowalny — wejście pokazuje zapamiętany filtr z pasującymi
  // zadaniami zamiast ślepego zaułka „brak atrybutów".
  const focus = buildFocusSeed({
    podatki: captureStressorsFull[3], // 'zaległe podatki'
    auto: captureStressorsFull[0], // 'samochód do naprawy'
    podwyzka: captureStressorsFull[2], // 'rozmowa z szefem o podwyżce'
  });

  return {
    'capture:stressors': captureStressorsFull,
    'decompose:reasons': focus.reasons,
    'decompose:nextActions': focus.nextActions,
    'decompose:tasks': focus.tasks,
    'decompose:doneVisions': Object.fromEntries(focus.doneVisions),
    // Zapamiętany filtr sesji — punkt startowy przy kontynuacji Runu (user może go
    // zmienić). Dopasowuje szybkie zadania komunikacyjne: Phone/Message, niska/średnia.
    'focus:filter': { contexts: ['Phone', 'Message'], energies: [1, 2] },
    'run:runs': runsFull,
  };
}
