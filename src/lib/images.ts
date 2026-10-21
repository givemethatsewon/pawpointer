import type { GalleryPhoto } from './geometry';

// Keep a small decoded working set, not every image visited during a long session.
const MAX_READY = 6;
type Entry = { image: HTMLImageElement; promise: Promise<void>; settled: boolean };
const ready = new Map<string, Entry>();
export function asset(path: string) { return `${import.meta.env.BASE_URL}${path}`; }

export function loadPhoto(path: string, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(new DOMException('Superseded', 'AbortError'));
  const cached = ready.get(path);
  if (cached) {
    ready.delete(path); ready.set(path, cached);
    return cached.promise;
  }
  const image = new Image();
  image.decoding = 'async';
  image.fetchPriority = 'high';
  const entry: Entry = { image, settled: false, promise: Promise.resolve() };
  entry.promise = new Promise<void>((resolve, reject) => {
    let finished = false;
    const clean = () => {
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      image.onload = null; image.onerror = null;
    };
    const fail = (error: Error) => {
      if (finished) return;
      finished = true; clean();
      if (ready.get(path) === entry) ready.delete(path);
      image.removeAttribute('src');
      reject(error);
    };
    const abort = () => fail(new DOMException('Superseded', 'AbortError'));
    const timer = window.setTimeout(() => fail(new Error('Image timed out')), 12000);
    signal?.addEventListener('abort', abort, { once: true });
    image.onload = async () => {
      try {
        await image.decode();
        if (finished || signal?.aborted) return;
        finished = true; clean(); entry.settled = true;
        const decoded = [...ready.entries()].filter(([, value]) => value.settled);
        for (const [key] of decoded.slice(0, Math.max(0, decoded.length - MAX_READY))) ready.delete(key);
        resolve();
      } catch { fail(new Error('Image could not be decoded')); }
    };
    image.onerror = () => fail(new Error('Image unavailable'));
    image.src = asset(path);
  });
  ready.set(path, entry);
  return entry.promise;
}

let avifSupport: Promise<boolean> | undefined;
function supportsAvif() {
  return avifSupport ??= (async () => {
    const probe = new Image();
    probe.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADrbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAETAAAAIQAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABqaXBycAAAAEtpcGNvAAAAFGlzcGUAAAAAAAAAAQAAAAEAAAAQcGl4aQAAAAADCAgIAAAADGF2MUOBAAwAAAAAE2NvbHJuY2x4AAEADQAGgAAAABdpcG1hAAAAAAAAAAEAAQQBAoMEAAAAKW1kYXQSAAoIGAAGiAhoNCAyExlHh4Yhh5555oAAAJBAyRxhQr4=';
    try { await probe.decode(); return true; } catch { return false; }
  })();
}
export async function loadCatPhoto(photo: GalleryPhoto, signal?: AbortSignal): Promise<string> {
  if (photo.avif && await supportsAvif()) {
    try { await loadPhoto(photo.avif, signal); return photo.avif; }
    catch (error) { if (signal?.aborted) throw error; }
  }
  await loadPhoto(photo.src, signal);
  return photo.src;
}
