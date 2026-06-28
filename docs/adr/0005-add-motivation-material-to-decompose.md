# 0005 - add motivation material to decompose (WHY half)

**Date**: 2026-06-28
**Module**: decompose
**Status**: Accepted

## Context
Podczas detailing modułu `decompose` user opisał go jako odpowiedź na dwa pytania: DLACZEGO stresor jest dla niego ważny i JAK go popchnąć do przodu. Dotychczasowa dokumentacja (`ENTITY_MAP`, `ACTIONS`, `GLOSSARY`) pokrywała tylko HOW (`NextAction` → `Task`). Brakowało połowy WHY — materiału motywacyjnego, który user tworzy dla każdego stresora i który ma wracać później (np. w `focus`) jako przypomnienie „po co to robisz".

User doprecyzował kształt tego materiału: powody może być kilka, każdy z **walencją** — pozytywną (zysk) lub negatywną (uniknięcie bólu); dodatkowo może być **pozytywna wizja efektu** (zrobiony stan). Materiał wpisuje user, ale apka może prowadzić; blok pokazywany przy każdym stresorze, opcjonalny/skippowalny.

## Decision
Wprowadzić materiał motywacyjny (`Motivation`) w `decompose`:
- nowa encja **`Reason`** — powód, dla którego stresor jest ważny, z atrybutem **`valence`**: `positive` (zysk) | `negative` (uniknięcie bólu); 0..N na stresor;
- atrybut **`doneVision`** na `Stressor` — opcjonalna (0..1), żywa wizja zrobionego stanu (tekst + emoji);
- blok WHY pokazywany przy każdym stresorze, **opcjonalny/skippowalny** (nudge, nie bramka — spójnie z `capture`);
- konsumowany później w `focus` (świetli się np. przy trudnym tasku).

## Impact
- `ENTITY_MAP.md`: dodana encja `Reason` (relacja `Stressor ||--o{ Reason`), atrybut `doneVision` na `Stressor`, typy wartości `Valence` / `DoneVision`.
- `ACTIONS.md`: nowa sekcja `Motivation` (Add Reason, Add DoneVision, Skip motivation).
- `GLOSSARY.md`: terminy `Motivation`, `Reason`, `Valence`, `DoneVision`; zaktualizowany opis modułu `decompose`.
- `MODULES.md`: encje i opis `decompose` rozszerzone o WHY; krawędź motivation → focus w mapie integracji.
- `decompose` zyskuje drugą funkcję: nie tylko produkuje taski, ale **magazynuje paliwo motywacyjne** dla `focus`.
