import { useCallback, useEffect, useRef, useState } from 'react';
import type { Song } from '../types';

export type PlayerStatus = 'idle' | 'loading' | 'buffering' | 'playing' | 'paused' | 'ended' | 'error' | 'unavailable';

/**
 * Single shared <audio> element. ALL visual state is derived from real media events and
 * audio.currentTime (read every animation frame while playing). There are no optimistic timers.
 * - 'loading'  : play() requested, no media data yet
 * - 'buffering': media fired waiting/stalled while it should be playing (reels stop)
 * - 'playing'  : the 'playing' event fired and time is advancing
 */
export function usePreviewPlayer(song: Song | null, capSeconds: number) {
  const cap = Math.min(30, capSeconds);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(cap);
  /** Incremented on every track switch so stale play() promises / events are ignored. */
  const gen = useRef(0);
  const wantPlay = useRef(false);

  if (audioRef.current === null && typeof Audio !== 'undefined') {
    const a = new Audio();
    a.preload = 'auto';
    audioRef.current = a;
    // Read-only handle for the e2e sync check (lets the test compare UI state with the real media clock).
    if (typeof window !== 'undefined') ((window as unknown as { __previewAudio?: HTMLAudioElement[] }).__previewAudio ??= []).push(a);
  }

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    let raf = 0;
    const stopAt = () => {
      wantPlay.current = false;
      a.pause();
      try { a.currentTime = cap; } catch { /* ignore */ }
      setTime(cap);
      setStatus('ended');
    };
    const sync = () => {
      const t = a.currentTime;
      if (t >= cap) { stopAt(); return true; }
      setTime(t);
      return false;
    };
    const loop = () => {
      raf = 0;
      if (a.paused) return;
      if (!sync()) raf = requestAnimationFrame(loop);
    };
    const startLoop = () => { if (!raf && typeof requestAnimationFrame !== 'undefined') raf = requestAnimationFrame(loop); };
    const stopLoop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };

    const onPlaying = () => { setStatus('playing'); sync(); startLoop(); };
    const onTime = () => { sync(); };
    const onPause = () => { stopLoop(); sync(); setStatus((s) => (s === 'ended' || s === 'error' || s === 'unavailable' ? s : 'paused')); };
    const onEnded = () => { stopLoop(); wantPlay.current = false; setTime(Math.min(cap, a.currentTime)); setStatus('ended'); };
    const onWaiting = () => { if (wantPlay.current && !a.paused) setStatus((s) => (s === 'playing' ? 'buffering' : s)); };
    const onError = () => { if (a.getAttribute('src')) { stopLoop(); wantPlay.current = false; setStatus('error'); } };
    const onMeta = () => { if (Number.isFinite(a.duration) && a.duration > 0) setDuration(Math.min(cap, a.duration)); };
    const onSeeked = () => { sync(); };
    const ev: [string, EventListener][] = [
      ['playing', onPlaying], ['timeupdate', onTime], ['pause', onPause], ['ended', onEnded],
      ['waiting', onWaiting], ['stalled', onWaiting], ['error', onError], ['loadedmetadata', onMeta], ['seeked', onSeeked],
    ];
    ev.forEach(([n, f]) => a.addEventListener(n, f));
    return () => { stopLoop(); ev.forEach(([n, f]) => a.removeEventListener(n, f)); };
  }, [cap]);

  // Switching song: stop + detach previous media, load the new one (preload, no autoplay).
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    gen.current++;
    wantPlay.current = false;
    a.pause();
    setTime(0);
    setDuration(cap);
    if (!song || !song.previewUrl) {
      a.removeAttribute('src');
      a.load?.();
      setStatus(song ? 'unavailable' : 'idle');
      return;
    }
    a.src = song.previewUrl;
    a.load?.(); // starts fetching now, so pressing play is near-instant
    try { a.currentTime = 0; } catch { /* ignore */ }
    setStatus('paused');
  }, [song, cap]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const play = useCallback(async () => {
    const a = audioRef.current;
    if (!a || !song?.previewUrl) return;
    const my = gen.current;
    if (a.currentTime >= cap - 0.05) { try { a.currentTime = 0; } catch { /* ignore */ } setTime(0); }
    wantPlay.current = true;
    setStatus((s) => (s === 'playing' ? s : 'loading'));
    try {
      await a.play();
      // Status becomes 'playing' only via the real 'playing' event.
    } catch (e) {
      if (my !== gen.current) return; // track switched meanwhile
      wantPlay.current = false;
      const name = (e as Error)?.name;
      if (name === 'AbortError') { setStatus('paused'); return; }
      if (name === 'NotAllowedError') { setStatus('paused'); return; }
      setStatus('error');
    }
  }, [song, cap]);

  const pause = useCallback(() => { wantPlay.current = false; audioRef.current?.pause(); }, []);

  const replay = useCallback(async () => {
    const a = audioRef.current;
    if (!a || !song?.previewUrl) return;
    a.pause();
    try { a.currentTime = 0; } catch { /* ignore */ }
    setTime(0);
    await play();
  }, [song, play]);

  return { status, time, duration, cap, play, pause, replay, audio: audioRef };
}
