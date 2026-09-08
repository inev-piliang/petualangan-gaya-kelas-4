import { useState } from "react";
import { ALL_BADGES, GOALS, LEVELS, TOPICS, type BadgeDef, type Lesson } from "../game/levels";
import { formatTime, type ScoreEntry } from "../game/storage";
import { ChestArt, Icon, StarArt, WoodSign, type IconName } from "./art";
import { Dialog, GameButton, ScreenShell, StarRating } from "./ui";

export function MenuScreen({ onStart, onNav, best }: {
  onStart: () => void; onNav: (screen: "materi" | "badges" | "scores" | "tips") => void; best: ScoreEntry | null;
}) {
  const links: { screen: "materi" | "badges" | "scores" | "tips"; icon: IconName; label: string }[] = [
    { screen: "materi", icon: "book", label: "Pelajari Materi" },
    { screen: "badges", icon: "award", label: "Koleksi Badge" },
    { screen: "scores", icon: "chart", label: "Nilai Saya" },
    { screen: "tips", icon: "info", label: "Petunjuk" },
  ];
  return <div className="menu-screen">
    <WoodSign title="Halo, Petualang!" subtitle="Siap menemukan harta karun?" />
    <section className="parchment menu-panel">
      <ChestArt className="menu-chest" />
      <p className="menu-eyebrow">SEBUAH PETUALANGAN IPA KELAS 4</p>
      <h1 className="menu-title">Misi Harta<br /><span>Karun</span></h1>
      <h2 className="menu-subtitle">Petualangan Gaya</h2>
      <p className="menu-description">Gunakan pengetahuan tentang gaya untuk melewati setiap rintangan!</p>
      <GameButton variant="gold" big className="full-width" onClick={onStart}><Icon name="play" />Mulai Petualangan</GameButton>
      <nav className="menu-links" aria-label="Menu game">{links.map(link => <button key={link.screen} onClick={() => onNav(link.screen)}><Icon name={link.icon} />{link.label}</button>)}</nav>
      {best ? <p className="menu-record"><StarArt /> Rekor terbaikmu: <strong>{best.score} bintang</strong></p> : <p className="menu-note">Tidak takut salah. Selalu bisa belajar lagi.</p>}
    </section>
  </div>;
}

export function MateriScreen({ onBack }: { onBack: () => void }) {
  return <ScreenShell title="Bekal Petualangan" onBack={onBack}>
    <p className="section-intro">Kenali gaya di sekitarmu. Bekal kecil untuk petualangan yang besar!</p>
    <div className="topic-list">{TOPICS.map((topic, i) => <details key={topic.title} className="topic" open={i === 0}>
      <summary><span className="topic-number">0{i + 1}</span><h2>{topic.title}</h2><span className="topic-plus">+</span></summary>
      <div className="topic-content"><p>{topic.body}</p><h3>Contoh sehari-hari</h3><ul>{topic.examples.map(example => <li key={example}>{example}</li>)}</ul></div>
    </details>)}</div>
  </ScreenShell>;
}

export function BadgesScreen({ unlocked, onBack }: { unlocked: string[]; onBack: () => void }) {
  const [selected, setSelected] = useState<BadgeDef | null>(null);
  return <>
    <ScreenShell title="Koleksi Badge" onBack={onBack}>
      <p className="section-intro">{unlocked.length} dari {ALL_BADGES.length} kenang-kenangan petualangan sudah kamu kumpulkan.</p>
      <div className="badge-grid">{ALL_BADGES.map(badge => {
        const got = unlocked.includes(badge.id);
        return <button className={`badge-item ${got ? "badge-unlocked" : "badge-locked"}`} key={badge.id} onClick={() => setSelected(badge)}>
          <span className="badge-medallion">{got ? <Icon name="award" /> : <Icon name="lock" />}</span>
          <strong>{badge.name}</strong><small>{got ? "Sudah kamu miliki" : badge.level === 9 ? "Selesaikan petualangan" : `Tantangan ${badge.level}`}</small>
        </button>;
      })}</div>
    </ScreenShell>
    {selected && <Dialog title={selected.name} onClose={() => setSelected(null)} className="badge-detail"><div className="badge-medallion"><Icon name="award" /></div><h2>{selected.name}</h2><p>{selected.desc}</p><p>{unlocked.includes(selected.id) ? "Hebat! Badge ini sudah menjadi milikmu." : "Teruskan petualangan untuk mendapatkan badge ini."}</p><GameButton onClick={() => setSelected(null)}>Kembali ke koleksi</GameButton></Dialog>}
  </>;
}

