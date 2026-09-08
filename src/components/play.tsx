import { LEVELS, type LevelDef } from "../game/levels";
import { ChestArt, HeartArt, Icon, StarArt, WoodSign } from "./art";
import { GameButton } from "./ui";

export type PlayPhase = "question" | "correct" | "wrong" | "learn" | "cleared" | "treasure" | "final";
export const CHALLENGE_TITLES = ["Batu Besar di Jalan", "Jembatan yang Licin", "Gerbang Besi Tertutup", "Melompati Jurang", "Buah Jatuh dari Pohon", "Bola di Tengah Jalan", "Dinding Tanah", "Pintu Harta Karun"];
const LETTERS = ["A", "B", "C", "D"];

export function HUD({ levelIdx, score, onPause }: { levelIdx: number; score: number; onPause: () => void }) {
  return <header className="game-hud">
    <WoodSign title={`Tantangan ${levelIdx + 1}`} subtitle={CHALLENGE_TITLES[levelIdx]} />
    <div className="energy-panel" aria-label={`Energi petualangan 5 dari 5. Skor ${score}`}>
      <div className="energy-star"><StarArt /><span key={score}>{score}</span></div>
      <div className="energy-content"><span className="energy-label"><span className="energy-full">Energi Petualangan</span><span className="energy-short">Energi</span></span><div className="hearts">{[0, 1, 2, 3, 4].map(i => <HeartArt key={i} />)}</div></div>
    </div>
    <div className="goal-panel"><ChestArt /><div><strong>Tujuan:</strong><span>Temukan harta karun!</span></div></div>
    <button className="round-button pause-button" aria-label="Jeda permainan" title="Jeda (P)" onClick={onPause}><Icon name="pause" /></button>
  </header>;
}

export function QuestionPanel({ level, levelIdx, phase, selected, onAnswer, onOpenLearn, onNext, panelRef }: {
  level: LevelDef; levelIdx: number; phase: PlayPhase; selected: number | null;
  onAnswer: (index: number) => void; onOpenLearn: () => void; onNext: () => void;
  panelRef: (element: HTMLDivElement | null) => void;
}) {
  const answered = phase !== "question";
  const success = phase === "correct" || phase === "cleared";
  return <div className="question-zone" ref={panelRef}>
    <section className={`parchment question-panel ${answered ? "has-feedback" : ""}`} aria-labelledby="challenge-question" key={levelIdx}>
      <div className={`question-prompt ${level.question.length > 145 ? "long-prompt" : ""}`}><h1 id="challenge-question">{levelIdx === 0 ? <>Batu besar menghalangi jalan.<br />Agar batu tersebut dapat dipindahkan,<br />gaya apa yang paling sesuai?</> : level.question}</h1></div>
      <div className="answer-options" role="group" aria-label="Pilihan jawaban">
        {level.options.map((option, i) => {
          const isRight = success && i === level.correct;
          const isWrong = !success && answered && selected === i;
          return <button key={i} className={`answer-option ${isRight ? "answer-right" : ""} ${isWrong ? "answer-wrong" : ""} ${answered && selected !== i ? "answer-dimmed" : ""}`} disabled={answered} onClick={event => { event.currentTarget.blur(); onAnswer(i); }} aria-label={`${LETTERS[i]}. ${option}`}>
            <span className="answer-letter">{LETTERS[i]}.</span><span className="answer-text">{option}</span>
            {isRight && <Icon name="check" />}{isWrong && <Icon name="close" />}
          </button>;
        })}
      </div>
      {answered && <div className={`answer-feedback ${success ? "feedback-success" : "feedback-learn"}`} role="status" aria-live="polite">
        {success ? <><div><strong><Icon name="check" /> Rintangan teratasi! <span>+10</span></strong><p>{level.successText}</p></div>
          <GameButton variant="green" onClick={onNext} disabled={phase !== "cleared"}>{phase !== "cleared" ? "Hebat, kamu berhasil..." : levelIdx === LEVELS.length - 1 ? "Temukan Harta Karun" : "Tantangan Berikutnya"}<Icon name="next" /></GameButton>
        </> : <><div><strong>Rintangan belum teratasi</strong><p>Tidak apa-apa! Setiap kesalahan adalah kesempatan untuk belajar.</p></div><GameButton variant="gold" onClick={onOpenLearn}><Icon name="book" /> Buka Misi Belajar</GameButton></>}
      </div>}
    </section>
    <p className="question-hint">Pilih jawabanmu <span className="desktop-hint">atau tekan <kbd>A</kbd> <kbd>B</kbd> <kbd>C</kbd> <kbd>D</kbd></span></p>
  </div>;
}

export function GameFooter({ levelIdx, onMenu, onMap, muted, onMute }: { levelIdx: number; onMenu: () => void; onMap: () => void; muted: boolean; onMute: () => void }) {
  return <footer className="game-footer">
    <button className="footer-home" onClick={onMenu}><Icon name="home" /><span>Menu utama</span></button>
    <button className="footer-map" onClick={onMap}><Icon name="map" /><span>Peta petualangan</span><span className="progress-dots" aria-label={`Tantangan ${levelIdx + 1} dari 8`}>{LEVELS.map((l, i) => <i key={l.id} className={i < levelIdx ? "done" : i === levelIdx ? "current" : ""} />)}</span></button>
    <button className="footer-sound" onClick={onMute} aria-label={muted ? "Nyalakan suara" : "Matikan suara"} aria-pressed={muted}><Icon name={muted ? "mute" : "sound"} /></button>
  </footer>;
}