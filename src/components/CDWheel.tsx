import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { Song } from '../types';

interface Props {
  songs: Song[];
  selectedId: string | null;
  onSelect: (song: Song, discEl: HTMLElement | null) => void;
  reducedMotion: boolean;
}

const DRAG_DEG_PER_PX = 0.35;

export function CDWheel({ songs, selectedId, onSelect, reducedMotion }: Props) {
  const n = songs.length;
  const step = 360 / n;
  const [rotation, setRotation] = useState(0); // degrees
  const [front, setFront] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [radius, setRadius] = useState(300);
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ x: 0, startRot: 0, moved: false, id: -1 });
  const discRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Responsive radius based on stage width.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth || 800;
      const disc = Math.min(200, Math.max(120, w * 0.3));
      el.style.setProperty('--disc', `${disc}px`);
      setRadius(Math.max(disc * 0.9, Math.min(340, w * 0.36)));
    };
    update();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);

  const indexAt = (rot: number) => ((Math.round(-rot / step) % n) + n) % n;

  const rotateTo = (index: number) => {
    // shortest path from current rotation
    const target = -index * step;
    let delta = (target - rotation) % 360;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    setRotation(rotation + delta);
    setFront(index);
  };

  // When selection changes externally, bring it to the front.
  useEffect(() => {
    const i = songs.findIndex((s) => s.id === selectedId);
    if (i >= 0 && i !== indexAt(rotation)) rotateTo(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    drag.current = { x: e.clientX, startRot: rotation, moved: false, id: e.pointerId };
  };
  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      setDragging(true);
      try { stageRef.current?.setPointerCapture?.(e.pointerId); } catch { /* synthetic or already-released pointer */ }
    }
    if (d.moved) setRotation(d.startRot + dx * DRAG_DEG_PER_PX);
  };
  const endDrag = (e: PointerEvent) => {
    const d = drag.current;
    if (d.id !== e.pointerId) return;
    d.id = -1;
    if (d.moved) {
      const i = indexAt(rotation);
      setRotation(-Math.round(-rotation / step) * step);
      setFront(i);
      setDragging(false);
      // keep `moved` true until the click event fires so it gets suppressed
      setTimeout(() => (drag.current.moved = false), 0);
    }
  };

  const go = (dir: 1 | -1) => {
    const i = (front + dir + n) % n;
    rotateTo(i);
    discRefs.current[i]?.focus({ preventScroll: true });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(-1); }
    else if (e.key === 'Home') { e.preventDefault(); rotateTo(0); discRefs.current[0]?.focus(); }
    else if (e.key === 'End') { e.preventDefault(); rotateTo(n - 1); discRefs.current[n - 1]?.focus(); }
  };

  return (
    <div className="wheel">
      <div
        ref={stageRef}
        className={`wheel-stage${dragging ? ' is-dragging' : ''}${reducedMotion ? ' reduced' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        data-testid="wheel-stage"
      >
        <div
          className="wheel-ring"
          role="group"
          aria-roledescription="3D CD wheel"
          aria-label="Song collection. Use arrow keys to rotate, Enter to select."
          onKeyDown={onKeyDown}
          data-rotation={rotation.toFixed(1)}
          style={{ transform: `translateZ(${-radius}px) rotateY(${rotation}deg)` }}
        >
          {songs.map((s, i) => {
            const selected = s.id === selectedId;
            const angle = i * step;
            // how far from facing the viewer (0 = front)
            const rel = ((((angle + rotation) % 360) + 540) % 360) - 180;
            const facing = Math.abs(rel) < step / 2;
            return (
              <button
                key={s.id}
                ref={(el) => { discRefs.current[i] = el; }}
                type="button"
                className={`disc-slot${s.kind && s.kind !== 'song' ? ` disc-${s.kind}` : ''}${s.locked ? ' is-locked' : ''}${selected ? ' is-selected' : ''}${facing ? ' is-front' : ''}${Math.abs(rel) > 90 ? ' is-back' : ''}`}
                style={{
                  transform: `rotateY(${angle}deg) translateZ(${radius + (selected ? 40 : 0)}px)`,
                  opacity: Math.abs(rel) > 100 ? 0.55 : 1,
                }}
                tabIndex={i === front ? 0 : -1}
                aria-pressed={selected}
                aria-label={`${s.title}${s.kind === 'vault' ? (s.locked ? ' (locked vault disc)' : ' (vault disc, unlocked)') : ''}${s.kind === 'tour' ? ' (tour dates disc)' : ''}${selected ? ' (selected)' : ''}`}
                onFocus={() => i !== front && rotateTo(i)}
                onClick={(e) => {
                  if (drag.current.moved) { e.preventDefault(); return; }
                  rotateTo(i);
                  onSelect(s, e.currentTarget.querySelector('.disc'));
                }}
              >
                <span className="disc" aria-hidden="true">
                  <span className="disc-art" style={{ backgroundImage: `url(${s.artwork})` }} />
                  <span className="disc-sheen" />
                  <span className="disc-hub" />
                  {s.locked && <span className="disc-lock">LOCKED</span>}
                  {s.kind === 'tour' && <span className="disc-tour-label">TOUR</span>}
                </span>
                <span className="disc-shadow" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>
      <div className="wheel-controls">
        <button type="button" className="btn btn-round" onClick={() => go(-1)} aria-label="Rotate to previous CD">‹</button>
        <p className="wheel-caption" aria-live="polite">
          <span className="muted small">Facing:</span> <strong>{songs[front]?.title}</strong>
        </p>
        <button type="button" className="btn btn-round" onClick={() => go(1)} aria-label="Rotate to next CD">›</button>
      </div>
      <button
        type="button"
        className="btn btn-primary select-front"
        onClick={() => onSelect(songs[front], discRefs.current[front]?.querySelector('.disc') ?? null)}
      >
        {songs[front]?.id === selectedId ? 'Selected' : `Load “${songs[front]?.title}” into the player`}
      </button>
      <p className="muted small hint">Drag or swipe to spin · tap a CD to load it · arrow keys work too</p>
    </div>
  );
}
