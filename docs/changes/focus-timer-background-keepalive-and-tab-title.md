# Feature: Focus — timer żywy w tle + czas w title karty

## Type
Feature (planned by proto-feature)

## User goal
User pracuje w sesji focus i często przełącza się na inną kartę w Edge'u (prawdziwa robota obok). Dwie dolegliwości:
1. **Title karty nie pokazuje czasu** — żeby rzutem oka na pasek Edge'a widzieć, jak długo już siedzi nad zadaniem, bez wracania na kartę.
2. **Timer przestaje odliczać w tle** — Edge throttluje/usypia nieaktywną kartę (`setInterval` głównego wątku jest dławiony, a Sleeping Tabs potrafi zawiesić kartę całkowicie). Po powrocie timer „zostaje w tyle", bo liczył ticki, a nie czas. User chce, by karta **nie gasła** i timer **ciągle działał** nawet na nieaktywnej karcie.

## MVP scope
**MUSI działać (MVP):**
- Title karty pokazuje live elapsed timera podczas sesji (`12:34 — Autowork`), z suffixem stanu (`· paused` / `· over`). Poza sesją / w podsumowaniu = normalny title (`Autowork`).
- Timer jest **zawsze poprawny** po powrocie do karty — model timestamp-based (liczy czas wall-clock, nie ticki). Zero dryfu nawet jeśli karta spała 5 min.
- Timer **tyka na żywo w tle** (title aktualizuje się co 1 s na nieaktywnej karcie): Web Worker napędza tick + Wake Lock trzyma ekran/kartę przy życiu gdy jest widoczna. Resync na `visibilitychange`.

