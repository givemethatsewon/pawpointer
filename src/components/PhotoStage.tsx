import type { CSSProperties } from 'react';
import { placePhoto, type Point, type Size } from '../lib/geometry';
import { asset } from '../lib/images';
import type { Phase, Shot } from '../lib/usePointerGallery';

type Props = { shot: Shot | null; target: Point; viewport: Size; phase: Phase; activity: number; paused: boolean };
export function PhotoStage({ shot, target, viewport, phase, activity, paused }: Props) {
  const placement = shot ? placePhoto(shot.photo, shot.target, viewport) : null;
  return <main className={`stage phase-${phase}`} aria-label="Interactive cat canvas" tabIndex={0} aria-describedby="canvas-instructions" data-phase={phase} data-photo-id={shot?.photo.id ?? ''}>
    <h1 className="sr-only">Paw Pointer — Cats Point at Your Cursor</h1>
    <p id="canvas-instructions" className="sr-only">Move your pointer and hold still for a cat. On touch screens, tap anywhere. Use arrow keys to move the target, Space for another cat, and Tab to reach the controls.</p>
    {shot && placement ? <div className="photo-scene" key={shot.sequence}>
      <img className="photo-backdrop" src={asset(shot.source)} alt="" aria-hidden="true" />
      <img className="aligned-photo" src={asset(shot.source)} alt={shot.photo.alt} style={placement} draggable={false} data-paw-x={shot.photo.paw.x} data-paw-y={shot.photo.paw.y} />
    </div> : <div className="empty-stage" aria-hidden="true" />}
    {!paused && <div className={`target ${phase === 'ready' ? 'is-found' : ''}`} style={{ '--target-x': `${target.x}px`, '--target-y': `${target.y}px` } as CSSProperties} aria-hidden="true" data-testid="target">
      <span className="target-core" />
      {phase === 'tracking' && <svg key={activity} viewBox="0 0 44 44" className="target-timer"><circle cx="22" cy="22" r="19" /></svg>}
      {phase === 'ready' && <span key={shot?.sequence} className="found-ring" />}
    </div>}
  </main>;
}
