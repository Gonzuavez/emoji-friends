import { useState } from 'react';
import type { Gift } from '../../config/gifts/brunoThinkingOfYou';
import type { Phase } from '../../experiences/BrunoThinkingOfYou/timeline';

/** Temporary monochrome stand-in. Replace this layer, not the experience. */
export function BrunoCharacter({ phase, character }: { phase: Phase; character: Gift['character'] }) {
  const [failed, setFailed] = useState(false);
  const visible = ['paw', 'peek', 'recognition', 'introduction', 'message', 'exit', 'depart'].includes(phase);
  return <div className={`character-layer ${visible ? 'is-visible' : ''}`} data-pose={phase} aria-hidden="true">
    <div className="character-aura" />
    <div className="glass-paw"><i /><i /><i /><i /><b /></div>
    <div className="bear">
      {character.image && !failed
        ? <img className="character-art" src={character.image} alt="" onError={() => setFailed(true)} />
        : <svg viewBox="0 0 320 360" className="placeholder" fill="none">
          <defs><linearGradient id="fur" x1="70" y1="20" x2="260" y2="360" gradientUnits="userSpaceOnUse"><stop stopColor="#95816a" /><stop offset="1" stopColor="#3c3932" /></linearGradient></defs>
          <ellipse cx="160" cy="303" rx="104" ry="105" fill="url(#fur)" />
          <circle cx="79" cy="88" r="38" fill="url(#fur)" /><circle cx="241" cy="88" r="38" fill="url(#fur)" />
          <circle cx="79" cy="88" r="22" fill="#242820" /><circle cx="241" cy="88" r="22" fill="#242820" />
          <ellipse cx="160" cy="161" rx="112" ry="108" fill="url(#fur)" />
          <ellipse cx="160" cy="203" rx="48" ry="35" fill="#b5a087" opacity=".4" />
          <ellipse cx="121" cy="157" rx="6" ry="8" fill="#161b17" /><ellipse cx="199" cy="157" rx="6" ry="8" fill="#161b17" />
          <path d="M150 191 Q160 184 170 191 Q169 202 160 204 Q151 202 150 191" fill="#161b17" />
          <path d="M144 214 Q160 227 176 214" stroke="#252b23" strokeWidth="4" strokeLinecap="round" />
          <ellipse className="waving-paw" cx="266" cy="269" rx="31" ry="53" fill="url(#fur)" />
        </svg>}
    </div>
    {!character.image || failed ? <span className="placeholder-label">Bruno · visual stand-in</span> : null}
  </div>;
}
