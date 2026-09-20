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
    audio.current.play(phase, gift);
    const timer = window.setTimeout(() => setIndex(value => value + 1), durationFor(index, gift));
    return () => { window.clearTimeout(timer); audio.current.stop(); };
  }, [index, phase, gift, paused]);

  useEffect(() => {
    const controller = audio.current;
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
    void audio.current.unlock().then(available => setAudioUnavailable(!available));
    setPaused(false);
    setIndex(0);
  }
  function replay() {
    audio.current.stop();
    setPaused(false);
    setIndex(-1);
  }
  function toggleMute() {
    audio.current.setMuted(!muted);
    setMuted(!muted);
  }
  return { phase, paused, muted, audioUnavailable, start, replay, toggleMute, togglePause: () => setPaused(value => !value) };
}
