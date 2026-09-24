import type { BrunoCharacterConfig } from '../../config/characters/bruno';
import type { BrunoInput } from './brunoStateMap';
export type RiveConfig = NonNullable<BrunoCharacterConfig['rive']>;
export interface BrunoRuntime {
  contents: { artboards?: { name: string; stateMachines: { name: string }[] }[] };
  stateMachineInputs(name: string): BrunoInput[] | undefined;
  play(name?: string): void;
  pause(): void;
  cleanup(): void;
  resizeDrawingSurfaceToCanvas(): void;
}
export interface RuntimeOptions {
  canvas: HTMLCanvasElement;
  buffer: ArrayBuffer;
  config: RiveConfig;
  onLoad(): void;
  onError(): void;
  onAdvance(): void;
}
export interface RuntimeFactory {
  types: Record<'boolean' | 'number' | 'trigger', number>;
  create(options: RuntimeOptions): BrunoRuntime;
}
export type RuntimeLoader = () => Promise<RuntimeFactory>;
/** Official React runtime exports its canvas engine for lifecycle integrations.
 * Import only after a real RIVE header, so missing assets incur no WASM cost. */
export const loadRuntime: RuntimeLoader = async () => {
  const { Rive, Layout, Fit, Alignment, StateMachineInputType } = await import('@rive-app/react-canvas');
  return {
    types: { boolean: StateMachineInputType.Boolean, number: StateMachineInputType.Number, trigger: StateMachineInputType.Trigger },
    create: ({ canvas, buffer, config, onLoad, onError, onAdvance }) => new Rive({
      canvas, buffer, artboard: config.artboard, stateMachines: config.stateMachine,
      autoplay: true, layout: new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter }),
      onLoad, onLoadError: onError, onAdvance, automaticallyHandleEvents: false,
    }),
  };
};
