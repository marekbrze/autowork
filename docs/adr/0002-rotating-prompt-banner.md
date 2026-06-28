# 0002 - Rotujący banner-prompt w brain dumpie

**Date**: 2026-06-28
**Module**: capture
**Status**: Accepted

## Context
Podczas detailing modułu `capture` user opisał, że w brain dumpie chce „aktywne prompty, które pomogą zlapać o co chodzi" — coś, co wyciągnie stresory umykające przy wyrzucaniu z głowy. Finalny kształt: **interaktywny, rotujący banner** zmieniający się co kilka sekund. To nowy element, którego nie było w `ACTIONS.md` ani `GLOSSARY.md`.

## Decision
Wprowadzono **`PromptBanner`** — interaktywny, rotujący banner w brain dumpie, zmieniający się co kilka sekund; podsuwa kategorie / przykłady stresorów („finanse", „A rata kredytu?") i jest klikalny (pre-fill pola). Dodać termin do `GLOSSARY.md` oraz akcję „Pick prompt suggestion" do `ACTIONS.md` (encja `Stressor`).

## Impact
- `GLOSSARY.md`: nowy wiersz `PromptBanner`.
- `ACTIONS.md`: nowa akcja „Pick prompt suggestion" w sekcji Stressor.
- Rozszerza brain dump o warstwę aktywnej pomocy — wzmacnia obietnicę „nie zostawiaj usera z pustą listą".
