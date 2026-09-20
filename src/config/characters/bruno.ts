export type BrunoPose = 'capPeek' | 'eyesRise' | 'peek' | 'paw' | 'recognition' | 'introduction' | 'message' | 'reaction' | 'exit' | 'wave' | 'wink' | 'turn' | 'depart';
export interface BrunoCharacterConfig {
  name: string;
  image?: string;
  // Optional approved pose art. Missing/broken poses fall back to the base PNG.
  poseImages?: Partial<Record<BrunoPose, string>>;
  voice: { id: string; language: string; direction: string };
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
  image: '/characters/bruno/bruno.png',
  poseImages: {},
  voice: {
    id: 'bruno-en-v1',
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
