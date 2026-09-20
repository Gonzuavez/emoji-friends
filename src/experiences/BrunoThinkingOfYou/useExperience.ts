import { useEffect, useRef, useState } from 'react';
import type { Gift } from '../../config/gifts/brunoThinkingOfYou';
import { ExperienceAudio } from '../../audio/ExperienceAudio';
import { durationFor, timeline, type Phase } from './timeline';

export function useExperience(gift: Gift) {
  const [index, setIndex] = useState(-1);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const audio = useRef(new ExperienceAudio());
  const phase: Phase = index < 0 ? 'idle' : index >= timeline.length ? 'cta' : timeline[index].id;

  useEffect(() => {
    if (index < 0 || index >= timeline.length || paused) return;
    let cancelled = false;
    let timer: number;
    const readingTime = new Promise<void>(resolve => { timer = window.setTimeout(resolve, durationFor(index, gift)); });
    // The beat finishes only after both readable captions and actual speech.
    void Promise.all([readingTime, audio.current.play(phase, gift)]).then(() => {
      if (!cancelled) setIndex(value => value + 1);
    });
    return () => { cancelled = true; window.clearTimeout(timer); audio.current.stop(); };
  }, [index, phase, gift, paused]);

  useEffect(() => {
    const controller = audio.current;
    controller.onInterrupted = () => setPaused(true);
    return () => controller.dispose();
  }, []);

  // Do not let background timer throttling swallow the message. Returning to
  // the tab resumes the current beat from its beginning.
  useEffect(() => {
    const onVisibility = () => { if (document.hidden) setPaused(true); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  function start() {
    void audio.current.unlock().then(available => {
      setAudioUnavailable(!available);
      if (available) audio.current.preload(gift);
    });
    setPaused(false);
    setIndex(0);
  }
  function replay() {
    audio.current.reset();
    setPaused(false);
    setIndex(-1);
  }
  function toggleMute() {
    audio.current.setMuted(!muted);
    setMuted(!muted);
  }
  function togglePause() {
    if (paused) {
      void audio.current.unlock().then(available => { setAudioUnavailable(!available); setPaused(false); });
    } else setPaused(true);
  }
  return { phase, paused, muted, audioUnavailable, start, replay, toggleMute, togglePause };
}
