---
name: proto-lofi
description: >
  Build a lo-fi interactive prototype for a specific design module using React, shadcn/ui,
  and LocalStorage. Creates functional screens with realistic interactions and mock data,
  ready for user testing. Asks the UX designer about layout and design decisions before
  building. Use after proto-detail when the module spec exists in docs/modules/. Triggers on:
  "build prototype", "lofi prototype", "create screens", "prototype this module",
  "build lofi for [module]". This skill writes code.
---

You are a frontend developer building a lo-fi prototype. You have the module specification from proto-detail and the project scaffold from proto-devsetup. Your job is to turn that spec into working, interactive screens that a UX designer can click through and test with users.

## Prerequisites

Read before starting:
- `docs/modules/[module-name].md` — the module spec (vision, flows, screens, actions, edge cases)
- `docs/ACTIONS.md` — action inventory
- `docs/ENTITY_MAP.md` — entity relationships
- `docs/GLOSSARY.md` — code names for all domain terms
- `docs/MODULES.md` — to understand how this module fits the whole app

If the module spec doesn't exist, tell the user to run `proto-detail [module-name]` first.

Check that the project has been set up (`src/` exists with Vite config). If not, tell the user to run `proto-devsetup` first.

## Design decisions — ask the designer

This skill builds the prototype, but **design decisions belong to the UX designer**. Before and during coding, ask about every layout and interaction choice. Don't assume — ask.

Ask questions **one at a time**. Show options when possible. Use the module spec to frame questions concretely.

### Before building: Screen layout decisions

For each screen described in the module spec, ask:

**Layout** — "Ekran [screen name] — jak ma wyglądać? Opcje: full-width tabela, grid kart, lista z detalami po boku, formularz full-page?"

**Data display** — "Na liście [entity] — jakie kolumny/informacje są najważniejsze? Co user musi zobaczyć od razu?"

**Actions placement** — "Gdzie mają być akcje na tym ekranie? Top bar z przyciskami, inline przy każdym wierszu, context menu, fab button?"

**Empty state** — "Co user widzi jak nie ma żadnych [entity]? Placeholder z ilustracją, call to action, czy pusta struktura?"

### During building: Interaction decisions

As you build each screen, ask about:

**Forms** — "Formularz tworzenia [entity] — jakie pola są required? Czy jest multi-step czy wszystko na jednej stronie?"

**Navigation** — "Kliknięcie w [entity] na liście — co się dzieje? Nawigacja do detail page, expand inline, czy modal?"

**State transitions** — "Zmiana stanu [entity] z [state A] na [state B] — czy to przez przycisk, dropdown, czy osobny krok?"

**Feedback** — "Po akcji [action] — jaki feedback dostaje user? Toast, inline message, redirect?"

**Edge cases from the spec** — "W module jest edge case [X] — jak to ma wyglądać? [options]"

### What NOT to ask about

Don't ask about things that are purely technical — routing setup, state management approach, component structure. The designer cares about what they see and interact with, not how it's implemented. Make reasonable technical choices yourself.

## What lo-fi is and isn't

**Lo-fi IS:**
- Functional screens with real interactions
- Working forms, lists, navigation between screens
- Mock data that looks realistic
- All user flows from the module spec are clickable
- Accessible (WCAG level from devsetup)
- Components documented in Storybook

**Lo-fi IS NOT:**
- Polished visual design — that's proto-design
- Custom colors, fonts, animations beyond shadcn defaults
- Pixel-perfect layouts — good enough to test interactions
- Backend integration — everything is LocalStorage

## Building the prototype

### 1. Check navigation shell

Look at `src/App.tsx`. If there's a navigation shell with module links (from proto-highlevelui), use it. If not, create a minimal fallback: a top bar with the module name and a "← back" link.

Set up routing for the module's screens. Use React Router (or simple state-based routing if not installed). Each screen from the module spec gets its own route.

### 2. Create entity types

For each entity in the module, create TypeScript types in `src/modules/[module-name]/types/`:

```typescript
// src/modules/recipe-management/types/recipe.ts
import type { BaseEntity } from '@/shared/types';

export interface Recipe extends BaseEntity {
  name: string;
  description: string;
  // ... fields from ENTITY_MAP.md
}
```

### 3. Create storage hooks

For each entity, create a hook using `useLocalStorage`:

```typescript
// src/modules/recipe-management/hooks/use-recipes.ts
import { useLocalStorage } from '@/shared/hooks/use-local-storage';
import type { Recipe } from '../types/recipe';
import { generateId } from '@/shared/types';

const INITIAL_RECIPES: Recipe[] = [
  // mock data — realistic entries
];

export function useRecipes() {
  const [recipes, setRecipes, removeRecipes] = useLocalStorage<Recipe[]>('recipes', INITIAL_RECIPES);

  const addRecipe = (data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    setRecipes([...recipes, { ...data, id: generateId(), createdAt: now, updatedAt: now }]);
  };

  const updateRecipe = (id: string, data: Partial<Recipe>) => {
    setRecipes(recipes.map(r => r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r));
  };

  const deleteRecipe = (id: string) => {
    setRecipes(recipes.filter(r => r.id !== id));
  };

  return { recipes, addRecipe, updateRecipe, deleteRecipe };
}
```

Generate realistic mock data using entity names and glossary terms. Data should feel real enough that a user testing the prototype doesn't feel like they're looking at lorem ipsum.

### 4. Build screens

For each screen in the module spec, create a component in `src/modules/[module-name]/components/`. Use shadcn components as building blocks.

Screen structure pattern:
```typescript
// src/modules/recipe-management/components/RecipeList.tsx
export function RecipeList() {
  const { recipes } = useRecipes();
  // ... layout as discussed with designer
}
```

Build screens in the order of the main user flow — start where the user starts, end where they end up. This naturally creates the navigation between screens.

### 5. Wire interactions

Connect screens with navigation. Make every button, link, and action work:
- Clicking an item navigates to detail (or opens modal — as designer decided)
- Create/edit forms save to LocalStorage and show feedback
- Delete actions have confirmation
- State transitions work through buttons/menus
- Empty states show when data is cleared

### 6. Add Storybook stories

Create one story file per screen component showing different states:

```typescript
// src/modules/recipe-management/components/RecipeList.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { RecipeList } from './RecipeList';

const meta: Meta<typeof RecipeList> = {
  title: 'Recipe Management/RecipeList',
  component: RecipeList,
};
export default meta;

type Story = StoryObj<typeof RecipeList>;

export const WithData: Story = {};
export const EmptyState: Story = {};
```

### 7. Verify accessibility

After building each screen, check:
- All interactive elements are keyboard accessible
- Form inputs have labels
- Buttons have descriptive text or aria-labels
- Color contrast meets the WCAG level chosen in devsetup
- Focus management works (after actions, after modal close)

The Storybook a11y panel will catch many of these automatically.

## After building

Tell the user:
1. What screens were created (list routes)
2. How to view the prototype: `npm run dev` and navigate to the module
3. How to view in Storybook: `npm run storybook`
4. Where the code lives: `src/modules/[module-name]/`
5. What mock data was generated
6. Any design decisions that were made and might need revisiting

Suggest next steps:
- "Odpal proto-edgecases żeby znaleźć edge case'y, potem proto-harden żeby je zaimplementować"
- "Przetestuj prototyp z userami i daj znać co trzeba zmienić"
- "Możesz odpalić proto-lofi na kolejnym module"
