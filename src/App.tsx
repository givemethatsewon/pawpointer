import { PawPrint } from 'lucide-react';
import catalog from './gallery.json';
import type { GalleryPhoto } from './lib/geometry';
import { usePointerGallery } from './lib/usePointerGallery';
import { PhotoStage } from './components/PhotoStage';
const photos: GalleryPhoto[] = catalog;
export default function App() {
  const gallery = usePointerGallery(photos, false);
  const { phase, shot, touch, another } = gallery;
  const status = phase === 'ready' ? (touch ? 'Tap somewhere new. Curiosity follows.' : 'Stay curious. Move somewhere new.') : phase === 'loading' ? 'One curious cat, coming right up…' : phase === 'error' ? 'Our cats got distracted. Try again?' : phase === 'waiting' ? (touch ? 'Tap anywhere. A cat will find you.' : 'Move your cursor. Then hold still.') : 'Hold still. Someone’s curious.';
  return <div className={`app ${shot ? 'has-photo' : ''}`}>
    <PhotoStage {...gallery} paused={false} />
    <header className="toolbar" aria-label="Paw Pointer controls">
      <a className="wordmark" data-ui href="https://github.com/givemethatsewon/pawpointer" target="_blank" rel="noreferrer" aria-label="Paw Pointer on GitHub"><PawPrint size={22} strokeWidth={2.4} /><span>paw pointer</span></a>
    </header>
    <footer className="bottom-bar">
      <div className="status" role="status" aria-live="polite" aria-atomic="true"><span className={`status-dot ${phase === 'loading' ? 'pulsing' : ''}`} /><span>{status}</span></div>
      {phase === 'error' && <button className="another-button" data-ui onClick={another}>Try again</button>}
    </footer>
  </div>;
}
