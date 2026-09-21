import { useEffect, useRef } from 'react';
import type { Phase } from '../../experiences/BrunoThinkingOfYou/timeline';
import type { MouthSignal } from '../../lib/audio/mouthEnvelope';
import { BrunoStateDriver, validateInputs } from '../../lib/rive/brunoStateMap';
import { loadRuntime, type BrunoRuntime, type RiveConfig, type RuntimeLoader } from '../../lib/rive/runtime';

export interface BrunoRiveProps {
  config: RiveConfig; phase: Phase; paused: boolean; active: boolean; mouth: MouthSignal;
  onReady(): void; onFailure(): void; runtimeLoader?: RuntimeLoader;
}
export function BrunoRiveCharacter({ config, phase, paused, active, mouth, onReady, onFailure, runtimeLoader = loadRuntime }: BrunoRiveProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const runtime = useRef<BrunoRuntime | null>(null);
  const driver = useRef<BrunoStateDriver | null>(null);
  const current = useRef({ phase, paused, active });
  current.current = { phase, paused, active };
  const callbacks = useRef({ onReady, onFailure });
  callbacks.current = { onReady, onFailure };

  useEffect(() => {
    let disposed = false;
    let ready = false;
    let instance: BrunoRuntime | undefined;
    let resize: ResizeObserver | undefined;
    const abort = new AbortController();
    const fail = () => {
      if (disposed) return;
      disposed = true;
      abort.abort();
      window.clearTimeout(timeout);
      resize?.disconnect();
      driver.current = null;
      runtime.current = null;
      instance?.cleanup();
      callbacks.current.onFailure();
    };
    const timeout = window.setTimeout(fail, 8000);
    // Netlify's SPA rewrite may return HTML with 200 for a missing public asset.
    // Validate the header before invoking the binary runtime; no fake .riv file.
    void (async () => {
      try {
        const response = await fetch(config.src, { signal: abort.signal });
        if (!response.ok) throw new Error('Rive unavailable');
        const buffer = await response.arrayBuffer();
        if (new TextDecoder().decode(buffer.slice(0, 4)) !== 'RIVE') throw new Error('Not Rive data');
        const factory = await runtimeLoader();
        if (disposed || !canvas.current) return;
        instance = factory.create({
          canvas: canvas.current, buffer, config,
          onError: fail,
          onLoad: () => {
            // Runtime load notifications are asynchronous; defer for constructors
            // that notify before their assignment has completed.
            queueMicrotask(() => {
              if (disposed || !instance) return;
              try {
                const artboard = instance.contents.artboards?.find(item => item.name === config.artboard);
                const inputs = validateInputs(instance.stateMachineInputs(config.stateMachine), factory.types);
                if (!artboard?.stateMachines.some(item => item.name === config.stateMachine) || !inputs) { fail(); return; }
                driver.current = new BrunoStateDriver(inputs);
                driver.current.apply('idle', false);
                instance.resizeDrawingSurfaceToCanvas();
                instance.play(config.stateMachine);
              } catch { fail(); }
            });
          },
          onAdvance: () => {
            if (disposed || ready || !driver.current) return;
            ready = true;
            window.clearTimeout(timeout);
            if (!current.current.active) instance?.pause();
            callbacks.current.onReady();
          },
        });
        runtime.current = instance;
        resize = new ResizeObserver(() => { if (!disposed) { try { instance?.resizeDrawingSurfaceToCanvas(); } catch { fail(); } } });
        resize.observe(canvas.current);
      } catch { fail(); }
    })();
    return () => {
      disposed = true;
      abort.abort();
      window.clearTimeout(timeout);
      resize?.disconnect();
      driver.current = null;
      runtime.current = null;
      instance?.cleanup();
    };
  }, [config.src, config.artboard, config.stateMachine, runtimeLoader]);

  useEffect(() => {
    try {
      driver.current?.apply(active ? phase : 'idle', paused);
      if (paused || !active || phase === 'cta') runtime.current?.pause();
      else runtime.current?.play(config.stateMachine);
    } catch { callbacks.current.onFailure(); }
  }, [phase, paused, active, config.stateMachine]);

  useEffect(() => mouth.subscribe(value => {
    const state = current.current;
    try { driver.current?.mouth(value, state.active ? state.phase : 'idle', state.paused); }
    catch { callbacks.current.onFailure(); }
  }), [mouth]);

  const visible = active && !['idle', 'opening', 'knock1', 'knock2', 'knock3', 'cta'].includes(phase);
  return <div className={`rive-character ${visible ? 'is-visible' : ''}`} data-renderer="rive" aria-hidden="true">
    <canvas ref={canvas} />
  </div>;
}
