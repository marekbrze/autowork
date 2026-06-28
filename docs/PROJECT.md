# Bez nazwy (roboczo)

## Core Idea
Aplikacja, która wyciąga użytkownika z paraliżu planowania, prowadząc go przez narzucony, jednokierunkowy lejek — od surowego "co mnie teraz stresuje", przez ranking, rozbicie na mikrokroki i GTD-procesowanie, aż po sesję focus, w której jedno zadanie goni drugie pod timerem, a na końcu czeka moment celebracji z podsumowaniem czasu. Sedno: zdejmować z człowieka ciężar decydowania "od czego zacząć".

## User Problems
- **Paraliż na etapie planowania**: użytkownik utyka w budowaniu list zadań, porzuca je w połowie i nie potrafi przejść do działania. Pojawia się, kiedy nagromadzi się dużo rzeczy do zrobienia i nie wiadomo, od czego zacząć. Czuje się jak niemoc / overwhelm / zamrożenie. Dziś radzi sobie tworząc listy — co samo w sobie zawodzi, bo przerywa w trakcie.
- **Brak priorytetyzacji**: przy długiej liście nie potrafi wybrać pierwszego kroku.
- **Przepaść między "mam dużo na głowie" a "robię jedną konkretną rzecz teraz"**: brakuje narzuconej ścieżki, która by go przez to przeprowadziła zamiast zostawiać sam na sam z pustą listą.

## Target Users
Na ten moment autor projektu — **osobiste narzędzie, single-user, lokalne**. Ktoś, kto przytłoczony zadaniami potrzebuje prowadzenia za rękę przez gotowy lejek, a nie kolejnego pustego edytora list do samodzielnego zarządzania.

**Główna persona projektowa**: osoba z **ADHD** (oraz ogólnie **overwhelmed** — przytłoczona). Decyzje projektowe stroimy pod nią: duże zadanie paraliżuje → rozbijamy na małe; prowadzimy promptami (nudge), nie zmuszamy; motywację traktujemy jako paliwo, które wraca w trudnym momencie (ADR 0007).

## Deployment & Technical Constraints
- **Hosting**: GitHub Pages — statyczny build Vite (SPA).
- **Persystencja**: `localStorage` przeglądarki, **brak backendu**. Dane żyją lokalnie, per-przeglądarka; brak synchronizacji między urządzeniami. Stan między sesjami oparty o trwały, wznawialny `Run`.
- **Architektura**: single-user, w pełni client-side.
- **Stack**: React + Vite + TypeScript + Tailwind v4 + shadcn/ui (base-nova). Zob. `package.json`.

## Key Actions
W kolejności priorytetu — same kroki lejka to są główne akcje:

1. **Brain dump** — wyrzucić z głowy wszystko, co teraz stresuje.
2. **Ranking stresu** — ustawić stresory od najbardziej do najmniej stresującego.
3. **Next-actions** — dla każdego stresora wypisać, co pchnie go do przodu (może być kilka).
4. **Procesowanie (GTD-style)** — każdemu zadaniu przypisać kontekst, energię i czas.
5. **Wybór sesji** — zaznaczyć kontekst(y) (można kilka), potem energię → wyfiltrować zestaw do zrobienia teraz.
6. **Sesja focus** — start, timer, done / skip / powrót do poprzedniego.
7. **Celebracja** — zobaczyć podsumowanie (co zrobione, łączny czas) i usunąć skończone.

## Happy Path
1. Otwierasz aplikację → pojawia się pytanie **"Co cię teraz stresuje?"** → wpisujesz Enterem stresor po stresorze (pole tekstowe, dodawanie Enterem).
2. **Ranking** — ustawiasz stresory od najbardziej do najmniej stresującego.
3. Aplikacja pokazuje stresory **po kolei, pojedynczo**; do każdego dopisujesz next-action(y) — co można zrobić, żeby popchnąć to do przodu (może być dużo).
4. **Procesowanie** (styl inboxa GTD, jak w aplikacji *dopadone*): dla każdej rzeczy określasz **kontekst** (telefon, wiadomość, kreatywne, chore, dom, miasto), **energię** potrzebną i **czas** potrzebny na zadanie.
5. **Wybór sesji**: najpierw wybierasz **kontekst(y)** (można kilka), potem **energię** → filtruje to długą listę do zestawu zadań, które realnie możesz teraz zrobić.
6. Klikasz **Start** → pojawia się ekran focus pierwszego zadania i odpala **timer** odliczający w dół (przyjmujemy: = oszacowany czas z kroku 4). Po dojściu do zera **timer leci dalej**.
   - **Done** → kolejne zadanie startuje automatycznie.
   - **Skip** → zadanie zostaje na liście na później; wracasz do niego później.
   - Możesz **wrócić do poprzedniego** zadania.
7. Po wyczerpaniu zestawu → **podsumowanie sesji**: które zadania zostały zrobione + **łączny czas** spędzony na zadaniach + przycisk **"Usuń skończone"** (moment celebracji).

## Decisions (resolved)
Otwarte pytania z `proto-init` zostały rozstrzygnięte w `proto-deepen` i `proto-strategize`. Szczegóły w `docs/ENTITY_MAP.md`, `docs/ACTIONS.md`, `docs/GLOSSARY.md`.

- ✅ **Nazwa aplikacji**: roboczo **„Autowork"** (ustawiona w scaffoldzie; do zmiany w 3 plikach).
- ✅ **Persystencja między sesjami**: tak — `localStorage`; `Run` jest trwały i wznawialny (zob. *Deployment* oraz `docs/ENTITY_MAP.md`).
- ✅ **Skala energii**: 1–3 (bateryjki).
- ✅ **Wybór energii**: wiele poziomów naraz.
- ✅ **Skipnięte zadania**: wracają przy **następnej sesji**.
- ✅ **Timer a powrót**: timer się **wznawia** (pamięta pozycję).
- ✅ **Edycja w trakcie sesji**: focus = tryb wykonania (Done/Skip/Back); edycja w Processing i przy review-on-resume.
- ✅ **Jednostka listy focus**: `Task` (NextAction rozkłada się na 1..N tasków).
- ✅ **Single-user / lokalne**: potwierdzone.
- ✅ **Primary persona**: ADHD / overwhelmed — kształtuje rozbijanie zadań, nudge-not-gate, motywację jako paliwo (ADR 0007).
- ✅ **`decompose` = WHY + HOW**: WHY (materiał motywacyjny: powody + wizja efektu) i HOW (next-actiony → taski, aktywny/konkretny język); WHY konsumowane w `focus` (ADR 0005, 0006).
