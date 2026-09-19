import type { ReactNode } from 'react';
import type { Phase } from '../../experiences/BrunoThinkingOfYou/timeline';
export function Stage({ phase, paused, children }: { phase: Phase; paused: boolean; children: ReactNode }) {
  return <main className="stage" data-phase={phase} data-paused={paused}>
    <div className="ambient" aria-hidden="true" />
    {phase.startsWith('knock') && <div key={phase} className="glass-ripple" aria-hidden="true" />}
    {children}
  </main>;
}
