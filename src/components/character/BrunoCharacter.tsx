import { useEffect, useRef, useState } from 'react';
import type { BrunoPose } from '../../config/characters/bruno';
import type { Gift } from '../../config/gifts/brunoThinkingOfYou';
import type { Phase } from '../../experiences/BrunoThinkingOfYou/timeline';

type DisplayFrame = {
  image: string;
  pose: Phase;
};

const POSE_BLEND_MS = 320;
const hiddenPhases = new Set<Phase>(['idle', 'opening', 'knock1', 'knock2', 'knock3', 'cta']);

function isVisiblePhase(phase: Phase) {
  return !hiddenPhases.has(phase);
}

/** Production asset adapter.
 * Motion Pass #1 keeps two standalone PNG layers only during a pose change:
 * the prior pose fades away while the next preloaded pose eases into place.
 * No sprite sheets, crops, or generated in-between artwork are used. */
export function BrunoCharacter({ phase, character, prop }: { phase: Phase; character: Gift['character']; prop: Gift['prop'] }) {
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(new Set());
  const [activeFrame, setActiveFrame] = useState<DisplayFrame | null>(
    () => character.image ? { image: character.image, pose: phase } : null,
  );
  const [outgoingFrame, setOutgoingFrame] = useState<DisplayFrame | null>(null);
  const transitionTimer = useRef<number | null>(null);

  const pose = phase as BrunoPose;
  const visible = isVisiblePhase(phase);
  const poseImage = character.poseImages?.[pose];
  // The base image is allowed outside the performance. A configured
  // performance pose never falls back to the old master/composite artwork.
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

  // Warm every Bruno pose while the opening/knock beats play. This keeps the
  // blend visual rather than exposing network/decode delays between poses.
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

  useEffect(() => () => {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
  }, []);

  // Commit a new pose only after its standalone PNG has decoded. For a real
  // pose-to-pose change, retain the prior image for a short crossfade window.
  useEffect(() => {
    if (!desiredImage) {
      setActiveFrame(null);
      setOutgoingFrame(null);
      return;
    }

    if (failedUrls.has(desiredImage)) {
      setActiveFrame(null);
      setOutgoingFrame(null);
      return;
    }

    let effectActive = true;

    const commit = () => {
      if (!effectActive) return;

      if (activeFrame?.image === desiredImage) {
        if (activeFrame.pose !== phase) {
          // Same artwork can represent more than one beat (for example turn /
          // depart). Re-key it by pose so that beat-specific motion restarts.
          setActiveFrame({ image: desiredImage, pose: phase });
        }
        return;
      }

      const canBlend = Boolean(activeFrame && visible && isVisiblePhase(activeFrame.pose));
      setOutgoingFrame(canBlend ? activeFrame : null);
      setActiveFrame({ image: desiredImage, pose: phase });

      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
      if (canBlend) {
        transitionTimer.current = window.setTimeout(() => {
          setOutgoingFrame(null);
          transitionTimer.current = null;
        }, POSE_BLEND_MS);
      }
    };

    if (loadedUrls.has(desiredImage)) {
      commit();
      return () => {
        effectActive = false;
      };
    }

    const preload = new Image();
    preload.onload = () => {
      if (!effectActive) return;
      markLoaded(desiredImage);
      commit();
    };
    preload.onerror = () => {
      if (!effectActive) return;
      markFailed(desiredImage);
      setActiveFrame(null);
      setOutgoingFrame(null);
    };
    preload.src = desiredImage;

    return () => {
      effectActive = false;
    };
  }, [desiredImage, phase, visible, activeFrame, loadedUrls, failedUrls]);

  const suppressBaseDuringPose = Boolean(
    visible && poseImage && activeFrame?.image === character.image,
  );
  const activeImage = activeFrame
    && !suppressBaseDuringPose
    && loadedUrls.has(activeFrame.image)
    && !failedUrls.has(activeFrame.image)
    ? activeFrame.image
    : undefined;
  const outgoingImage = outgoingFrame
    && loadedUrls.has(outgoingFrame.image)
    && !failedUrls.has(outgoingFrame.image)
    ? outgoingFrame.image
    : undefined;

  const targetFailed = !desiredImage || failedUrls.has(desiredImage);
  const hasProductionFrame = Boolean(activeImage || outgoingImage);
  const productionPending = Boolean(desiredImage && !targetFailed);
  const showFallback = targetFailed && !hasProductionFrame;
  const showProp = prop && prop.showDuring.includes(pose) && !failedUrls.has(prop.image);
  const onFailure = (url: string) => markFailed(url);

  return <div
    className={`character-layer ${visible ? 'is-visible' : ''}`}
    data-pose={phase}
    data-asset={hasProductionFrame || productionPending ? 'production' : 'fallback'}
    data-transitioning={outgoingImage ? 'true' : 'false'}
    aria-hidden="true"
  >
    <div className="character-aura" />
    <div className="glass-contact glass-contact-left" />
    <div className="glass-contact glass-contact-right" />
    <div className="glass-paw"><i /><i /><i /><i /><b /></div>
    <div className="bear">
      {outgoingImage && outgoingFrame && <img
        className="character-art character-art--outgoing"
        key={`outgoing:${outgoingFrame.image}:${outgoingFrame.pose}`}
        src={outgoingImage}
        data-image-pose={outgoingFrame.pose}
        alt=""
        onError={() => onFailure(outgoingImage)}
      />}
      {activeImage && activeFrame && <img
        className="character-art character-art--current"
        key={`current:${activeFrame.image}:${activeFrame.pose}`}
        src={activeImage}
        data-image-pose={activeFrame.pose}
        alt=""
        onError={() => onFailure(activeImage)}
      />}
      {showFallback && <svg viewBox="0 0 320 360" className="placeholder" fill="none">
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
    {showFallback ? <span className="placeholder-label">Bruno · visual stand-in</span> : null}
  </div>;
}
