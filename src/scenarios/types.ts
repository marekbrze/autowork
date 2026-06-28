export type ScenarioName = 'empty' | 'minimal' | 'full' | string;

export interface AppData {
  /** Wartości są shape-agnostic — loader tylko stringifies do localStorage. */
  [moduleKey: string]: unknown;
}
