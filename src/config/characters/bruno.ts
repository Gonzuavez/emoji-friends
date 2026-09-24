export type BrunoPose = 'capPeek' | 'eyesRise' | 'peek' | 'paw' | 'recognition' | 'introduction' | 'message' | 'reaction' | 'exit' | 'wave' | 'wink' | 'turn' | 'depart';
export interface BrunoCharacterConfig {
  name: string;
  branding: string;
  image?: string;
  // Optional approved pose art. Missing/broken poses fall back to the base PNG.
  poseImages?: Partial<Record<BrunoPose, string>>;
  rive?: { src: string; artboard: string; stateMachine: string };
  voice: { id: string; name: string; provider: 'heygen'; language: string; direction: string };
}
export interface EmotionalProp {
  image: string;
  description: string;
  showDuring: BrunoPose[];
}

/** Canonical character/voice identity, shared by future Bruno occasions.
 * This is an asset contract, not a client-side voice-generation service.
 */
export const bruno: BrunoCharacterConfig = {
  name: 'Bruno',
  rive: { src: '/rive/bruno/bruno.riv', artboard: 'Bruno', stateMachine: 'BrunoStateMachine' },
  branding: 'Bruno paw-heart',
  image: '/characters/bruno/bruno.png',
  // Every performance state uses a dedicated standalone PNG. The base image
  // is retained only as a non-performance fallback outside the pose sequence.
  poseImages: {
    capPeek: '/characters/bruno/poses/bruno-peek.png',
    eyesRise: '/characters/bruno/poses/bruno-rising.png',
    peek: '/characters/bruno/poses/bruno-peek.png',
    paw: '/characters/bruno/poses/bruno-paw-glass.png',
    recognition: '/characters/bruno/poses/bruno-hello.png',
    introduction: '/characters/bruno/poses/bruno-master.png',
    message: '/characters/bruno/poses/bruno-talking.png',
    reaction: '/characters/bruno/poses/bruno-wink.png',
    exit: '/characters/bruno/poses/bruno-master.png',
    wave: '/characters/bruno/poses/bruno-wave.png',
    wink: '/characters/bruno/poses/bruno-wink.png',
    turn: '/characters/bruno/poses/bruno-exit.png',
    depart: '/characters/bruno/poses/bruno-exit.png',
  },
  voice: {
    id: 'M9QQyAAoUtDSmALeZnRw',
    name: 'BRUNOJI',
    provider: 'heygen',
    language: 'en',
    direction: 'Youthful (8–10-year-old character feel), light, warm, cheerful, curious, playful, gentle, expressive and natural. Family-friendly; never shrill, deep, adult, announcer-like or corporate.',
  },
} as const;

export const brunoDemoAudio = {
  recognition: '/audio/bruno-recognition.mp3',
  introduction: '/audio/bruno-introduction.mp3',
  message: '/audio/bruno-message.mp3',
  exit: '/audio/bruno-exit.mp3',
} as const;