export function ScoresScreen({ scores, onBack }: { scores: ScoreEntry[]; onBack: () => void }) {
  return <ScreenShell title="Nilai Saya" onBack={onBack}>
    <p className="section-intro">Lima petualangan terbaikmu, tersimpan di perangkat ini.</p>
    {!scores.length ? <div className="empty-state"><ChestArt /><h2>Ceritamu baru dimulai!</h2><p>Selesaikan kedelapan tantangan untuk mencatat nilai pertamamu.</p></div> : <div className="score-table-wrap"><table className="score-table"><thead><tr><th>Peringkat</th><th>Petualangan</th><th>Bintang</th><th>Waktu</th></tr></thead><tbody>{scores.map((score, i) => <tr key={`${score.date}-${i}`}>
      <td><span className={`rank rank-${i + 1}`}>{i + 1}</span></td>
      <td><strong>{score.score} poin</strong><small>{new Date(score.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</small><small>{score.mistakes ? `${score.mistakes} misi belajar` : "Tanpa kesalahan"}</small></td>
      <td><StarRating stars={score.stars} /></td><td>{formatTime(score.time)}</td>
    </tr>)}</tbody></table></div>}
    <p className="library-footnote">Jawaban benar +10 poin. Bonus +20 jika seluruh tantangan dijawab tanpa kesalahan. Energi tidak berkurang saat belajar.</p>
  </ScreenShell>;
}

export function TipsScreen({ onBack }: { onBack: () => void }) {
  return <ScreenShell title="Petunjuk Petualangan" onBack={onBack}>
    <p className="section-intro">Delapan rintangan, satu harta karun, dan banyak hal baru untuk dipelajari.</p>
    <ol className="instruction-list"><li><span>1</span><div><h2>Amati rintangannya</h2><p>Baca pertanyaan, lalu pilih satu dari empat jawaban dengan menyentuh tombol atau menekan A-D maupun 1-4.</p></div></li><li><span>2</span><div><h2>Gunakan pengetahuanmu</h2><p>Jawaban benar membuat karakter maju dan memberimu 10 poin. Tekan Enter atau tombol berikutnya untuk melanjutkan.</p></div></li><li><span>3</span><div><h2>Salah bukan akhir cerita</h2><p>Buka Misi Belajar, baca materi singkat, lalu coba kembali. Kelima energimu tetap utuh.</p></div></li><li><span>4</span><div><h2>Temukan harta karun sejati</h2><p>Kumpulkan badge dan selesaikan semua tantangan. Sebuah pesan istimewa menantimu!</p></div></li></ol>
    <div className="controls-note"><Icon name="pause" /><p><kbd>P</kbd> atau <kbd>Esc</kbd> untuk jeda, <kbd>M</kbd> untuk suara, dan <kbd>R</kbd> untuk mengulang saat jeda atau di akhir permainan.</p></div>
    <h2 className="goals-heading">Tujuan Pembelajaran</h2><ul className="learning-goals">{GOALS.map(goal => <li key={goal}>{goal}</li>)}</ul>
  </ScreenShell>;
}

export function LearnModal({ lesson, onDone }: { lesson: Lesson; onDone: () => void }) {
  return <Dialog title="Misi Belajar" className="learn-dialog">
    <div className="dialog-emblem"><Icon name="book" /></div><p className="dialog-eyebrow">SETIAP LANGKAH ADALAH PELAJARAN</p><h2>Misi Belajar</h2>
    <h3 className="lesson-title">{lesson.title.toLocaleLowerCase("id-ID")}</h3><p className="lesson-body">{lesson.body}</p>
    <div className="lesson-examples"><h4>Contoh dalam kehidupan</h4><ul>{lesson.examples.map(example => <li key={example}>{example}</li>)}</ul></div>
    <p className="lesson-tip"><strong>Ingat, ya!</strong> {lesson.tip}</p>
    <GameButton variant="gold" className="full-width" onClick={onDone}><Icon name="check" /> Saya Sudah Membaca</GameButton><p className="dialog-footnote">Setelah ini, ayo coba sekali lagi!</p>
  </Dialog>;
}

export function PauseOverlay({ onResume, onRestart, onMenu, muted, onMute, score, time }: {
  onResume: () => void; onRestart: () => void; onMenu: () => void; muted: boolean; onMute: () => void; score: number; time: number;
}) {
  return <Dialog title="Petualangan dijeda" className="pause-dialog"><div className="dialog-emblem"><Icon name="pause" /></div><h2>Istirahat Sejenak</h2><p>Petualanganmu menunggu. Siap lanjut?</p>
    <div className="pause-meta"><span><StarArt />{score} poin</span><span><Icon name="clock" />{formatTime(time)}</span></div>
    <div className="dialog-actions"><GameButton variant="gold" onClick={onResume}><Icon name="play" />Lanjutkan Petualangan</GameButton><GameButton onClick={onRestart}><Icon name="restart" />Ulangi dari Awal</GameButton><GameButton onClick={onMenu}><Icon name="home" />Kembali ke Menu</GameButton></div>
    <button className="sound-setting" onClick={onMute}><Icon name={muted ? "mute" : "sound"} />Suara {muted ? "mati" : "menyala"}</button>
  </Dialog>;
}

export function MapModal({ levelIdx, earned, onClose }: { levelIdx: number; earned: string[]; onClose: () => void }) {
  return <Dialog title="Peta Petualangan" onClose={onClose} className="map-dialog"><p className="dialog-eyebrow">SATU LANGKAH LEBIH DEKAT</p><h2>Peta Petualangan</h2><p>Ikuti jalanmu menuju harta karun.</p>
    <ol className="adventure-route">{LEVELS.map((level, i) => {
      const done = earned.includes(level.badge.id);
      return <li key={level.id} className={`${done ? "route-done" : ""} ${i === levelIdx ? "route-current" : ""}`} aria-current={i === levelIdx ? "step" : undefined}><span className="route-node">{done ? <Icon name="check" /> : i > levelIdx ? <Icon name="lock" /> : level.id}</span><strong>{level.name}</strong></li>;
    })}</ol><div className="map-treasure"><ChestArt /><span>Harta Karun Sejati</span></div><GameButton variant="gold" className="full-width" onClick={onClose}><Icon name="play" />Lanjutkan Petualangan</GameButton>
  </Dialog>;
}

export const FINAL_MESSAGES = [
  "Untuk meraih cita-cita, kita harus belajar, berdoa, dan berusaha dengan sungguh-sungguh.",
  "Seperti kamu melewati setiap rintangan dalam perjalanan ini, jangan menyerah ketika menghadapi kesulitan dalam kehidupan. Teruslah belajar, berdoa, dan berusaha.",
];

export function ResultModal({ total, bonus, mistakes, stars, time, isNewBest, newBadges, onMenu, onRestart, onMateri }: {
  total: number; bonus: number; mistakes: number; stars: number; time: number; isNewBest: boolean;
  newBadges: { name: string }[]; onMenu: () => void; onRestart: () => void; onMateri: () => void;
}) {
  return <Dialog title="Harta Karun Sejati" className="result-dialog"><ChestArt className="result-chest" /><p className="dialog-eyebrow">MISI SELESAI, PETUALANG HEBAT!</p><h2>Harta Karun Sejati</h2>
    <p className="treasure-intro">Bukan emas, tetapi sebuah pesan untukmu...</p><blockquote>{FINAL_MESSAGES[0]}</blockquote><p className="closing-message">{FINAL_MESSAGES[1]}</p>
    <StarRating stars={stars} /><p className="result-score">{total}<span>poin petualangan</span></p>{isNewBest && <p className="record-label">Rekor terbaik baru!</p>}
    <p className="result-meta">{formatTime(time)} perjalanan <span>/</span> {mistakes} misi belajar{bonus > 0 && <><span>/</span> Bonus +{bonus}</>}</p>
    {newBadges.length > 0 && <details className="result-badges"><summary><Icon name="award" />{newBadges.length} badge baru menjadi milikmu</summary><ul>{newBadges.map(badge => <li key={badge.name}>{badge.name}</li>)}</ul></details>}
    <GameButton variant="gold" className="full-width" onClick={onRestart}><Icon name="restart" />Main Lagi</GameButton><div className="result-links"><button onClick={onMenu}><Icon name="home" />Kembali ke Menu</button><button onClick={onMateri}><Icon name="book" />Pelajari Materi</button></div>
  </Dialog>;
}