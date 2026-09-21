import type { Phase } from '../../experiences/BrunoThinkingOfYou/timeline';
export const requiredInputs = {
  showBruno: 'boolean', talking: 'boolean', mouthOpen: 'number',
  peekTrigger: 'trigger', riseTrigger: 'trigger', pawTrigger: 'trigger',
  winkTrigger: 'trigger', waveTrigger: 'trigger', turnTrigger: 'trigger', departTrigger: 'trigger',
} as const;
export type Trigger = { [K in keyof typeof requiredInputs]: typeof requiredInputs[K] extends 'trigger' ? K : never }[keyof typeof requiredInputs];
export interface BrunoAction { showBruno: boolean; talking: boolean; trigger?: Trigger }
const hidden = { showBruno: false, talking: false };
const visible = { showBruno: true, talking: false };
const speaking = { showBruno: true, talking: true };
export const brunoStateMap: Record<Phase, BrunoAction> = {
  idle: hidden, opening: hidden, knock1: hidden, knock2: hidden, knock3: hidden,
  capPeek: { ...visible, trigger: 'peekTrigger' }, eyesRise: { ...visible, trigger: 'riseTrigger' },
  peek: visible, paw: { ...visible, trigger: 'pawTrigger' },
  recognition: speaking, introduction: speaking, message: speaking,
  reaction: { ...visible, trigger: 'winkTrigger' }, exit: speaking,
  wave: { ...visible, trigger: 'waveTrigger' }, wink: { ...visible, trigger: 'winkTrigger' },
  turn: { ...visible, trigger: 'turnTrigger' }, depart: { ...visible, trigger: 'departTrigger' }, cta: hidden,
};
export interface BrunoInput { name: string; type: number; value: number | boolean; fire(): void }
export type BrunoInputs = Record<keyof typeof requiredInputs, BrunoInput>;
// Runtime enum values are injected, avoiding a runtime dependency in pure mapping tests.
export function validateInputs(inputs: BrunoInput[] | undefined, types: Record<'boolean' | 'number' | 'trigger', number>): BrunoInputs | null {
  const result = {} as BrunoInputs;
  for (const [name, kind] of Object.entries(requiredInputs)) {
    const input = inputs?.find(input => input.name === name);
    if (!input || input.type !== types[kind]) return null;
    result[name as keyof BrunoInputs] = input;
  }
  return result;
}
/** Instance-local entry guard; pause, mute and envelope updates never refire triggers. */
export class BrunoStateDriver {
  private previous?: Phase;
  constructor(private inputs: BrunoInputs) {}
  apply(phase: Phase, paused: boolean) {
    const action = brunoStateMap[phase];
    this.inputs.showBruno.value = action.showBruno;
    this.inputs.talking.value = action.talking && !paused;
    if (!action.talking || paused) this.inputs.mouthOpen.value = 0;
    if (phase !== this.previous) {
      this.previous = phase;
      if (action.trigger) this.inputs[action.trigger].fire();
    }
  }
  mouth(value: number, phase: Phase, paused: boolean) {
    this.inputs.mouthOpen.value = brunoStateMap[phase].talking && !paused && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  }
}
