import { useCallback, useEffect, useRef, useState } from 'react';
import { clamp, denormalize, normalize, remember, selectPhoto, type GalleryPhoto, type Point, type Size } from './geometry';
import { loadCatPhoto, loadPhoto } from './images';

export const STILLNESS_MS = 1200;
export type Phase = 'waiting' | 'tracking' | 'loading' | 'ready' | 'error';
export type Shot = { photo: GalleryPhoto; source: string; target: Point; sequence: number; quality: 'preview' | 'full' };
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
  const resolved = useRef<Prepared>(null);
  const selected = useRef<GalleryPhoto | undefined>(undefined);
  const warmTimer = useRef<number | undefined>(undefined);
  const controller = useRef(new AbortController());
  const position = useRef(target);
  const size = useRef(viewport);
  const recent = useRef<string[]>([]);
  const failed = useRef(new Set<string>());
  const sequence = useRef(0);
  const pausedRef = useRef(paused);
  const alive = useRef(true);
  const pending = useRef(false);
  const anchor = useRef(target);

  const cancel = useCallback(() => {
    clearTimeout(timer.current); clearTimeout(warmTimer.current);
    controller.current.abort(); controller.current = new AbortController();
    generation.current++;
    prepared.current = null; resolved.current = null; selected.current = undefined;
    pending.current = false;
  }, []);
  // Share the entire preparation (including fallback) between warm-up and reveal.
  const prepare = useCallback(async (point: Point, chosen?: GalleryPhoto, request = generation.current): Promise<Prepared> => {
    const signal = controller.current.signal;
    let candidate = chosen ?? selectPhoto(photos, normalize(point, size.current), recent.current, failed.current);
    while (candidate && !signal.aborted) {
      selected.current = candidate;
      if (candidate.preview) void loadPhoto(candidate.preview, signal).catch(() => undefined);
      try {
        const source = await loadCatPhoto(candidate, signal);
        if (!alive.current || request !== generation.current || pausedRef.current) return null;
        return resolved.current = { photo: candidate, source };
      } catch {
        if (!alive.current || request !== generation.current || pausedRef.current) return null;
        // A failed CDN upgrade must never discard a usable local preview.
        if (candidate.preview) return resolved.current = { photo: candidate, source: candidate.preview };
        failed.current.add(candidate.id);
        candidate = selectPhoto(photos, normalize(point, size.current), recent.current, failed.current);
      }
    }
    return null;
  }, [photos]);

  const reveal = useCallback(async (point: Point, chosen?: GalleryPhoto, request = generation.current) => {
    const work = prepared.current ??= prepare(point, chosen, request);
    const immediate = resolved.current;
    const candidate = selected.current;
    const show = (result: NonNullable<Prepared>, quality: Shot['quality']) => {
      recent.current = remember(recent.current, result.photo.id);
      pending.current = false;
      setShot({ ...result, target: position.current, sequence: ++sequence.current, quality });
      setSeen(values => values.includes(result.photo.id) ? values : [...values, result.photo.id]);
      setPhase('ready');
    };
    if (immediate) { show(immediate, immediate.source.startsWith('data:') ? 'preview' : 'full'); return; }
    // The embedded preview cannot be held hostage by a cold CDN or lost request.
    const preview = candidate?.preview;
    if (candidate && preview) show({ photo: candidate, source: preview }, 'preview');
    else setPhase('loading');
    const result = await work;
    if (!alive.current || request !== generation.current || pausedRef.current) return;
    if (!result) { pending.current = false; setPhase('error'); return; }
    if (preview) {
      // Upgrade pixels in place; do not replay the entrance or move the paw.
      setShot(current => current ? { ...current, ...result, quality: result.source.startsWith('data:') ? 'preview' : 'full' } : current);
      recent.current = remember(recent.current, result.photo.id);
    } else show(result, result.source.startsWith('data:') ? 'preview' : 'full');
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
    let activeTouch: number | null = null;
    const pointerMove = (e: PointerEvent) => {
      if (overControl(e) || (e.pointerType === 'touch' && e.pointerId !== activeTouch)) return;
      setTouch(e.pointerType !== 'mouse');
      move({ x: e.clientX, y: e.clientY });
    };
    const pointerDown = (e: PointerEvent) => {
      if (overControl(e)) return;
      // Touch uses the same visible dwell as the mouse, including after finger-up.
      if (e.isPrimary && e.pointerType !== 'mouse') {
        activeTouch = e.pointerId;
        if (e.target instanceof Element) e.target.setPointerCapture(e.pointerId);
        setTouch(true); move({ x: e.clientX, y: e.clientY }, true);
      }
    };
    const pointerUp = (e: PointerEvent) => { if (e.pointerId === activeTouch) activeTouch = null; };
    const resize = () => {
      const measured = measure();
      if (measured.width === size.current.width && measured.height === size.current.height) return;
      // Mobile browser chrome can resize the viewport while a finger is down.
      // Reposition the existing shot without restarting dwell or its download.
      const previous = size.current;
      const next = measure(), normalized = normalize(position.current, previous);
      position.current = denormalize(normalized, next);
      size.current = next; setViewport(next); setTarget(position.current);
      setShot(current => current ? { ...current, target: denormalize(normalize(current.target, previous), next) } : current);
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
    window.addEventListener('pointerup', pointerUp);
    window.addEventListener('pointercancel', pointerUp);
    window.addEventListener('keydown', keydown);
    window.addEventListener('resize', resize);
    document.documentElement.addEventListener('pointerleave', leave);
    // Stay black until the visitor moves, taps, or uses the keyboard.
    cancel();
    return () => {
      alive.current = false; cancel();
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerdown', pointerDown);
      window.removeEventListener('pointerup', pointerUp);
      window.removeEventListener('pointercancel', pointerUp);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('resize', resize);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
    // viewport is read through size.current to avoid rebuilding input listeners on resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [move, another, cancel, reveal]);

  return { viewport, target, phase, shot, seen, touch, activity, another, choose };
}
