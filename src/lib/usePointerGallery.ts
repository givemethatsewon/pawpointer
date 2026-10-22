import { useCallback, useEffect, useRef, useState } from 'react';
import { clamp, denormalize, normalize, remember, selectPhoto, type GalleryPhoto, type Point, type Size } from './geometry';
import { loadCatPhoto } from './images';

export const STILLNESS_MS = 1200;
export type Phase = 'waiting' | 'tracking' | 'loading' | 'ready' | 'error';
export type Shot = { photo: GalleryPhoto; source: string; target: Point; sequence: number };
type Prepared = { photo: GalleryPhoto; source: string } | null;
const measure = (): Size => ({ width: window.innerWidth, height: window.innerHeight });

export function usePointerGallery(photos: GalleryPhoto[], paused: boolean) {
  const [viewport, setViewport] = useState(measure);
  const [target, setTarget] = useState<Point>(() => ({ x: innerWidth / 2, y: innerHeight / 2 }));
  const [phase, setPhase] = useState<Phase>('waiting');
  const [shot, setShot] = useState<Shot | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [touch, setTouch] = useState(() => matchMedia('(pointer: coarse)').matches);
  const [activity, setActivity] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const generation = useRef(0);
  const prepared = useRef<Promise<Prepared> | null>(null);
  const warmTimer = useRef<number | undefined>(undefined);
  const controller = useRef(new AbortController());
  const position = useRef(target);
  const size = useRef(viewport);
  const recent = useRef<string[]>([]);
  const failed = useRef(new Set<string>());
  const sequence = useRef(0);
  const pausedRef = useRef(paused);
  const alive = useRef(true);
  const started = useRef(false);
  const pending = useRef(false);
  const anchor = useRef(target);

  const cancel = useCallback(() => {
    clearTimeout(timer.current); clearTimeout(warmTimer.current);
    controller.current.abort(); controller.current = new AbortController();
    generation.current++;
    prepared.current = null;
    pending.current = false;
  }, []);
  // Share the entire preparation (including fallback) between warm-up and reveal.
  const prepare = useCallback(async (point: Point, chosen?: GalleryPhoto, request = generation.current): Promise<Prepared> => {
    const signal = controller.current.signal;
    let candidate = chosen ?? selectPhoto(photos, normalize(point, size.current), recent.current, failed.current);
    while (candidate && !signal.aborted) {
      try {
        const source = await loadCatPhoto(candidate, signal);
        if (!alive.current || request !== generation.current || pausedRef.current) return null;
        return { photo: candidate, source };
      } catch {
        if (!alive.current || request !== generation.current || pausedRef.current) return null;
        failed.current.add(candidate.id);
        candidate = selectPhoto(photos, normalize(point, size.current), recent.current, failed.current);
      }
    }
    return null;
  }, [photos]);

  const reveal = useCallback(async (point: Point, chosen?: GalleryPhoto, request = generation.current) => {
    setPhase('loading');
    const result = await (prepared.current ??= prepare(point, chosen, request));
    if (!alive.current || request !== generation.current || pausedRef.current) return;
    pending.current = false;
    if (!result) { setPhase('error'); return; }
    recent.current = remember(recent.current, result.photo.id);
    setShot({ ...result, target: position.current, sequence: ++sequence.current });
    setSeen(values => values.includes(result.photo.id) ? values : [...values, result.photo.id]);
    setPhase('ready');
  }, [prepare]);

  const move = useCallback((point: Point, touchInput = false) => {
    if (pausedRef.current) return;
    // Keep a single transition alive through small hand tremors. Compare against
    // the fixed anchor, so a slow deliberate drag still restarts the dwell.
    if (pending.current && Math.hypot(point.x-anchor.current.x, point.y-anchor.current.y) <= 6) {
      position.current = point; setTarget(point); return;
    }
    cancel();
    pending.current = true; anchor.current = point;
    started.current = true;
    position.current = point;
    setTarget(point);
    setActivity(n => n + 1);
    const request = generation.current;
    setPhase('tracking');
    // A tap is a definite target: use the full dwell to fetch and decode it.
    // Mouse movement keeps a short debounce to avoid downloading on every pixel.
    const warm = () => { prepared.current = prepare(point, undefined, request); };
    if (touchInput) warm();
    else warmTimer.current = window.setTimeout(warm, 150);
    timer.current = window.setTimeout(() => { void reveal(point, undefined, request); }, STILLNESS_MS);
  }, [cancel, reveal, prepare]);

  const another = useCallback(() => {
    if (pausedRef.current) return;
    cancel();
    started.current = true;
    failed.current.clear();
    void reveal(position.current);
  }, [cancel, reveal]);

  const choose = useCallback((photo: GalleryPhoto) => {
    // Selection closes the native dialog before starting this transition.
    pausedRef.current = false;
    cancel();
    void reveal(position.current, photo);
  }, [cancel, reveal]);

  useEffect(() => {
    pausedRef.current = paused;
    if (paused) { cancel(); return; }
    // Preserve the current result when leaving a dialog; no unexpected reshuffle.
    setPhase(current => current === 'tracking' || current === 'loading' ? 'waiting' : current);
  }, [paused, cancel]);

  useEffect(() => {
    alive.current = true;
    const overControl = (e: Event) => e.target instanceof Element && Boolean(e.target.closest('[data-ui]'));
    const pointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || overControl(e)) return;
      setTouch(false);
      move({ x: e.clientX, y: e.clientY });
    };
    const pointerDown = (e: PointerEvent) => {
      if (overControl(e)) return;
      // Touch uses the same visible dwell as the mouse, including after finger-up.
      if (e.isPrimary && e.pointerType !== 'mouse') { setTouch(true); move({ x: e.clientX, y: e.clientY }, true); }
    };
    const resize = () => {
      cancel();
      const previous = size.current;
      const next = measure(), normalized = normalize(position.current, previous);
      position.current = denormalize(normalized, next);
      size.current = next; setViewport(next); setTarget(position.current);
      setShot(current => current ? { ...current, target: denormalize(normalize(current.target, previous), next) } : current);
      if (!pausedRef.current && started.current) move(position.current);
    };
    const keydown = (e: KeyboardEvent) => {
      if (pausedRef.current || overControl(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === 'Space') { e.preventDefault(); another(); }
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 80 : 30;
        move({ x: clamp(position.current.x + (e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0), 8, size.current.width - 8), y: clamp(position.current.y + (e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0), 8, size.current.height - 8) });
      }
    };
    const leave = (event: PointerEvent) => {
      // Touch emits pointerleave after finger-up; that must NOT cancel its pending photo.
      if (event.pointerType === 'touch' || pausedRef.current) return;
      cancel(); setPhase(current => current === 'ready' ? current : 'waiting');
    };
    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('pointerdown', pointerDown);
    window.addEventListener('keydown', keydown);
    window.addEventListener('resize', resize);
    document.documentElement.addEventListener('pointerleave', leave);
    // Stay black until the visitor moves, taps, or uses the keyboard.
    cancel();
    return () => {
      alive.current = false; cancel();
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerdown', pointerDown);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('resize', resize);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
    // viewport is read through size.current to avoid rebuilding input listeners on resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [move, another, cancel, reveal]);

  return { viewport, target, phase, shot, seen, touch, activity, another, choose };
}
