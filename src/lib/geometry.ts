export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type CatPhoto = Size & {
  id: string; title: string; src: string; thumbnail: string; paw: Point;
  alt: string; photographer: string; source: string; sourceUrl: string; licenseUrl: string;
};
export type GalleryPhoto = Pick<CatPhoto, 'id' | 'src' | 'width' | 'height' | 'paw' | 'alt'> & { avif?: string | null; mobile?: string; preview?: string };
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
export function normalize(point: Point, viewport: Size): Point {
  return { x: clamp(point.x / Math.max(1, viewport.width), 0, 1), y: clamp(point.y / Math.max(1, viewport.height), 0, 1) };
}
export function denormalize(point: Point, viewport: Size): Point {
  return { x: point.x * viewport.width, y: point.y * viewport.height };
}
/** Choose among nearby paws, with a stable pick during preload/reveal. */
export function selectPhoto<T extends GalleryPhoto>(photos: T[], position: Point, recent: string[] = [], failed: Set<string> = new Set()): T | undefined {
  const available = photos.filter(p => !failed.has(p.id));
  const fresh = available.filter(p => !recent.includes(p.id));
  const candidates = fresh.length ? fresh : available.filter(p => p.id !== recent[0]);
  const distance = (p: GalleryPhoto) => (p.paw.x - position.x) ** 2 + (p.paw.y - position.y) ** 2;
  const nearby = candidates.sort((a,b) => distance(a)-distance(b)).slice(0,8);
  if (!nearby.length) return available[0];
  if (!recent.length) return nearby[0];
  // Keep alternatives close to the best fit, rather than choosing across the canvas.
  const pool = nearby.filter(p => distance(p) <= distance(nearby[0]) + .025);
  let seed = 2166136261;
  for (const char of recent.join('|')) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return pool[(seed >>> 0) % pool.length];
}
/** The annotated paw maps EXACTLY to target, even at corners or on portrait screens. */
export function placePhoto(photo: GalleryPhoto, target: Point, viewport: Size) {
  const scale = Math.max(viewport.width / photo.width, viewport.height / photo.height) * 1.2;
  const width = photo.width * scale, height = photo.height * scale;
  return { width, height, left: target.x - photo.paw.x * width, top: target.y - photo.paw.y * height };
}
export function remember(recent: string[], id: string) {
  return [id, ...recent.filter(item => item !== id)].slice(0, 24);
}
