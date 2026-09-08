import { useEffect, useRef, type ReactNode } from "react";
import { Icon, StarArt } from "./art";

export function GameButton({ children, onClick, variant = "blue", big = false, className = "", disabled = false, type = "button" }: {
  children: ReactNode; onClick?: () => void; variant?: "gold" | "green" | "blue" | "red";
  big?: boolean; className?: string; disabled?: boolean; type?: "button" | "submit";
}) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`game-button button-${variant} ${big ? "button-big" : ""} ${className}`}>{children}</button>;
}

export function Dialog({ children, title, onClose, className = "" }: { children: ReactNode; title: string; onClose?: () => void; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = ref.current;
    element?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !element) return;
      const nodes = [...element.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]')];
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === element)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === element)) {
        event.preventDefault(); first.focus();
      }
    };
    element?.addEventListener("keydown", trap);
    return () => { element?.removeEventListener("keydown", trap); previous?.focus(); };
  }, []);
  return <div className="dialog-backdrop"><div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`parchment dialog-panel ${className}`}>
    {onClose && <button className="dialog-close" onClick={onClose} aria-label="Tutup"><Icon name="close" /></button>}
    {children}
  </div></div>;
}

export function ScreenShell({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return <div className="library-backdrop"><section className="parchment library-panel">
    <header className="library-header"><button className="round-button small" onClick={onBack} aria-label="Kembali ke menu"><Icon name="back" /></button><h1>{title}</h1></header>
    <div className="library-content">{children}</div>
  </section></div>;
}

export function StarRating({ stars }: { stars: number }) {
  return <div className="star-rating" aria-label={`${stars} dari 3 bintang`}>{[0, 1, 2].map(i => <span className={i < stars ? "" : "star-empty"} key={i}><StarArt /></span>)}</div>;
}