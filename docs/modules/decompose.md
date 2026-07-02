# Decompose

## Vision
Pomost lejka: dla każdego zrankowanego stresora — **po kolei, pojedynczo**, od najbardziej stresującego — `decompose` pomaga odpowiedzieć na dwa pytania: **DLACZEGO to jest ważne** i **JAK to mądrze popchnąć do przodu**. Tu realizuje się główny driver apki: **duże zadanie paraliżuje, trzeba rozbijać** (primary persona = ADHD; też każdy overwhelmed).

Obie połowy modułu używają **tego samego wzorca — prompt pokazany, user wypełnia albo skipuje** (nudge, nie bramka; spójnie z `capture`):
- **WHY** — materiał motywacyjny (powody + wizja efektu), „ładujący baterię", którą `focus` zużywa później.
- **HOW** — next-actiony zapisane **aktywnym, konkretnym językiem**, a grube rozbijane na małe, wykonalne taski.

`decompose` nie tylko produkuje taski — **magazynuje też paliwo motywacyjne**, które wraca na ekranie `focus`, gdy user stoi przed trudnym zadaniem („pamiętaj, po co to robisz").

`decompose` jest też miejscem, w którym widać **postęp pracy** nad stresorem: taski już załatwione (`completed` / `dismissed` — ustawione w `focus` lub z listy `run`) są na liście akcji **widoczne jako załatwione** (read-only), a next-action w całości załatwiony zostaje wizualnie wyciszony. Powrót do `decompose` po sesji nie udaje więc, że nic się nie stało (ADR 0057).

## User Flows

### Per-stresor (powtarza się dla każdego, w kolejności rankingu)
1. User wchodzi w `decompose` → widzi **jeden stresor** (najbardziej stresujący jako pierwszy) wyciągnięty na środek ekranu.
2. **Blok WHY (motywacja)** pokazany od razu (nie schowany):
   - user dopisuje **powody** (kilka), każdy z **walencją** — *pozytywną* (zysk: „co zyskam, jak to skończę") lub *negatywną* (koszty braku działania: „co mnie czeka, jak tego nie zrobię");
   - opcjonalnie **pozytywna wizja efektu** — żywy, zmysłowy opis (tekst + emoji) zrobionego stanu (payoff);
   - może **skipnąć** cały blok i iść dalej.
3. **Blok HOW (next-actiony)**: user wpisuje next-actiony (Enter dodaje kolejny, jak brain dump w `capture`).
   - Każdy next-action **zapisany aktywnym, konkretnym językiem** (czasownik na początku, fizycznie wykonalne).
   - Pod każdym next-actionem pojawia się **prompt „Jak to możesz rozbić?"**: user wpisuje mniejsze kroki (→ taski) albo **skipuje** (→ next-action staje się 1 konkretnym taskiem).
4. **Wymagane ≥1 next-action**, żeby iść do następnego stresora (inaczej nie ma co procesować).
5. **„Dalej"** → kolejny stresor; stepper postępu Runu przesuwa się do przodu (ADR 0001).

### Wyjście z modułu (`decompose` → `process`)
1. Po ostatnim stresorze → przekaz tasków (z ich przynależnością do next-actionów/stresorów) do `process`.
2. Warunek automatycznie spełniony: ≥1 next-action per stresor daje ≥1 task, więc zawsze jest co procesować.

## Screens (rough)
- **Widok pojedynczego stresora**: stresor wyeksponowany na środku; pod nim **blok WHY** — lista powodów z oznaczeniem walencji (pozytywna/negatywna), pole na wizję efektu (tekst + emoji) oraz „pomiń"; niżej **blok HOW** — pole dodawania next-actionów (Enter) z listą dodanych, a pod każdym prompt „Jak to możesz rozbić?" z wynikowymi taskami; przycisk **„Dalej"** (disabled bez ≥1 next-action) + wskaźnik postępu (który stresor z N).
- **Status tasków w bloku HOW (read-only, ADR 0057)**: przy każdym tasku pod next-actionem **znacznik stanu**, gdy jest `completed` (✓) lub `dismissed` (⊘ + etykieta „not relevant", muted — neutralnie, **nie** na czerwono); przy next-actionie **licznik postępu** `X/N done` (gdzie done = `completed` + `dismissed`, spójnie z `Run.progress`), pokazywany gdy ≥1 task załatwiony; next-action, którego **wszystkie** taski są załatwione → strike-through + muted (de-emphasis), ale nadal w pełni edytowalny (edycja / rozbicie / usuwanie). Stany `skipped` / `active` w MVP niewidoczne (render neutralnie).

## Actions

| Action | Description | Entity | Notes |
|--------|-------------|--------|-------|
| Add Reason | Dopisz powód, dlaczego stresor jest ważny, z walencją pozytywną (zysk) lub negatywną (uniknięcie bólu). | Reason | Blok WHY; kilka na stresor. |
| Add DoneVision | Opisz pozytywną wizję efektu — zrobiony stan, żywy tekst + emoji. | Stressor | Opcjonalne, 0..1 na stresor (`doneVision`). |
| Skip motivation | Pomiń cały blok WHY i idź do next-actionów. | — | WHY nigdy nie blokuje. |
| Add NextAction | Wypisz, co pchnie stresor do przodu (Enter dodaje kolejny). | NextAction | **Aktywny, konkretny język** (czasownik, wykonalne). |
| Decompose into Tasks | Pod next-actionem: odpowiedz na prompt „Jak to możesz rozbić?" → mniejsze taski. | Task | Prompt + skip; skip = 1 task. |
| Edit / Delete NextAction | Zmień tekst / usuń. | NextAction | |
| Proceed („Dalej") | Następny stresor; po ostatnim → `process`. | — | Per stresor: ≥1 next-action. |
| View task status (read-only) | Znacznik stanu taska pod next-actionem (`completed` ✓ / `dismissed` ⊘ „not relevant"); licznik `X/N done`; w pełni załatwiony next-action — wyciszony. | Task | **Tylko odczyt** — stan mutują `focus` (Done/Dismiss) i `run` (Mark done/not-relevant); `decompose` go tylko pokazuje. ADR 0057. |

## Edge Cases
- **Brak pomysłu na next-action („nie wiem, jak to ruszyć")**: realny stan dla overwhelmed/ADHD usera — ale moduł **wymaga ≥1 next-action**, żeby iść dalej. App prowadzi promptami („Jak to możesz rozbić?" + przykłady aktywnych akcji: „zadzwoń do…", „wyślij…", „wpłać…"), żeby wyjść z zablokowania, zamiast zmuszać do wymyślania na pusto.
- **Pominięta motywacja**: nic się nie dzieje — blok WHY opcjonalny; `focus` po prostu nie ma materiału motywacyjnego do pokazania przy tym stresorze.
- **Next-action bez rozbicia**: skip „Jak to możesz rozbić?" → next-action = 1 konkretny task.
- **Zbyt ogólny/vague next-action**: app modeluje aktywny język w promptach i przykładach, ciągnąc usera ku konkretnym, wykonalnym sformułowaniom (standard: ADR 0006).
- **Jeden stresor**: przepływ trywialny (jeden widok pojedynczy → `process`).
- **Bardzo dużo next-actionów/tasków**: rozbicie ma pomóc, nie utopić — zachować **jeden stresor na ekran** (nie cała lista).
- **Błąd zapisu/odczytu LocalStorage** *(po `proto-harden`)*: toast nad ekranem + retry przy nieudanym zapisie (quota/disabled), informacja przy uszkodzonym odczycie; stan UI zawsze odzwierciedla to, co faktycznie zapisane (honest persistence).
- **Usuwanie next-actionu (z jego taskami) / powodu** *(po `proto-harden`)*: dialog potwierdzenia (AlertDialog-style), nie undo — decyzja designu odmienna niż `capture`/ADR 0004.
- **Edycja next-actionu do pustego** *(po `proto-harden`)*: pusty draft anuluje edycję (zostawia oryginał), nie usuwa po cichu — usuwanie to osobna jawna akcja.
- **Ponowne rozbicie tego samego next-actionu** *(po `proto-harden`)*: taski o niezmiennym tekście zachowują identyczność (id + ewentualne atrybuty), więc powrót do `decompose` po `process`/`focus` nie zmaże przypisanych `context`/`energy`/`estimatedTime`.
- **Next-action bez tasków**: brak licznika postępu (`0/0` by myliło) — zostaje etykieta „to break down".
- **Mix stanów pod next-actionem** (np. 1 done, 1 pending): licznik `1/2 done`, brak de-emphasis (de-emphasis tylko gdy **wszystkie** taski załatwione).
- **Ponowne rozbicie next-actionu z done taskami** *(po `proto-harden`)*: `replaceTasksForNextAction` diff-po-tekście zachowuje `state` taskom o niezmiennym tekście → ich znacznik przetrwa; usunięty tekst = usunięty task (stan znika razem z nim); ten sam tekst dodany ponownie = świeży `pending`. De-emphasis i licznik liczą się live, więc same się korygują.
- **Task bez `state` (stare/zmigrowane dane) lub nieznany stan**: renderowany neutralnie (jak `pending`) — guard, nie wywala.
- **`dismissed` ≠ `completed`**: odrębny glyph + etykieta, ale **oba spokojne** — irrelevant NIE na czerwono (DESIGN.md: anti-ref „harsh red alarm").
- **a11y stanu**: stan przekazywany przez glyph + tekst (np. `aria-label="…: done"` / „…: not relevant"), nie tylko kolorem/przekreśleniem.
- **W pełni załatwiony next-action nadal edytowalny**: read-only dotyczy **stanu** tasków, nie CRUD next-actionu — edycja tekstu, rozbicie, usuwanie działają jak zwykle.

## Integration Points
- **`capture`**: wejście — pobiera uporządkowane (zrankowane) stresory.
- **`process`**: wyjście — przekazuje taski (z kontekstem next-action/stresor) do opisania atrybutami (Context / Energy / EstimatedTime).
- **`focus`**: **konsument materiału motywacyjnego** (Reasons + DoneVision) — świeci go np. przy trudnym tasku jako „pamiętaj, po co to robisz". `decompose` ładuje baterię, którą `focus` zużywa.
- **`focus` / `run` → `decompose` (odczyt stanu)**: `completed` / `dismissed` ustawiane w `focus` (Done/Dismiss) i z listy `run` (Mark done/not-relevant) są teraz **widoczne** w bloku HOW `decompose` jako read-only znaczniki + licznik postępu (ADR 0057). Ten sam współdzielony byt `Task` — `decompose` tylko czyta `state`.
- **`run`**: żyje wewnątrz aktywnego Runa; stepper postępu (ADR 0001) prowadzi przez stresory.
- **App shell (ADR 0001)**: etap renderuje się w `AppShell`; brak wolnych linków nawigacji — prowadzenie, nie menu.
