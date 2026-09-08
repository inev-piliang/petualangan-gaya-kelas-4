import { useId } from "react";

export type IconName = "play" | "pause" | "home" | "back" | "next" | "restart" | "book" | "map" | "award" | "chart" | "info" | "sound" | "mute" | "check" | "close" | "lock" | "clock";

export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    play: <path d="m8 4 13 8-13 8Z" fill="currentColor" strokeLinejoin="round" />,
    pause: <><rect x="5" y="4" width="4" height="16" rx="1" fill="currentColor" /><rect x="15" y="4" width="4" height="16" rx="1" fill="currentColor" /></>,
    home: <><path d="m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10" /></>,
    back: <path d="m14 5-7 7 7 7M7 12h14" />,
    next: <path d="m10 5 7 7-7 7M17 12H3" />,
    restart: <><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" /></>,
    book: <><path d="M12 5v16M3 4c4-1 7 0 9 2 2-2 5-3 9-2v15c-4-1-7 0-9 2-2-2-5-3-9-2Z" /><path d="m6 8 3 1m6 0 3-1m-12 4 3 1m6 0 3-1" /></>,
    map: <><path d="m3 5 6-2 6 3 6-2v16l-6 2-6-3-6 2ZM9 3v16m6-13v16" /></>,
    award: <><circle cx="12" cy="8" r="5" /><path d="m8 12-2 9 6-3 6 3-2-9" /><path d="m12 5 1 2 2 .3-1.5 1.5.4 2.2L12 10l-1.9 1 .4-2.2L9 7.3l2-.3Z" strokeWidth="1" fill="currentColor" /></>,
    chart: <><path d="M4 3v18h17M8 16v-4m5 4V8m5 8V5" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7v.1" /></>,
    sound: <><path d="M3 9v6h4l5 4V5L7 9ZM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
    mute: <><path d="M3 9v6h4l5 4V5L7 9Zm13 0 5 6m0-6-5 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></>,
  };
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function StarArt({ className = "" }: { className?: string }) {
  const id = useId();
  return <svg viewBox="0 0 80 80" className={`art-icon ${className}`} aria-hidden="true">
    <defs><linearGradient id={id} x1="0" y1="0" x2=".3" y2="1"><stop stopColor="#fff79b" /><stop offset=".35" stopColor="#ffdd31" /><stop offset="1" stopColor="#f2a80d" /></linearGradient></defs>
    <path d="m40 5 11 23 24 4-18 18 4 25-21-12-22 12 4-25L4 32l25-4Z" fill="#b56514" stroke="#733714" strokeWidth="3" strokeLinejoin="round" transform="translate(0 2)" />
    <path d="m40 5 11 23 24 4-18 18 4 25-21-12-22 12 4-25L4 32l25-4Z" fill={`url(#${id})`} stroke="#ffe998" strokeWidth="3" strokeLinejoin="round" />
    <path d="m40 12 8 19 18 3-23 7-23-7 13-3Z" fill="#fff28c" opacity=".5" />
  </svg>;
}

export function HeartArt() {
  const id = useId();
  return <svg viewBox="0 0 44 42" className="heart-art" aria-hidden="true">
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ff8560" /><stop offset=".42" stopColor="#ff4934" /><stop offset="1" stopColor="#d52215" /></linearGradient></defs>
    <path d="M22 38C15 32 3 22 3 13 3 1 17 0 22 10 28 0 41 1 41 13 41 23 29 33 22 38Z" fill="#811914" stroke="#7e291a" strokeWidth="3" transform="translate(0 1)" />
    <path d="M22 37C15 31 3 21 3 12 3 1 17 0 22 9 28 0 41 1 41 12 41 22 29 32 22 37Z" fill={`url(#${id})`} stroke="#ff9b76" strokeWidth="1.3" />
    <path d="M8 11c1-5 6-6 9-2" fill="none" stroke="#ffe0c6" strokeWidth="4" strokeLinecap="round" /><ellipse cx="31" cy="7" rx="3" ry="1.7" fill="#ffe5c9" />
  </svg>;
}

