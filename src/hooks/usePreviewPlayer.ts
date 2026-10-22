import { useCallback, useEffect, useRef, useState } from 'react';
import type { Song } from '../types';

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error' | 'unavailable';

/**
 * Single shared <audio> element. State is driven ONLY by real media events,
 * so the UI never claims playback that is not happening.
 */
export function usePreviewPlayer(song: Song | null, capSeconds: number) {
  const cap = Math.min(30, capSeconds);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(cap);

  if (audioRef.current === null && typeof Audio !== 'undefined') {
    const a = new Audio();
    a.preload = 'none';
    audioRef.current = a;
  }

  // Wire media events once.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const enforceCap = () => {
      if (a.currentTime >= cap) {
        a.pause();
        try { a.currentTime = cap; } catch { /* ignore */ }
        setTime(cap);
        setStatus('ended');
        return true;
      }
      return false;
    };
    const onTime = () => { if (!enforceCap()) setTime(a.currentTime); };
    const onPlaying = () => setStatus('playing');
    const onPause = () => setStatus((s) => (s === 'ended' || s === 'error' || s === 'unavailable' ? s : 'paused'));
    const onEnded = () => { setStatus('ended'); };
    const onWaiting = () => setStatus((s) => (s === 'playing' ? 'loading' : s));
    const onError = () => { if (a.getAttribute('src')) setStatus('error'); };
    const onMeta = () => { if (Number.isFinite(a.duration) && a.duration > 0) setDuration(Math.min(cap, a.duration)); };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('playing', onPlaying);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);
    a.addEventListener('waiting', onWaiting);
    a.addEventListener('error', onError);
    a.addEventListener('loadedmetadata', onMeta);
    // Safety net: timeupdate fires ~4x/s; also poll while playing for a tighter cap.
    const iv = window.setInterval(() => { if (!a.paused) enforceCap(); }, 100);
    return () => {
      window.clearInterval(iv);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('playing', onPlaying);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('waiting', onWaiting);
      a.removeEventListener('error', onError);
      a.removeEventListener('loadedmetadata', onMeta);
    };
  }, [cap]);

  // Switching song: stop previous, load new source, never autoplay.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    setTime(0);
    setDuration(cap);
    if (!song) { a.removeAttribute('src'); setStatus('idle'); return; }
    if (!song.previewUrl) { a.removeAttribute('src'); a.load?.(); setStatus('unavailable'); return; }
    a.src = song.previewUrl;
    try { a.currentTime = 0; } catch { /* ignore */ }
    setStatus('paused');
  }, [song, cap]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const play = useCallback(async () => {
    const a = audioRef.current;
    if (!a || !song?.previewUrl) return;
    if (a.currentTime >= cap) { try { a.currentTime = 0; } catch { /* ignore */ } setTime(0); }
    setStatus('loading');
    try {
      await a.play();
      // 'playing' event will set status; some browsers fire it before resolve.
      if (!a.paused) setStatus('playing');
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setStatus('error');
    }
  }, [song, cap]);

  const pause = useCallback(() => { audioRef.current?.pause(); }, []);

  const replay = useCallback(async () => {
    const a = audioRef.current;
    if (!a || !song?.previewUrl) return;
    a.pause();
    try { a.currentTime = 0; } catch { /* ignore */ }
    setTime(0);
    setStatus('paused');
    await play();
  }, [song, play]);

  return { status, time, duration, cap, play, pause, replay, audio: audioRef };
}
