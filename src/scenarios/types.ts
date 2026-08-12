export type ScenarioName = 'empty' | 'minimal' | 'full' | string;

export interface AppData {
  /** Values are shape-agnostic — the loader just stringifies them into localStorage. */
  [moduleKey: string]: unknown;
}
