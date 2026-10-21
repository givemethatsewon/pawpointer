import { ArrowUpRight, MousePointer2, Hand, Keyboard, PawPrint } from 'lucide-react';
export function About() {
  return <div className="about-content">
    <PawPrint className="about-paw" size={42} strokeWidth={1.4} />
    <p className="about-lead">The internet could use<br />a little more <em>cat.</em></p>
    <p>Move somewhere. Hold still. A curious paw finds you. That's the whole idea.</p>
    <div className="instructions">
      <div><MousePointer2 size={19} /><p><strong>On a computer</strong>Move your cursor, then pause for a moment.</p></div>
      <div><Hand size={19} /><p><strong>On your phone</strong>Tap anywhere. That spot belongs to a cat now.</p></div>
      <div><Keyboard size={19} /><p><strong>Prefer a keyboard?</strong>Arrow keys move the target. Space brings another cat.</p></div>
    </div>
    <details><summary>A little peek behind the paws</summary><p>Each photo has a hand-marked paw position. We find a nearby match, skip the last four cats, then scale and shift the photo until its paw lands on your cursor. No AI running in the background. Just a little geometry.</p></details>
    <div className="about-credit"><p>An interactive experiment by <a href="https://github.com/givemethatsewon" target="_blank" rel="me noreferrer"><strong>Sewon</strong> <ArrowUpRight size={13} /></a>.</p><p>Inspired by <a href="https://pointerpointer.com" target="_blank" rel="noreferrer">Pointer Pointer <ArrowUpRight size={13} /></a>.</p><p>Photography from <a href="https://www.pexels.com" target="_blank" rel="noreferrer">Pexels</a>, used under the <a href="https://www.pexels.com/license/" target="_blank" rel="noreferrer">Pexels License</a>.</p></div>
  </div>;
}
