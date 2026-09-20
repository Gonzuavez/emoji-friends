import { copy, type Gift } from '../../config/gifts/brunoThinkingOfYou';

export const timeline = [
  { id: 'opening', duration: 950 },
  { id: 'knock1', duration: 1200 },
  { id: 'knock2', duration: 260 },
  { id: 'knock3', duration: 850 },
  { id: 'capPeek', duration: 850 },
  { id: 'eyesRise', duration: 950 },
  { id: 'peek', duration: 1000 },
  { id: 'paw', duration: 1100 },
  { id: 'recognition', duration: 2400 },
  { id: 'introduction', duration: 4400 },
  { id: 'message', duration: 4900 },
  { id: 'reaction', duration: 950 },
  { id: 'exit', duration: 5300 },
  { id: 'wave', duration: 1100 },
  { id: 'wink', duration: 650 },
  { id: 'turn', duration: 750 },
  { id: 'depart', duration: 1500 },
] as const;
export type Phase = 'idle' | typeof timeline[number]['id'] | 'cta';
export type DialogueCue = keyof Gift['audio'];
export function isDialogue(phase: Phase): phase is DialogueCue {
  return ['recognition', 'introduction', 'message', 'exit'].includes(phase);
}
export function caption(phase: Phase, gift: Gift): string {
  if (phase === 'message') return gift.message;
  if (phase === 'recognition' || phase === 'introduction' || phase === 'exit') return copy[phase](gift);
  return '';
}
export function durationFor(index: number, gift: Gift): number {
  const step = timeline[index];
  // Keep longer future local messages readable; no fixed-duration truncation.
  return Math.max(step.duration, caption(step.id, gift).split(/\s+/).length * 310 + (isDialogue(step.id) ? 900 : 0));
}
