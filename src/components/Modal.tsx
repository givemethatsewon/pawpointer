import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Modal({ open, onClose, title, subtitle, children }: { open: boolean; onClose: () => void; title: string; subtitle: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} className="modal" data-ui aria-labelledby="dialog-title" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="modal-inner">
      <header className="modal-header"><div><h1 id="dialog-title">{title}</h1><p>{subtitle}</p></div><button className="icon-button close-button" onClick={onClose} aria-label="Close dialog" autoFocus><X size={20} /></button></header>
      {children}
    </section>
  </dialog>;
}
