import { useEffect, useRef, useState } from 'react';
import { copy, type Gift } from '../../config/gifts/brunoThinkingOfYou';
import { BrunoCharacter } from '../../components/character/BrunoCharacter';
import { Stage } from '../../components/stage/Stage';
import { caption } from './timeline';
import { useExperience } from './useExperience';

export function BrunoThinkingOfYou({ gift }: { gift: Gift }) {
  const { mouth, setRiveActive, phase, paused, muted, audioUnavailable, start, replay, toggleMute, togglePause } = useExperience(gift);
  const [sendNotice, setSendNotice] = useState(false);
  const openButton = useRef<HTMLButtonElement>(null);
  const sendButton = useRef<HTMLButtonElement>(null);
  const active = phase !== 'idle' && phase !== 'cta';
  useEffect(() => {
    if (phase === 'idle') openButton.current?.focus();
    if (phase === 'cta') sendButton.current?.focus();
  }, [phase]);
  return <Stage phase={phase} paused={paused}>
    {(phase === 'idle' || phase === 'opening') && <section className="arrival" aria-hidden={phase === 'opening'}>
      <div className="gift-mark" aria-hidden="true">✧</div>
      <p className="eyebrow">A small gesture. A little magic.</p>
      <h1>{copy.arrival}</h1>
      <p className="intro-note">Take a moment. This one’s for you.</p>
      <button className="primary" ref={openButton} disabled={phase !== 'idle'} onClick={start}>Open it <span aria-hidden="true">↗</span></button>
      <p className="sound-note">Sound makes it sweeter. Quiet is lovely, too.</p>
    </section>}
    <BrunoCharacter character={gift.character} prop={gift.prop} phase={phase} paused={paused} mouth={mouth} onRendererChange={setRiveActive} />
    <div className="dialogue" role="status" aria-live="polite" aria-atomic="true">
      {caption(phase, gift) && <div key={phase} className="dialogue-line">
        <p className="eyebrow">{phase === 'message' ? `A little something from ${gift.senderName}` : gift.character.name}</p>
        <p className={phase === 'message' ? 'message' : ''}>{caption(phase, gift)}</p>
      </div>}
    </div>
    {active && <div className="playback-controls">
      <button onClick={togglePause} aria-label={paused ? 'Resume experience' : 'Pause experience'}>{paused ? 'Resume' : 'Pause'}</button>
      <span aria-hidden="true">·</span>
      <button onClick={toggleMute} aria-pressed={muted} disabled={audioUnavailable}>{audioUnavailable ? 'Playing quietly' : muted ? 'Sound off' : 'Sound on'}</button>
    </div>}
    {phase === 'cta' && <section className="ending">
      <p className="eyebrow">Little friend. Big feelings.</p>
      <h1>{copy.reveal} <span className="heart">❤️</span></h1>
      <p className="intro-note">A little magic is better when it’s shared.</p>
      <button className="primary" ref={sendButton} onClick={() => setSendNotice(true)}>Send Bruno to Someone <span aria-hidden="true">↗</span></button>
      <button className="replay" onClick={() => { setSendNotice(false); replay(); }}>Replay <span aria-hidden="true">↺</span></button>
      {sendNotice && <p className="send-notice" role="status">Bruno’s first little outing. Sending your own gift is coming next.</p>}
      <p className="brand">emoji friends<span>A little closer, from anywhere.</span></p>
    </section>}
    {active && <span className="sr-only">{phase.startsWith('knock') ? 'A soft tap on the glass.' : ''}</span>}
  </Stage>;
}
