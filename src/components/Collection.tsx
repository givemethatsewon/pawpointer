import { ArrowUpRight, Check } from 'lucide-react';
import type { GalleryPhoto } from '../lib/geometry';
import { asset } from '../lib/images';
import photos from '../photos.json';
import gallery from '../gallery.json';
const variants = new Map(gallery.map(p => [p.id, p]));
export function Collection({ seen, onChoose }: { seen: string[]; onChoose: (photo: GalleryPhoto) => void }) {
  return <><div className="collection-summary"><span>{seen.length} of {photos.length} cats met</span><span>Pick a cat to say hello.</span></div>
    <div className="cat-grid">{photos.map((photo, i) => <article className="cat-card" key={photo.id}>
      <button className="cat-select" onClick={() => onChoose(variants.get(photo.id) ?? photo)} aria-label={`Meet ${photo.title}`}>
        <img src={asset(photo.thumbnail)} alt={photo.alt} loading="lazy" />
        <span className="cat-index">{String(i + 1).padStart(2, '0')}</span>
        {seen.includes(photo.id) && <span className="cat-seen" title="Already met"><Check size={14} /><span className="sr-only">Already met</span></span>}
      </button>
      <h2>{photo.title}</h2><a href={photo.sourceUrl} target="_blank" rel="noreferrer">{photo.photographer} <ArrowUpRight size={12} /><span className="sr-only"> on {photo.source}</span></a>
    </article>)}</div>
    <p className="collection-credit">Real cats. Real photographers. Photos provided by <a href="https://www.pexels.com" target="_blank" rel="noreferrer">Pexels</a>. Each photograph links to its original creator.</p>
  </>;
}
