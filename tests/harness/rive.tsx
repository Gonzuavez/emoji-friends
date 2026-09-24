// Test-only runtime double. Not a real Rive asset or artwork; Vite production
// entry points never import this fixture.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrunoCharacter } from '../../src/components/character/BrunoCharacter';
import { bruno } from '../../src/config/characters/bruno';
import { requiredInputs } from '../../src/lib/rive/brunoStateMap';
import type { RuntimeLoader } from '../../src/lib/rive/runtime';
import { ExperienceAudio } from '../../src/audio/ExperienceAudio';
import { brunoThinkingOfYou } from '../../src/config/gifts/brunoThinkingOfYou';
import { timeline, type Phase } from '../../src/experiences/BrunoThinkingOfYou/timeline';
import '../../src/styles.css';
const stats = { created: 0, cleaned: 0, triggers: [] as string[], values: {} as Record<string, number | boolean> };
const scenario = new URLSearchParams(location.search).get('scenario');
const player = new ExperienceAudio();
const mouth = player.mouth;
player.onInterrupted = () => player.stop();
const types = { boolean: 59, number: 56, trigger: 58 };
const loader: RuntimeLoader = async () => ({ types, create(options) {
  stats.created++;
  let alive = true;
  const inputs = Object.entries(requiredInputs).filter(([name]) => scenario !== 'missing-input' || name !== 'mouthOpen').map(([name, kind]) => ({
    name, type: scenario === 'wrong-type' && name === 'mouthOpen' ? 59 : types[kind],
    get value() { return stats.values[name] ?? 0; }, set value(value: number | boolean) { stats.values[name] = value; },
    fire() { stats.triggers.push(name); },
  }));
  const completeLoad = () => { if (alive) { options.onLoad(); setTimeout(() => { if (alive) options.onAdvance(); }, 10); } };
  if (scenario === 'late') Object.assign(window, { completeRiveLoad: completeLoad });
  else setTimeout(completeLoad, 20);
  Object.assign(window, { failRive: options.onError });
  return {
    contents: { artboards: [{ name: scenario === 'wrong-artboard' ? 'Other' : 'Bruno', stateMachines: [{ name: 'BrunoStateMachine' }] }] },
    stateMachineInputs: () => inputs, play() {}, pause() {}, resizeDrawingSurfaceToCanvas() {},
    cleanup() { if (alive) stats.cleaned++; alive = false; },
  };
} });
Object.assign(window, { riveStats: stats, mouthDriver: mouth });
function Harness() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [paused, setPaused] = useState(false);
  const [, setPrimary] = useState(false);
  return <main className="stage" data-phase={phase}>
    <BrunoCharacter phase={phase} character={bruno} prop={null} paused={paused} mouth={mouth} onRendererChange={setPrimary} runtimeLoader={loader} />
    <nav style={{ position: 'relative', zIndex: 10 }}>{['idle', ...timeline.map(step => step.id), 'cta'].map(phase => <button key={phase} onClick={() => setPhase(phase as Phase)}>{phase}</button>)}<button onClick={() => setPaused(value => !value)}>pause toggle</button><button onClick={() => { setPhase('exit'); void player.unlock().then(() => player.play('exit', brunoThinkingOfYou)); }}>real speech</button><button onClick={() => player.setMuted(true)}>mute audio</button><button onClick={() => player.stop()}>stop audio</button></nav>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Harness />);
