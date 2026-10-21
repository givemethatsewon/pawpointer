import { useCallback, useEffect, useRef, useState } from 'react';
import { clamp, denormalize, normalize, remember, selectPhoto, type GalleryPhoto, type Point, type Size } from './geometry';
import { loadCatPhoto } from './images';

export const STILLNESS_MS = 1200;
export type Phase = 'waiting' | 'tracking' | 'loading' | 'ready' | 'error';
export type Shot = { photo: GalleryPhoto; source: string; target: Point; sequence: number };
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

  const cancel = useCallback(() => {
    clearTimeout(timer.current); clearTimeout(warmTimer.current);
    controller.current.abort(); controller.current = new AbortController();
    generation.current++;
  }, []);
  const reveal = useCallback(async (point: Point, chosen?: GalleryPhoto, request = generation.current) => {
    const signal = controller.current.signal;
    setPhase('loading');
    let candidate = chosen ?? selectPhoto(photos, normalize(point, size.current), recent.current, failed.current);
    // Bounded fallback: a missing image never leaves the visitor stuck loading.
    while (candidate) {
      try {
        const source = await loadCatPhoto(candidate, signal);
        if (!alive.current || request !== generation.current || pausedRef.current) return;
        recent.current = remember(recent.current, candidate.id);
        setShot({ photo: candidate, source, target: point, sequence: ++sequence.current });
        setSeen(values => values.includes(candidate!.id) ? values : [...values, candidate!.id]);
        setPhase('ready');
        return;
      } catch {
        if (!alive.current || request !== generation.current || pausedRef.current) return;
        failed.current.add(candidate.id);
        candidate = selectPhoto(photos, normalize(point, size.current), recent.current, failed.current);
      }
    }
    if (alive.current && request === generation.current) setPhase('error');
  }, [photos]);

  const move = useCallback((point: Point, immediate = false) => {
    if (pausedRef.current) return;
    cancel();
    started.current = true;
    position.current = point;
    setTarget(point);
    setActivity(n => n + 1);
    const request = generation.current;
    if (immediate) { void reveal(point, undefined, request); return; }
    setPhase('tracking');
    // Download only the intended candidate after a short quiet window, overlapping
    // the existing stillness delay. A new input aborts this work immediately.
    warmTimer.current = window.setTimeout(() => {
      const candidate = selectPhoto(photos, normalize(point, size.current), recent.current, failed.current);
      if (candidate) void loadCatPhoto(candidate, controller.current.signal).catch(() => undefined);
    }, 150);
    timer.current = window.setTimeout(() => { void reveal(point, undefined, request); }, STILLNESS_MS);
  }, [cancel, reveal, photos]);

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
      if (e.pointerType !== 'mouse') { setTouch(true); move({ x: e.clientX, y: e.clientY }, true); }
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
