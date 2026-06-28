import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { ProcessView } from './ProcessView';
import type { Stressor } from '@/modules/capture/types/stressor';
import type { NextAction } from '@/modules/decompose/types/next-action';
import type { Task } from '@/modules/decompose/types/task';

const TS = '2026-06-28T00:00:00.000Z';

const stressors: Stressor[] = [
  { id: 's1', text: 'samochód do naprawy', createdAt: TS, updatedAt: TS },
  { id: 's2', text: 'wypowiedzenie umowy najmu', createdAt: TS, updatedAt: TS },
];

const nextActions: NextAction[] = [
  { id: 'na1', stressorId: 's1', text: 'Umów warsztat', createdAt: TS, updatedAt: TS },
  { id: 'na2', stressorId: 's2', text: 'Wypowiedz najem', createdAt: TS, updatedAt: TS },
];

function bareTask(id: string, nextActionId: string, stressorId: string, text: string): Task {
  return { id, text, nextActionId, stressorId, state: 'pending', timerElapsed: 0, createdAt: TS, updatedAt: TS };
}

function seed(tasks: Task[]) {
  localStorage.setItem('capture:stressors', JSON.stringify(stressors));
  localStorage.setItem('decompose:nextActions', JSON.stringify(nextActions));
  localStorage.setItem('decompose:tasks', JSON.stringify(tasks));
}

const meta: Meta<typeof ProcessView> = {
  title: 'Process/ProcessView',
  component: ProcessView,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="mx-auto max-w-5xl py-4">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ProcessView>;

/**
 * Podsumowanie z zadaniami do przetworzenia (2 stresory, taski „gołe").
 * Klik „Rozpocznij" (lub ↵) → ekran processing ze groupingiem po stresorze.
 */
export const WithData: Story = {
  decorators: [
    (Story) => {
      seed([
        bareTask('t1', 'na1', 's1', 'Znajdź numer telefonu do warsztatu'),
        bareTask('t2', 'na1', 's1', 'Zadzwoń i umów wizytę na ten tydzień'),
        bareTask('t3', 'na2', 's2', 'Napisz wypowiedzenie najmu'),
        bareTask('t4', 'na2', 's2', 'Wyślij list polecony'),
      ]);
      return <Story />;
    },
  ],
};

/** Brak zadań — empty state „Wszystko gotowe". */
export const EmptyState: Story = {
  decorators: [
    (Story) => {
      seed([]);
      return <Story />;
    },
  ],
};

/** Wszystkie taski opisane — też „Wszystko gotowe" (nic do procesowania). */
export const AllProcessed: Story = {
  decorators: [
    (Story) => {
      seed([
        { ...bareTask('t1', 'na1', 's1', 'Znajdź numer do warsztatu'), context: 'Phone', energy: 2, estimatedTime: 15 },
        { ...bareTask('t2', 'na2', 's2', 'Wyślij list polecony'), context: 'Errands', energy: 1, estimatedTime: 30 },
      ]);
      return <Story />;
    },
  ],
};

/**
 * Bardzo długa nazwa taska (+ długi stresor / next-action). Klik „Rozpocznij" →
 * w main nazwa clamp-2 z tooltipem, nagłówek stresora i breadcrumb skrócone
 * (truncate) — grid opcji zostaje na miejscu.
 */
export const LongName: Story = {
  decorators: [
    (Story) => {
      seed([
        bareTask(
          't1',
          'na1',
          's1',
          'Znajdź numer telefonu do warsztatu, zadzwoń i umów wizytę na ten tydzień rano przed spotkaniem o 13:00',
        ),
      ]);
      localStorage.setItem(
        'capture:stressors',
        JSON.stringify([{ ...stressors[0], text: 'Bardzo długa nazwa stresora nie mieszcząca się w jednej linijce sidebaru' }]),
      );
      localStorage.setItem(
        'decompose:nextActions',
        JSON.stringify([{ ...nextActions[0], text: 'Długi opis next-actionu rozbijany na taski, nie mieści się w breadcrumbzie' }]),
      );
      return <Story />;
    },
  ],
};

/**
 * Uszkodzony odczyt LocalStorage (zły JSON `decompose:tasks`) → start od pustej
 * listy + toast „Nie udało się wczytać zadań" ze ścieżką odzyskiwania. Pokazuje
 * agregację statusu persystencji (tu: read-error tasków).
 */
export const StorageReadError: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('capture:stressors', JSON.stringify(stressors));
      localStorage.setItem('decompose:nextActions', JSON.stringify(nextActions));
      localStorage.setItem('decompose:tasks', '{ to nie jest poprawny json');
      return <Story />;
    },
  ],
};
