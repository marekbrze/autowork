# Capture

## Vision
Wejście do apki. Niskotarciowy **brain dump** — hasłowo, jak w zwykłym todo — żeby wyrzucić z głowy wszystko, co aktualnie stresuje, i móc potem skupić się na rozwiązywaniu, nie na pamiętaniu. Następnie **ranking** stresorów od najbardziej do najmniej stresującego. To pierwszy kontakt usera z narzędziem, więc moduł ustawia ton całej obietnicy „zdejmij ciężar decydowania, od czego zacząć": zero oceny, zero wymogu pełnych zdań, samo wyrzucanie.

Kluczowa różnica od „kolejnego pustego edytora list", w którym user utyka: apka sama podsuwa **rotujące prompty** i **prowadzi dalej** rankingiem, zamiast zostawiać usera sam na sam z pustą listą. Tu user ma tylko *dodawać* — nie decydować od czego zacząć.

## User Flows

### Brain dump
1. User wchodzi w `capture` → widzi pole z pytaniem **„Co cię teraz stresuje?"**, rotujący banner-prompt oraz (na starcie) pustą listę pod spodem.
2. User wpisuje stresor hasłowo (np. „samochód", „wypowiedzenie umowy") → **Enter** dodaje go do listy; pole się czyści, gotowe na kolejny.
3. **Banner rotuje co kilka sekund**, podsuwając kategorie / przykłady („finanse", „A rata kredytu?"); user może kliknąć prompt, żeby sobie pomóc (pre-fill pola).
4. User powtarza, aż wyrzuci wszystko, co ma na głowie. **Nawigacja i usuwanie z klawiatury**: ↓↑ przegląda listę, Backspace/Usuń kasuje zaznaczony wpis (z **undo** Ctrl+Z przy omyłkowym skasowaniu). Może też edytować wpisany tekst.
5. Gdy ma **≥1 stresora** → **„Dalej"** staje się dostępne (też z klawiatury).

### Ranking
1. Po „Dalej" user widzi listę stresorów (domyślnie w kolejności wpisywania).
2. **Domyślnie**: układa ręcznie — **przeciąga (drag)** lub przesuwa **strzałkami ↑↓**, od najbardziej do najmniej stresującego.
3. **Opcjonalnie**: uruchamia **parowanie** — zobowiązany ciąg porównań parami („który bardziej stresuje: A czy B?"). User przerabia wszystkie pary; dopiero po **pełnym przejściu** mądry algorytm układa z porównań finalną kolejność. Nie da się wyjść w połowie.
4. **„Dalej"** → przekaz uporządkowanych stresorów do `decompose`.

## Screens (rough)
- **Brain dump**: nagłówek/prompt „Co cię teraz stresuje?"; duże, wyeksponowane pole tekstowe (Enter = dodaj); **rotujący banner-prompt** nad/pod polem; lista wpisanych stresorów pod spodem (każdy z edycją + usuwaniem); przycisk **„Dalej"** (disabled przy pustej liście).
- **Ranking**: lista stresorów do ułożenia (drag / ↑↓ / przyciski ↑↓ na wierszu — też na touch); przycisk **„Uruchom parowanie"** prowadzący do sekwencji par (po jednym pytaniu „A czy B?" + wybór, z licznikiem postępu i potwierdzeniem przerwania); po ukończeniu — lista w finalnej kolejności; przycisk **„Dalej"**.

## Actions

