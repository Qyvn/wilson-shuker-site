/** Minimal controllable stand-in for HTMLAudioElement used in jsdom tests. */
export class FakeAudio extends EventTarget {
  static instances: FakeAudio[] = [];
  paused = true;
  currentTime = 0;
  duration = NaN;
  preload = '';
  private _src = '';
  playCalls = 0;
  pauseCalls = 0;
  constructor() { super(); FakeAudio.instances.push(this); }
  get src() { return this._src; }
  set src(v: string) { this._src = v; }
  getAttribute(n: string) { return n === 'src' && this._src ? this._src : null; }
  removeAttribute(n: string) { if (n === 'src') this._src = ''; }
  load() { this.loadCalls++; }
  loadCalls = 0;
  /** test hooks: 'ok' fires playing immediately; 'pending' waits for resolvePlay(); or reject with an error name */
  playMode: 'ok' | 'pending' | 'NotAllowedError' | 'AbortError' | 'NotSupportedError' = 'ok';
  private pending: (() => void) | null = null;
  play() {
    this.playCalls++;
    if (this.playMode === 'ok') { this.paused = false; this.dispatchEvent(new Event('playing')); return Promise.resolve(); }
    if (this.playMode === 'pending') { this.paused = false; return new Promise<void>((r) => { this.pending = () => { this.dispatchEvent(new Event('playing')); r(); }; }); }
    const err = new Error(this.playMode); err.name = this.playMode; return Promise.reject(err);
  }
  resolvePlay() { this.pending?.(); this.pending = null; }
  listenerCount = 0;
  addEventListener(...a: Parameters<EventTarget['addEventListener']>) { this.listenerCount++; super.addEventListener(...a); }
  removeEventListener(...a: Parameters<EventTarget['removeEventListener']>) { this.listenerCount--; super.removeEventListener(...a); }
  pause() { this.pauseCalls++; if (!this.paused) { this.paused = true; this.dispatchEvent(new Event('pause')); } }
  /** test helper: simulate playback reaching time t */
  tick(t: number) { this.currentTime = t; this.dispatchEvent(new Event('timeupdate')); }
}
