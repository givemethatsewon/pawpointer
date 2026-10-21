export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type CatPhoto = Size & {
  id: string; title: string; src: string; thumbnail: string; paw: Point;
  alt: string; photographer: string; source: string; sourceUrl: string; licenseUrl: string;
};
export type GalleryPhoto = Pick<CatPhoto, 'id' | 'src' | 'width' | 'height' | 'paw' | 'alt'> & { avif?: string | null };
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
export function normalize(point: Point, viewport: Size): Point {
  return { x: clamp(point.x / Math.max(1, viewport.width), 0, 1), y: clamp(point.y / Math.max(1, viewport.height), 0, 1) };
}
export function denormalize(point: Point, viewport: Size): Point {
  return { x: point.x * viewport.width, y: point.y * viewport.height };
}
/** Original Pointer Pointer principle: normalized nearest neighbour, recent four excluded. */
export function selectPhoto<T extends GalleryPhoto>(photos: T[], position: Point, recent: string[] = [], failed: Set<string> = new Set()): T | undefined {
  const available = photos.filter(p => !failed.has(p.id));
  const fresh = available.filter(p => !recent.includes(p.id));
  const candidates = fresh.length ? fresh : available;
  return candidates.reduce<T | undefined>((best, photo) => {
    const distance = (p: GalleryPhoto) => (p.paw.x - position.x) ** 2 + (p.paw.y - position.y) ** 2;
    return !best || distance(photo) < distance(best) ? photo : best;
  }, undefined);
}
/** The annotated paw maps EXACTLY to target, even at corners or on portrait screens. */
export function placePhoto(photo: GalleryPhoto, target: Point, viewport: Size) {
  const scale = Math.max(viewport.width / photo.width, viewport.height / photo.height) * 1.2;
  const width = photo.width * scale, height = photo.height * scale;
  return { width, height, left: target.x - photo.paw.x * width, top: target.y - photo.paw.y * height };
}
export function remember(recent: string[], id: string) {
  return [id, ...recent.filter(item => item !== id)].slice(0, 4);
}
