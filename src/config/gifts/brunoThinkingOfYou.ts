export interface Gift {
  id: string;
  senderName: string;
  recipientName: string;
  message: string;
  character: { name: string; image?: string };
  // Optional local recordings keyed to the dialogue cues. Captions always remain.
  audio: Partial<Record<'recognition' | 'introduction' | 'message' | 'exit', string>>;
}

export const brunoThinkingOfYou: Gift = {
  id: 'bruno-thinking-of-you',
  senderName: 'Angel',
  recipientName: 'Leticia',
  message: 'Just a little reminder that someone is thinking about you today.',
  character: { name: 'Bruno' },
  audio: {},
};

export const copy = {
  arrival: 'Someone sent you a little something…',
  recognition: (gift: Gift) => `Psst… ${gift.recipientName}?`,
  introduction: (gift: Gift) => `Hi! I’m ${gift.character.name}. ${gift.senderName} asked me to bring you something.`,
  exit: (gift: Gift) => `Okay… my job here is done. But don’t tell ${gift.senderName} I ate the snacks.`,
  reveal: 'Someone thinking of you can change your whole day.',
};

// The route depends on this loader, not the storage mechanism. Replace its body
// with a remote lookup later; never create a new component for each recipient.
export async function loadGift(id: string): Promise<Gift | null> {
  return id === brunoThinkingOfYou.id ? brunoThinkingOfYou : null;
}
