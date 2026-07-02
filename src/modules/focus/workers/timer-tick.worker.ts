/**
 * Worker tykający co 1 s dla `use-focus-timer`. W nieaktywnej karcie timer głównego
 * wątku jest dławiony (Edge: throttling / Sleeping Tabs); tick z Workera budzi się
 * niezabroniony, więc `document.title` i licznik aktualizują się też w tle. Wartość
 * licznika liczona jest ze znacznika czasu po stronie głównej, więc sam tick tylko
 * „budzi" — nawet jeśli przepuści sekundę, wynik zawsze snapuje poprawnie.
 *
 * `self` zashadowowane typem lokalnym, by uniezależnić się od libów (brak WebWorker
 * w tsconfig). Terminowany przez główny wątek (`worker.terminate()`) przy pauzie.
 */
declare const self: {
  setInterval: (handler: () => void, timeout?: number) => number;
  postMessage: (message: unknown) => void;
};

self.setInterval(() => self.postMessage('tick'), 1000);

export {};