| Action | Description | Entity | Notes |
|--------|-------------|--------|-------|
| Add Stressor | Wpisz hasłowo, Enter dodaje kolejny. | Stressor | Krok 1. |
| Pick prompt suggestion | Kliknij rotujący banner-prompt, żeby sobie pomóc (pre-fill pola). | Stressor | `PromptBanner`; rotuje co kilka sekund. |
| Edit Stressor | Zmień tekst istniejącego wpisu. | Stressor | |
| Delete Stressor | Usuń z listy (klawiatura: Backspace/Usuń na zaznaczonym). | Stressor | **Undo domyślnie włączone** (Ctrl+Z). |
| Rank Stressor | Ułóż od najbardziej do najmniej stresującego — ręcznie (drag/↑↓). | Stressor | Krok 2; ustawia `rank`. Domyślna metoda. |
| Run Pairing | Uruchom i ukończ ciąg porównań parami; algorytm układa finalną kolejność. | Stressor | Opcjonalna metoda ranking; zobowiązany ciąg (start → pełne przejście); wymaga ≥2 stresorów. |
| Proceed („Dalej") | Przejdź do następnego etapu. | Stressor | Brain dump → ranking: wymaga ≥1 stresora. Ranking → `decompose`. |

## Edge Cases
Stany obsłużone w prototypie (po `proto-harden`; pełny status z `file:line` — `docs/modules/capture-edgecases.md`):

- **Pusta lista**: „Dalej" z brain dump wyłączony (trzeba ≥1 stresora). Deep-link do rankingu bez stresorów też pokazuje empty-state z drogą powrotu.
- **Jeden stresor**: ranking trywialny; parowanie wymaga ≥2 stresorów (niedostępne poniżej), user idzie dalej bez niego.
- **Omyłkowe skasowanie**: undo — `Ctrl/Cmd+Z` **lub** toast „Cofnij" (6 s). Stos undo: kilka szybkich usunięć jest all cofnalnych (licznik pozostałych). Ctrl+Z w polu tekstowym zostawia natywne cofanie wpisywania.
- **Edycja do pustego**: **nie usuwa** — wyczyszczenie pola i zatwierdzenie anuluje edycję (zostawia oryginał). Usuwanie to osobna, jawna akcja (✕ / Backspace).
- **Duplikaty**: apka ich nie blokuje (brain dump = bez oceny); deduplikacja pozostaje decyzją usera.
- **Bardzo długi tekst**: truncate w liście (z `title`); pełny tekst przy edycji; `maxLength` 300 znaków.
- **Banner zignorowany**: nic się nie dzieje — banner jest opcjonalną pomocą i rotuje dalej.
- **Ranking na touch/mobilnym**: jawne przyciski ↑/↓ na każdym wierszu (drag dla myszy; strzałki ↑/↓ na focuście przycisku) — HTML5 drag nie działa na touch, więc przyciski są drogą mobilną.
- **Parowanie = zobowiązany ciąg**: przerwanie mid-sequence wymaga potwierdzenia (postęp by przepadł); widać postęp („Pytanie N", „Stresor X z Y").
- **Awaria LocalStorage** (pełny / tryb prywatny / niedostępny): toast z retry. UI zawsze odzwierciedla to, co faktycznie zapisane. Uszkodzony odczyt (zły JSON) → toast informacyjny, start od pustej (zamiast cichego wyzerowania).
- **Multi-tab**: zmiany z innych kart synchronizowane (zdarzenie `storage`).

**Odroczone (poza harden `capture`)**: scope'owanie stresorów do aktywnego Runa + „nowy Run" (wymaga modułu `run`); draft w polu przy „Dalej" — designer wybrał odrzucenie (zgodnie z „Enter dodaje"). Szczegóły w `docs/modules/capture-edgecases.md`.

## Integration Points
- **`decompose`**: bezpośrednie wyjście — `capture` przekazuje uporządkowane (zrankowane) stresory, a `decompose` rozbija je na next-actions.
- **`run`**: start `capture` tworzy nowy `Run` implicite (zob. `MODULES.md`, `ENTITY_MAP.md`); `capture` żyje wewnątrz aktywnego Runa.
- **App shell (ADR 0001)**: etapy `capture` (brain dump → ranking) renderują się w `AppShell` i są prowadzone przez **stepper postępu Runa**; „Dalej" przesuwa stepper. Brak wolnych linków nawigacji — prowadzenie, nie menu.