**Odłożone (Later):**
- Jakikolwiek in-app wskaźnik statusu keep-alive (np. ikona „karta aktywna"). MVP niewidoczny; patrz sekcja Design.
- Powiadomienie systemowe / dźwięk przy overtime lub końcu sesji w tle (osobny feature).
- Guarancja 100% — z poziomu JS nie da się na siłę zabronić Edge'owi uśpienia karty po bardzo długim czasie. Maksimum, co można: Worker + Wake Lock + resync. Przywrócenie zawsze snapuje poprawny czas (patrz Edge cases).

## Impact map
- **Nowy moduł?**: **nie** — rozszerza `focus`.
- **Moduły dotknięte**: `focus` (mechanizm `Timer` + efekt uboczny title karty). Żaden inny moduł się nie zmienia; `run`/`dashboard` bez zmian (title to chrome przeglądarki, nie powierzchnia apki).
- **Cross-module integration**: **brak** nowej relacji między encjami. Ryzykowny punkt jest **wewnętrzny** dla `focus` — logika resyncu timestamp + widoczność/pauza w przepisanym `use-focus-timer.ts` (tu żyje poprawność i tu kryją się bugi).
- **Shared-doc additions** (wpisze `proto-detail`):
  - `ENTITY_MAP.md` — notka przy encji `Timer`: mechanizm timestamp-based (wall-clock, nie ticki) + poprawność w tle + zachowanie Wake Lock; semantyka `timerElapsed` bez zmian (wciąż bezwzględna liczba sekund).
  - `ACTIONS.md` — przy akcjach `Timer`: dopiski „stays accurate when tab is backgrounded/slept; resyncs on return" (Start/Pause-Resume) oraz System „keeps ticking in background via Web Worker; screen held awake via Wake Lock".
  - `GLOSSARY.md` — dopisek do `Timer` (tło: poprawność po powrocie, tytuł karty, keep-alive) + ew. wiersz „Keep-alive (timer w tle)".
  - `docs/modules/focus.md` — nowy Edge case „Karta w tle / uśpiona karta" + dopisek przy istniejących „Wczesne wyjście / refresh / browser-back" i „Zmiana stanu mid-session (inna karta)".

## Per-module changes

### focus

#### Data
- **Brak nowych encji, brak nowych pól.** `Timer` istnieje (ENTITY_MAP); `timerElapsed` (per `Task`) bez zmian semantyki — wciąż bezwzględna liczba sekund, persystowana throttled.
- Zmiana jest **mechaniczna, nie modelowa**: sposób liczenia (ticki → wall-clock timestamp) i trzymanie karty przy życiu to szczegół implementacyjny `Timer`, nie nowa dana.

#### Actions
- Akcje `Timer` (Start / Pause / Resume / counts-past-estimate) bez zmian z punktu widzenia usera.
- **Nowe zachowania systemowe** (notka w ACTIONS):
  - Timer pozostaje poprawny, gdy karta jest w tle / uśpiona; po powrocie snapuje do właściwego czasu.
  - Timer tyka dalej w tle przez Web Worker; ekran trzymany przy życiu Wake Lockiem, gdy karta widoczna.

#### Screens & flows
- **Brak nowych ekranów, brak zmian w istniejących screenach.** `FocusTimer.tsx` (prezentacyjny) bez zmian.
- Title karty to **efekt uboczny** stanu sesji — side-effect, nie ekran. Zakres: tylko gdy `screen === 'session' && currentTask` (running lub paused).
- Nawigacja bez zmian.

#### States
- **Brak nowych stanów user-facing** (empty/error/loading). Fallbacki (brak Workera / brak Wake Lock) degradują **po cichu** do main-thread interval / braku blokady usypiania — bez UI, bez komunikatu.
- Jedno nowe, poprawne zachowanie przy powrocie z długiego tła: timer snapuje do przodu (może wskoczyć w `overtime`). To poprawny wynik, nie stan błędu.

#### Edge cases (instynkt usera + oczywiste; pełna diagnoza → `proto-edgecases`)
- **Karta uśpiona (Edge Sleeping Tabs)** — ticki mogą nie odpalać wcale; `visibilitychange` → visible wymusza recompute ze timestampu → poprawny czas natychmiast. (Gwarancja poprawności niezależna od keep-alive.)
- **Pauza w tle / resume w tle** — `running` flipuje; hook musi (re)przechwycić `resumedAt` i zamrozić `baseElapsed` poprawnie nawet gdy karta ukryta.
- **Powrót po długim tle** — snap do przodu (może wpaść w overtime); natychmiastowy flush persystencji, by nie zgubić.
- **Dwie karty tej samej sesji** — obie tykają → konflikt zapisu `timerElapsed` (ostatni wygrywa). Powiązane z istniejącą rekonsyliacją mid-session (`storage` event). → `edgecases`.
- **Brak WSparcia Wake Lock / Worker** (stara przeglądarka, brak secure context) — cicha degradacja; timer nadal poprawny (timestamp).
- **Rapid przejścia** (Done → next task szybko, Back, Skip) — `initialElapsed` zmienia się; reset `base` + `resumedAt` musi być idempotentny i nie gubić sekundy.

#### Design
- **Brak powierzchni do designu/polish.** Title = chrome przeglądarki; Wake Lock = niewidoczny. `DESIGN.md` **nietknięty**, żadna zaprojektowana powierzchnia się nie zmienia → ten feature nie przechodzi przez `proto-design`/`proto-polish`.
- (Later) ewentualny in-app wskaźnik keep-alive byłby nową powierzchnią → wtedy `design`+`polish`. W MVP celowo pominięte.

## Routing — which proto skill builds what

Ten feature to **głównie zmiana logiki/mechanizmu** (nie dodaje ekranów). Dlatego klasyczny lejek `lofi → harden → design` się nie aplicjuje — rdzeń to residual direct-edit, a `detail`/`edgecases`/`harden` pełnią rolę wspierającą.

| Step | Skill | Target | Co robi |
|------|-------|--------|---------|
| 1 | `proto-detail` | focus | Zespecyfikować delty: mechanizm timera (timestamp), title karty, keep-alive (Worker + Wake Lock + resync). Wpisać notki do ENTITY_MAP / ACTIONS / GLOSSARY + nowy Edge case w `focus.md`. **Light.** |
| 2 | **(residual direct-edit)** | focus | Zbudować mechanizm — patrz sekcja Residual niżej. To rdzeń feature'a. |
| 3 | `proto-edgecases` | focus | Zdiagnozować przypadki brzegowe tła/widoczności/pauzy/multi-tab na zbudowanym mechanizmie (`focus-edgecases.md` re-audit). |
| 4 | `proto-harden` | focus | **Tylko warunkowo** — jeśli `edgecases` znajdzie lukę user-facing. Większość fallbacków jest po cichu; prawdopodobnie minimalny. |

**Pominięte celowo:** `proto-lofi` (brak nowych ekranów), `proto-design` / `proto-polish` (brak on-screen zmiany), `proto-highlevelui` (brak wpływu na shell/nav).

**Sekwencja:** `detail` (spec) → residual (budowa mechanizmu) → `edgecases` (stress-test) → `harden` (jeśli trzeba). Można pominąć `detail` i wejść prosto w residual, jeśli user chce iść szybko — plan ma wystarczająco szczegółów.

## Residual — direct edits not covered by a proto skill

Rdzeń implementacji. Wszystkie pliki w `src/modules/focus/`.

- **[`src/modules/focus/hooks/use-focus-timer.ts:19-45`]** — **RYZYKOWNE, tu żyje poprawność.** Teraz: akumulacja ticków (`setInterval(prev => prev + 1)`, 1000 ms). Zmiana na **model timestamp-based**:
  - Dodać refs: `baseRef` (sekundy zamrożone przy pauzie/zmianie taska) i `resumedAtRef` (ms wall-clock ostatniego wznowienia).
  - `compute() = baseRef + floor((Date.now() - resumedAtRef)/1000)` gdy running, inaczej `baseRef`.
  - `running` → true: `resumedAtRef = Date.now()`, start ticku (Worker, fallback: main-thread `setInterval`). `running` → false: `baseRef = compute()`, stop tick.
  - Efekt resetu przy `initialElapsed` (`:27-30`): też reset `baseRef = initialElapsed` i `resumedAtRef = running ? Date.now() : null`.
  - Listener `visibilitychange`: gdy `visible && running` → `setElapsed(compute())` (wymuszenie snapu — zabezpieczenie na wypadek całkowicie porzuconych ticków przez uśpioną kartę) + natychmiastowy flush.
  - `onPersist` (throttled co ~5 s), unmount-flush i API `flush()` **bez zmian** — konsumenci (`FocusView`) nietknięci.
- **[`src/modules/focus/workers/timer-tick.worker.ts`]** — **nowy plik.** Worker z `setInterval(() => postMessage('tick'), 1000)`; tick Workera jest throttlowany znacznie słabiej w tle niż main-thread. Tworzony przez `new Worker(new URL('./timer-tick.worker.ts', import.meta.url), { type: 'module' })` (Vite wspiera natywnie). Fallback: jeśli `typeof Worker === 'undefined'` lub konstrukcja rzuca → main-thread `setInterval` (poprawność timestampu i tak gwarantowana). Worker terminowany w cleanupie.
- **[Wake Lock]** — w hooku lub nowym `src/modules/focus/hooks/use-wake-lock.ts`: gdy `running && !document.hidden` → `navigator.wakeLock.request('screen')` (trzyma ekran/kartę przy życiu gdy widoczna — lever na „karta nie może gasnąć"); release przy pauzie/hidden/unmount; re-acquire na `visibilitychange → visible`. Guard `if ('wakeLock' in navigator)`. Cicha degradacja, gdy niedostępne.
- **[`src/modules/focus/hooks/use-focus-tab-title.ts`]** — **nowy plik.** `useFocusTabTitle({ active, clock, paused, over })`: przy mount czyta `document.title` (base = `Autowork` z `index.html:6`); gdy `active` ustawia `${clock}${paused ? ' · paused' : ''}${over ? ' · over' : ''} — ${base}`; przy unmount przywraca base. UI copy po angielsku (zgodnie z konwencją apki).
- **[`src/modules/focus/components/FocusView.tsx:214-218`]** — zaraz po `useFocusTimer`, podpiąć `useFocusTabTitle({ active: screen === 'session' && !!currentTask, clock: formatClock(elapsed), paused: screen === 'session' && !running, over: currentTask?.estimatedTime != null && elapsed > currentTask.estimatedTime * 60 })`. Zaimportować `formatClock` z `../types/focus`.

## Later (deferred)
- In-app wskaźnik statusu keep-alive (nowa powierzchnia → wtedy `design`+`polish`).
- Powiadomienie/dźwięk przy overtime lub końcu sesji, gdy karta w tle.
- Pełna guarancja przeciw usypianiu karty przez Edge po bardzo długim czasie (poza zasięgiem JS; resync zawsze poprawia wartość po powrocie).

## Hand-off
Odpal w kolejności: `proto-detail focus` (spec delty + shared-doc notki) → residual direct-edits powyżej (rdzeń) → `proto-edgecases focus` → ew. `proto-harden focus`. Plan jest bazą, którą czytają te skille. Jeśli scope się zmieni — odpal `proto-feature` ponownie.
