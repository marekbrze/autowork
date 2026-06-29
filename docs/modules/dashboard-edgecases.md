# Dashboard — Edge Cases

Audit stress-test prototypu `dashboard` (po `proto-lofi`). Zachowanie-skupiona ewidencja
luk: co prototyp robi dziś, sugerowane domyślne zachowanie (punkt startowy dla
`proto-harden` — nie decyzja ostateczna), i `file:line` gdzie luka powinna być obsłużona.

Zakres: cały moduł (jeden ekran-launcher `DashboardView` + `DominantRunCard`).

## Coverage

**Spec już uchwycił** (`docs/modules/dashboard.md` → Edge Cases): zero runów, jeden aktywny
run, wszystkie zarchiwizowane, run ukończony-niezarchiwizowany, błąd odczytu storage, wiele
aktywnych runów (sortowanie), statystyki poglądowe (mock).

**Już obsłużone w kodzie:**
- Zero runów → wielki CTA „Zacznij swój pierwszy Run" — `DashboardView.tsx:110-124`.
- Jeden aktywny run → tylko dominująca karta (sekcja „pozostałe" się nie renderuje) — `DashboardView.tsx:66-72,74`.
- Wszystkie zarchiwizowane → „brak aktywnych" + start + wejście do archiwum — `DashboardView.tsx:102-109,127`.
- Błąd odczytu storage → `RunReadError` (reload) — `DashboardView.tsx:49-55` → `RunStates.tsx:20-37`.
- Sortowanie aktywnych po `lastActiveAt` desc — `DashboardView.tsx:27-33`.
- **Awaria zapisu (quota/disabled)** — `useLocalStorage` NIE aktualizuje stanu przy nieudanym zapisie, raportuje `writeError`, pamięta wartość do `retry` — `use-local-storage.ts:53-76`; w dashboardzie sygnalizowane `StorageStatusToast` — `DashboardView.tsx:137-143` → `StorageStatusToast.tsx:21-63`.
- `createRun` zwraca `null` przy awarii zapisu, a `handleStartNew` nawiguje tylko po sukcesie (`if (run)`) — `use-runs.ts:37-38`, `DashboardView.tsx:42-45`.

**Nowe luki znalezione:** 6 (po `proto-harden`: ✅ 4 wdrożone, ❌ 2 odłożone).
**Po severity:** 🔴 0 · 🟡 2 · 🟢 4.

Moduł jest cienką warstwą widoku nad już-utwardzonym modułem `run` (storage, błędy,
confirmacje destruktywne = dziedziczone i solidne). Luki poniżej są specyficzne dla dashboardu.

## Inventory

| # | Sev | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|-----|----------|-----------|----------------|--------------------|-------|
| 1 | 🟡 | State transitions | **Ukończony run (100%) jako dominujący** — primary CTA „Kontynuuj" kłamie; nic do wznowienia; brak nudge do archiwizacji na karcie. | `completed` zmienia tylko kosmetykę (emerald tekst `DominantRunCard.tsx:50-51`, kolor paska `:75`). „Kontynuuj" zostaje primary (`:89-91`) → kieruje do `/focus` (celebracja) z niczym do zrobienia. Spec mówi „Continue → szczegóły ukończony", ale karta nie ma archiwum-CTA (w przeciwieństwie do `RunDetails`, które podmienia na `RunCompleted`). | Gdy `completed`: podmień primary CTA na „Archiwizuj ten przejazd" (wzorzec `RunCompleted` z `RunStates.tsx:48-65`) lub nudge „ukończony — archiwizuj?"; zepchnij Kontynuuj. | `src/modules/dashboard/components/DominantRunCard.tsx:88-98`; routing `DashboardView.tsx:70` |
| 2 | 🟡 | Action outcomes | **Podwójny klik „Start new"** → tworzy osierocony pusty Run. | `handleStartNew` woła `createRun()` (sync) i `navigate('/capture')`; przycisk nie jest disableowany w locie (`DashboardView.tsx:42-45`). Dwa szybkie kliknięcia przed odmontowaniem → dwa `createRun` → dwa runy, do jednego nawigacja, drugi zostaje osierocony. Dotyczy 3 przycisków: CTA empty (`:120`), all-archived (`:106`), „+ nowy przejazd" (`DominantRunCard.tsx:95`). | Strażnik in-flight (disable przycisku do nawigacji) lub dedup `createRun` w krótkim oknie. | `src/modules/dashboard/components/DashboardView.tsx:42-45` |
| 3 | 🟢 | Data states | **Run bez tasków (0/0) jako dominujący** → bezsensowna linijka statystyk. | Świeży run (`totalTasks: 0`, np. scenariusz `minimal` lub przed chwilą stworzony) pokazuje „0 z 0 zrobione · zostały 0 · 0s w focus" (`DominantRunCard.tsx:79-84`); `runProgress` = 0 (`run.ts`). Nowy run powinien zapraszać do akcji, nie pokazywać zer. | Gdy `totalTasks === 0`: zapraszająca linijka („Jeszcze bez tasków — zacznij od brain dumpu") zamiast rozbicia zer. | `src/modules/dashboard/components/DominantRunCard.tsx:79-84` |
| 4 | 🟢 | Data states | **Bardzo wiele aktywnych runów** — nieograniczona lista. | Mniejsze runy renderują się w płaskim `<ul>` bez cap/paginacji (`DashboardView.tsx:77-98`). Przy wielu runach strona robi się długa (dominant + N mini-kart + archiwum). | Lofi: akceptowalne; rozważyć miękki cap (pierwsze N + „X więcej") lub grupowanie później. | `src/modules/dashboard/components/DashboardView.tsx:74-100` |
| 5 | 🟢 | Navigation & flow | **Wejście do archiwum ukryte, gdy `archivedCount === 0`.** | Link archiwum renderuje się tylko gdy `archivedCount > 0` (`DashboardView.tsx:127`). Spec mówi „wejście do archiwum na końcu listy aktywnych runów" (implikuje stałą obecność). Przy zerze zarchiwizowanych — brak linku. | Zawsze obecne „Archiwum (0)" albo świadomie ukrywać-puste (potwierdzić z designerem). | `src/modules/dashboard/components/DashboardView.tsx:127-135` |
| 6 | 🟢 | Data states | **Remis `lastActiveAt`** → niedeterministyczny wybór dominującego. | Sort `b.lastActiveAt.localeCompare(a.lastActiveAt)` (`DashboardView.tsx:31`); przy równej wartości (mock-seed lub ten sam tick) kolejność między remisami zależy od porządku wejścia, a `active[0]` (dominant) jest niedookreślony. | Sortowanie z kluczem wtórnym (np. `createdAt` desc), żeby remisy były deterministyczne. | `src/modules/dashboard/components/DashboardView.tsx:27-33` |

## Kategorie sprawdzone bez luk

- **Forms & input** — dashboard nie ma formularzy (rename żyje w `RunDetails`, już zwalidowane: `aria-invalid`, `maxLength 60`). N/A.
- **Validation** — brak pól. N/A.
- **Destructive actions** — na launcherze żadnych (delete/archive w `RunDetails`/`ArchivedRuns` z `ConfirmDialog`). Dziedziczone ✓.
- **Undo** — N/A dla launchera.
- **Loading & async** — `localStorage` czytany synchronicznie przy pierwszym renderze (`use-local-storage.ts:27-34`); bez blank/spinner. ✓.
- **Errors** — readError → `RunReadError`; writeError → `StorageStatusToast`; brak `alert()`/`window.alert`. ✓.
- **Error recovery** — reload (odczyt) / retry (zapis). ✓.
- **Navigation & flow** — brak dead-endów; każda akcja prowadzi gdzieś; refresh-safe (bezstanowy widok nad localStorage). ✓.
- **Cross-module / lifecycle** — usunięty run znika z listy (filter przeliczany); brak wiszących referencji. ✓.
- **Storage failure (quota/disabled)** — `useLocalStorage` łapie (`use-local-storage.ts:46`), raportuje `writeError`, stan niezaktualizowany; toast + retry. Solidne ✓.
- **Offline** — client-side; działa offline. ✓.

## Priority list

1. **Ukończony run jako dominujący (#1)** — primary CTA „Kontynuuj" wprowadza w błąd; największy user-facing impact, niski koszt (podmiana CTA wzorcem `RunCompleted`).
2. **Podwójny klik „Start new" (#2)** — osierocony run = data pollution; strażnik in-flight to mała zmiana.
3. **Run bez tasków (#3)** — czystość komunikatu na świeżym dominancie.
4. **Wejście do archiwum ukryte (#5)** — discoverability nawigacji; decyzja designu.
5. **Remis `lastActiveAt` (#6)** — determinizm, rzadko trafiany.
6. **Nieograniczona lista (#4)** — skala; do odłożenia.

## Hand-off to proto-harden

Top-priority luki do wdrożenia w pierwszej kolejności:
- **#1 Ukończony dominujący** — podmień primary CTA na archiwizację / nudge, zepchnij Kontynuuj.
- **#2 Podwójny klik „Start new"** — strażnik in-flight na przyciskach tworzących Run.

## Status po proto-harden

Wdrożone (✅):
- **#1 Ukończony dominant** → primary CTA „Archiwizuj ten przejazd" (Kontynuuj usunięte) — `src/modules/dashboard/components/DominantRunCard.tsx` (akcje) + `DashboardView.tsx` (`onArchive` → `archiveRun`).
- **#2 Podwójny klik „Start new"** → strażnik `creatingRef` blokuje drugie `createRun` — `src/modules/dashboard/components/DashboardView.tsx` (`handleStartNew`).
- **#3 Run bez tasków (0/0)** → „Jeszcze bez tasków — zacznij od brain dumpu" zamiast rozbicia zer — `src/modules/dashboard/components/DominantRunCard.tsx`.
- **#6 Remis `lastActiveAt`** → wtórny klucz `createdAt` desc — `src/modules/dashboard/components/DashboardView.tsx` (sort).

Odłożone (❌, z racją):
- **#4 Nieograniczona lista aktywnych runów** — akceptowalne dla lofi (jak „statystyki poglądowe" w `run.md`); ew. miękki cap / paginacja w fazie designu, nie harden.
- **#5 Wejście do archiwum ukryte przy 0** — świadoma decyzja: ukrywanie pustego linku = czystszy UX (brak martwego linku do pustego archiwum); wrócić, jeśli discoverability nawigacji stanie się problemem.
