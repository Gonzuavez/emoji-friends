import { useEffect, useState } from 'react';
import type { BrunoPose } from '../../config/characters/bruno';
import type { Gift } from '../../config/gifts/brunoThinkingOfYou';
import type { Phase } from '../../experiences/BrunoThinkingOfYou/timeline';

/** Production asset adapter. Each performance beat selects exactly one
 * standalone Bruno PNG; pose files are preloaded so swaps do not flash blank. */
export function BrunoPngCharacter({ phase, character, prop }: { phase: Phase; character: Gift['character']; prop: Gift['prop'] }) {
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(new Set());
  const [displayImage, setDisplayImage] = useState<string | undefined>(character.image);

  const pose = phase as BrunoPose;
  const visible = !['idle', 'opening', 'knock1', 'knock2', 'knock3', 'cta'].includes(phase);
  const poseImage = character.poseImages?.[pose];
  // The base image is allowed only outside a configured performance pose.
  // A missing/broken performance pose never falls back to the old master art.
  const desiredImage = poseImage ?? character.image;

  const markLoaded = (url: string) => setLoadedUrls(previous => {
    if (previous.has(url)) return previous;
    const next = new Set(previous);
    next.add(url);
    return next;
  });
  const markFailed = (url: string) => setFailedUrls(previous => {
    if (previous.has(url)) return previous;
    const next = new Set(previous);
    next.add(url);
    return next;
  });

  // Warm the browser cache as soon as the gift page mounts. The opening/knock
  // beats give the clean pose pack time to decode before Bruno becomes visible.
  useEffect(() => {
    const urls = [
      character.image,
      ...Object.values(character.poseImages ?? {}),
    ].filter((url): url is string => Boolean(url));
    const uniqueUrls = [...new Set(urls)];
    let active = true;

    for (const url of uniqueUrls) {
      const preload = new Image();
      preload.onload = () => {
        if (active) markLoaded(url);
      };
      preload.onerror = () => {
        if (active) markFailed(url);
      };
      preload.src = url;
    }

    return () => {
      active = false;
    };
  }, [character.image, character.poseImages]);

  // Never clear the currently visible pose while the next PNG is decoding.
  // Once ready, swap the single <img> source atomically.
  useEffect(() => {
    if (!desiredImage) {
      setDisplayImage(undefined);
      return;
    }
    if (failedUrls.has(desiredImage)) {
      if (poseImage) setDisplayImage(undefined);
      return;
    }
    if (loadedUrls.has(desiredImage)) {
      setDisplayImage(desiredImage);
      return;
    }

    let active = true;
    const preload = new Image();
    preload.onload = () => {
      if (!active) return;
      markLoaded(desiredImage);
      setDisplayImage(desiredImage);
    };
    preload.onerror = () => {
      if (!active) return;
      markFailed(desiredImage);
      if (poseImage) setDisplayImage(undefined);
    };
    preload.src = desiredImage;
    return () => {
      active = false;
    };
  }, [desiredImage, poseImage, loadedUrls, failedUrls]);

  const image = displayImage && !failedUrls.has(displayImage) ? displayImage : undefined;
  const failed = !image || failedUrls.has(image);
  const loaded = !!image && loadedUrls.has(image);
  const showProp = prop && prop.showDuring.includes(pose) && !failedUrls.has(prop.image);
  const onFailure = (url: string) => markFailed(url);

  return <div className={`character-layer ${visible ? 'is-visible' : ''}`} data-pose={phase} data-asset={loaded && !failed ? 'production' : 'fallback'} aria-hidden="true">
    <div className="character-aura" />
    <div className="glass-contact glass-contact-left" />
    <div className="glass-contact glass-contact-right" />
    <div className="glass-paw"><i /><i /><i /><i /><b /></div>
    <div className="bear">
      {image && !failed && <img className={`character-art ${loaded ? 'is-loaded' : 'is-loading'}`} key={image} src={image} alt="" onLoad={() => markLoaded(image)} onError={() => onFailure(image)} />}
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
