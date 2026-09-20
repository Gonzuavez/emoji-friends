import { useState } from 'react';
import type { BrunoPose } from '../../config/characters/bruno';
import type { Gift } from '../../config/gifts/brunoThinkingOfYou';
import type { Phase } from '../../experiences/BrunoThinkingOfYou/timeline';

/** Production asset adapter with the Work Order #001 fallback. Gift logic
 * only passes poses; a future approved Rive renderer belongs in this layer. */
export function BrunoCharacter({ phase, character, prop }: { phase: Phase; character: Gift['character']; prop: Gift['prop'] }) {
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(new Set());
  const pose = phase as BrunoPose;
  const visible = !['idle', 'opening', 'knock1', 'knock2', 'knock3', 'cta'].includes(phase);
  const poseImage = character.poseImages?.[pose];
  // Performance poses must never fall back to the old composite/master art.
  // If a dedicated pose is missing or fails, show the neutral SVG stand-in.
  const image = poseImage && !failedUrls.has(poseImage) ? poseImage : undefined;
  const failed = !image || failedUrls.has(image);
  const loaded = !!image && loadedUrls.has(image);
  const showProp = prop && prop.showDuring.includes(pose) && !failedUrls.has(prop.image);
  const onFailure = (url: string) => setFailedUrls(previous => new Set(previous).add(url));
  return <div className={`character-layer ${visible ? 'is-visible' : ''}`} data-pose={phase} data-asset={loaded && !failed ? 'production' : 'fallback'} aria-hidden="true">
    <div className="character-aura" />
    <div className="glass-contact glass-contact-left" />
    <div className="glass-contact glass-contact-right" />
    <div className="glass-paw"><i /><i /><i /><i /><b /></div>
    <div className="bear">
      {image && !failed && <img className={`character-art ${loaded ? 'is-loaded' : 'is-loading'}`} key={image} src={image} alt="" onLoad={() => setLoadedUrls(previous => new Set(previous).add(image))} onError={() => onFailure(image)} />}
      {(!loaded || failed) && <svg viewBox="0 0 320 360" className="placeholder" fill="none">
          <defs><linearGradient id="fur" x1="70" y1="20" x2="260" y2="360" gradientUnits="userSpaceOnUse"><stop stopColor="#95816a" /><stop offset="1" stopColor="#3c3932" /></linearGradient></defs>
          <ellipse cx="160" cy="303" rx="104" ry="105" fill="url(#fur)" />
          <circle cx="79" cy="88" r="38" fill="url(#fur)" /><circle cx="241" cy="88" r="38" fill="url(#fur)" />
          <circle cx="79" cy="88" r="22" fill="#242820" /><circle cx="241" cy="88" r="22" fill="#242820" />
          <ellipse cx="160" cy="161" rx="112" ry="108" fill="url(#fur)" />
          <ellipse cx="160" cy="203" rx="48" ry="35" fill="#b5a087" opacity=".4" />
          <ellipse cx="121" cy="157" rx="6" ry="8" fill="#161b17" /><ellipse className="wink-eye" cx="199" cy="157" rx="6" ry="8" fill="#161b17" />
          <path d="M150 191 Q160 184 170 191 Q169 202 160 204 Q151 202 150 191" fill="#161b17" />
          <path d="M144 214 Q160 227 176 214" stroke="#252b23" strokeWidth="4" strokeLinecap="round" />
          <ellipse className="waving-paw" cx="266" cy="269" rx="31" ry="53" fill="url(#fur)" />
        </svg>}
      {showProp && <img className="emotional-prop" src={prop.image} alt="" data-description={prop.description} onError={() => onFailure(prop.image)} />}
    </div>
    {!loaded || failed ? <span className="placeholder-label">Bruno · visual stand-in</span> : null}
  </div>;
}