export function ChestArt({ className = "" }: { className?: string }) {
  const id = useId();
  return <svg viewBox="0 0 106 108" className={`art-icon chest-art ${className}`} aria-hidden="true">
    <defs><linearGradient id={`${id}-red`} x1="0" y1="0" x2=".4" y2="1"><stop stopColor="#ff8647" /><stop offset=".5" stopColor="#df4925" /><stop offset="1" stopColor="#983016" /></linearGradient><linearGradient id={`${id}-gold`} x1="0" y1="0" x2=".4" y2="1"><stop stopColor="#fff495" /><stop offset=".4" stopColor="#ffc638" /><stop offset="1" stopColor="#bc7019" /></linearGradient></defs>
    <path d="m12 45 54-17 29 12v43L40 103 9 84Z" fill="#783912" stroke="#553016" strokeWidth="4" strokeLinejoin="round" />
    <path d="m39 57 54-15v39l-53 18Z" fill="#ae561c" stroke="#edab33" strokeWidth="5" />
    <path d="M9 45C4 27 11 11 27 10l50-7c15 3 20 20 18 37L40 60Z" fill={`url(#${id}-red)`} stroke="#623216" strokeWidth="4" strokeLinejoin="round" />
    <path d="M9 45C4 27 11 11 27 10c17 1 24 23 13 50Z" fill="#a23f1d" stroke="#f7c442" strokeWidth="5" />
    <path d="m27 10 9-2c19 8 19 29 16 47l-12 5c3-26-1-41-13-50Zm39-5 10-2c20 9 22 23 19 37l-10 3c2-20-1-29-19-38Z" fill={`url(#${id}-gold)`} stroke="#713917" strokeWidth="1.7" />
    <path d="m9 45 31 15 55-20v8L40 68 9 53Zm26 17 9 2v36l-8 1Z" fill={`url(#${id}-gold)`} stroke="#a8651b" strokeWidth="1.6" />
    <path d="m61 51 15-4v21l-15 5Z" fill="#ffcf4e" stroke="#875017" strokeWidth="2.5" /><path d="M69 56v9" stroke="#653914" strokeWidth="4" strokeLinecap="round" />
    <path d="m17 78 12 5M47 84l8-2m22-8 10-3" stroke="#713b15" strokeWidth="2" strokeLinecap="round" />
  </svg>;
}

export function PinArt() {
  const id = useId();
  return <svg viewBox="0 0 70 100" className="pin-art" aria-hidden="true">
    <defs><linearGradient id={id} x1="0" y1="0" x2=".5" y2="1"><stop stopColor="#ffb161" /><stop offset=".4" stopColor="#f77c3a" /><stop offset="1" stopColor="#ce4527" /></linearGradient></defs>
    <path d="M35 95S5 54 5 34C5-5 65-5 65 34c0 20-30 61-30 61Z" fill={`url(#${id})`} stroke="#793a20" strokeWidth="4" />
    <path d="M12 33C10 4 56 1 60 27" fill="none" stroke="#ffd991" strokeWidth="3" strokeLinecap="round" />
    <circle cx="35" cy="32" r="14" fill="#ffdf6c" stroke="#ae641d" strokeWidth="4" /><circle cx="35" cy="30" r="10" fill="#ffc947" />
  </svg>;
}

export function WoodSign({ title, subtitle }: { title: string; subtitle: string }) {
  const id = useId();
  return <div className="wood-sign">
    <svg className="wood-sign-art" viewBox="0 0 460 163" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id={`${id}-wood`} x2="0" y2="1"><stop stopColor="#ac6634" /><stop offset=".42" stopColor="#965026" /><stop offset=".5" stopColor="#b3733b" /><stop offset="1" stopColor="#713719" /></linearGradient><linearGradient id={`${id}-paper`} x2="0" y2="1"><stop stopColor="#fff1ca" /><stop offset="1" stopColor="#f9d18b" /></linearGradient></defs>
      <path d="M19 12 438 6Q450 8 449 22l-1 117q-2 13-19 14L28 161q-17 0-20-17L4 33Q3 16 19 12Z" fill="#603319" stroke="#4f2c18" strokeWidth="4" />
      <path d="M20 7 435 3Q448 5 449 20l-1 113q-2 14-19 15L28 155q-17 0-20-17L4 29Q3 12 20 7Z" fill={`url(#${id}-wood)`} stroke="#7a461e" strokeWidth="3" />
      <path d="m10 45 432-4M9 82l430-7M15 118l429-7" stroke="#6e361b" strokeWidth="3" opacity=".6" />
      <path d="m28 23 40 1m63-7 64 1m-10 41 32-1m75-33 99-3m-84 89 119-5M22 135l38-1" stroke="#cf8b47" strokeWidth="3" opacity=".55" strokeLinecap="round" />
      <path d="m19 67 30-4m280-34 34 1M19 100l39-3m285 36 52-3" stroke="#542c18" strokeWidth="2" opacity=".5" />
      <path d="m37 87 381-9q11 0 13 11l-1 36q-1 11-11 13l-381 9q-9-1-10-10l-2-38q-1-10 11-12Z" fill={`url(#${id}-paper)`} stroke="#c28a45" strokeWidth="3" />
      <path d="m28 104 14-1m-13 25 9-1m390-37-15 1m17 31-15 1" stroke="#d59d53" strokeWidth="3" />
      <g stroke="#7a8632" strokeWidth="2"><path d="M15 12Q-5-4 6 0q17-1 16 17" fill="#9ab840" /><path d="M19 13Q36-12 42 3 40 17 21 21" fill="#c4d968" /><path d="M13 17Q-5 12 3 37 14 36 18 22" fill="#b3c859" /><path d="M432 7Q418-10 412 2q-2 12 20 19" fill="#c8d568" /><path d="M439 10Q462 4 454 31 440 27 436 16" fill="#9fbc42" /><path d="M436 14Q425 31 429 36 444 31 442 16" fill="#b3c654" /></g>
    </svg>
    <div className="wood-sign-heading"><PinArt /><span>{title}</span></div>
    <div className="wood-sign-subtitle">{subtitle}</div>
  </div>;
}