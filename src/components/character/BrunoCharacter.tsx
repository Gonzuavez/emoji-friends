import { useEffect, useState } from 'react';
import type { Gift } from '../../config/gifts/brunoThinkingOfYou';
import type { Phase } from '../../experiences/BrunoThinkingOfYou/timeline';
import type { MouthSignal } from '../../lib/audio/mouthEnvelope';
import type { RuntimeLoader } from '../../lib/rive/runtime';
import { BrunoPngCharacter } from './BrunoPngCharacter';
import { BrunoRiveCharacter } from './BrunoRiveCharacter';

export function BrunoCharacter({ phase, character, prop, paused, mouth, onRendererChange, runtimeLoader }: {
  phase: Phase; character: Gift['character']; prop: Gift['prop']; paused: boolean;
  mouth: MouthSignal; onRendererChange(active: boolean): void; runtimeLoader?: RuntimeLoader;
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(false);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => { setReady(false); setFailed(false); setActive(false); }, [character.rive]);
  // Late readiness waits for replay/the next black opening, rather than jumping
  // into the middle of an authored transition or briefly showing two Brunos.
  useEffect(() => {
    if (failed || reduced || !character.rive || prop) { setActive(false); setReady(false); }
    else if (ready && ['idle', 'opening', 'knock1', 'knock2', 'knock3'].includes(phase)) setActive(true);
  }, [ready, failed, reduced, phase, character.rive, prop]);
  const primary = active && !failed && !reduced && !prop;
  useEffect(() => { onRendererChange(primary); }, [primary, onRendererChange]);
  return <div data-bruno-renderer={primary ? 'rive' : 'png'}>
    <div className="png-renderer" hidden={primary}>
      <BrunoPngCharacter phase={phase} character={character} prop={prop} />
    </div>
    {character.rive && !failed && !reduced && !prop && <BrunoRiveCharacter
      config={character.rive} phase={phase} paused={paused} active={primary} mouth={mouth}
      onReady={() => setReady(true)} onFailure={() => { setFailed(true); setReady(false); }} runtimeLoader={runtimeLoader}
    />}
  </div>;
}
