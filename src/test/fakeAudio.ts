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
  load() {}
  play() { this.playCalls++; this.paused = false; this.dispatchEvent(new Event('playing')); return Promise.resolve(); }
  pause() { this.pauseCalls++; if (!this.paused) { this.paused = true; this.dispatchEvent(new Event('pause')); } }
  /** test helper: simulate playback reaching time t */
  tick(t: number) { this.currentTime = t; this.dispatchEvent(new Event('timeupdate')); }
}
