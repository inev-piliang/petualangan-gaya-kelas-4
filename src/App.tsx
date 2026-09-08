import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Engine } from "./game/engine";
import { ALL_BADGES, LEVELS, TREASURE_BADGE } from "./game/levels";
import { initAudio, setMuted as setAudioMuted, sfx } from "./game/audio";
import { loadHighScores, loadMuted, loadUnlockedBadges, saveHighScore, saveMuted, unlockBadges, type ScoreEntry } from "./game/storage";
import { GameFooter, HUD, QuestionPanel, type PlayPhase } from "./components/play";
import { BadgesScreen, LearnModal, MapModal, MateriScreen, MenuScreen, PauseOverlay, ResultModal, ScoresScreen, TipsScreen } from "./components/screens";

type Screen = "play" | "menu" | "materi" | "badges" | "scores" | "tips";
interface ResultData { total: number; bonus: number; stars: number; time: number; isNewBest: boolean; newBadges: { name: string }[] }

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  // Open on the illustrated challenge; the complete start menu is always accessible.
  const [screen, setScreen] = useState<Screen>("play");
  const [phase, setPhase] = useState<PlayPhase>("question");
  const [levelIdx, setLevelIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [earned, setEarned] = useState<string[]>([]);
  const [unlockedAll, setUnlockedAll] = useState<string[]>(loadUnlockedBadges);
  const [paused, setPaused] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [muted, setMuted] = useState(loadMuted);
  const [time, setTime] = useState(0);
  const [result, setResult] = useState<ResultData | null>(null);
  const [best, setBest] = useState<ScoreEntry | null>(() => loadHighScores()[0] ?? null);
  const stateRef = useRef({ screen, phase, levelIdx, paused, mapOpen, muted });
  stateRef.current = { screen, phase, levelIdx, paused, mapOpen, muted };
  const statsRef = useRef({ score, mistakes, earned });
  statsRef.current = { score, mistakes, earned };
  const timeRef = useRef(0);
  const savedRef = useRef(false);
  const initialBadges = useRef(loadUnlockedBadges());

  const finalize = useCallback(() => {
    if (savedRef.current || stateRef.current.screen !== "play" || stateRef.current.phase !== "treasure") return;
    savedRef.current = true;
    const stats = statsRef.current;
    const bonus = stats.mistakes === 0 ? 20 : 0;
    const total = stats.score + bonus;
    const stars = stats.mistakes === 0 ? 3 : stats.mistakes <= 2 ? 2 : 1;
    const finishedTime = Math.max(1, timeRef.current);
    const allIds = [...stats.earned, TREASURE_BADGE.id];
    setUnlockedAll(unlockBadges(allIds));
    const highScores = loadHighScores();
    const isNewBest = !highScores.length || total > highScores[0].score || (total === highScores[0].score && finishedTime < highScores[0].time);
    saveHighScore({ score: total, stars, mistakes: stats.mistakes, time: finishedTime, date: Date.now() });
    setBest(loadHighScores()[0] ?? null);
    setResult({ total, bonus, stars, time: finishedTime, isNewBest, newBadges: ALL_BADGES.filter(badge => allIds.includes(badge.id) && !initialBadges.current.includes(badge.id)) });
    stateRef.current.phase = "final";
    setPhase("final");
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new Engine(canvasRef.current);
    engineRef.current = engine;
    engine.setLevel(LEVELS[0].scene);
    engine.onPhase = nextPhase => {
      const current = stateRef.current;
      if (current.screen !== "play") return;
      if (nextPhase === "cleared" && current.phase === "correct") {
        const badge = LEVELS[current.levelIdx].badge;
        const ids = [...new Set([...statsRef.current.earned, badge.id])];
        statsRef.current.earned = ids;
        setEarned(ids);
        setUnlockedAll(unlockBadges([badge.id]));
        sfx.clear();
        engine.addFloater(badge.name, window.innerWidth < 760 ? 0.5 : 0.28, window.innerWidth < 760 ? 0.24 : 0.27, "#fff0b5", 27);
        current.phase = "cleared";
        setPhase("cleared");
      } else if (nextPhase === "treasure" && current.phase === "treasure") {
        sfx.treasure();
      } else if (nextPhase === "finished") {
        finalize();
      }
    };
    return () => { engine.destroy(); engineRef.current = null; };
  }, [finalize]);

  useEffect(() => { setAudioMuted(muted); }, [muted]);
  useEffect(() => { engineRef.current?.setPaused(paused || mapOpen || (screen !== "play" && screen !== "menu")); }, [paused, mapOpen, screen]);

  const start = useCallback(() => {
    initAudio(); sfx.click();
    stateRef.current = { ...stateRef.current, screen: "play", phase: "question", levelIdx: 0, paused: false, mapOpen: false };
    statsRef.current = { score: 0, mistakes: 0, earned: [] };
    savedRef.current = false;
    timeRef.current = 0;
    initialBadges.current = loadUnlockedBadges();
    setTime(0); setLevelIdx(0); setScore(0); setMistakes(0); setEarned([]);
    setSelected(null); setPaused(false); setMapOpen(false); setResult(null);
    setScreen("play"); setPhase("question");
    engineRef.current?.setLevel(LEVELS[0].scene);
  }, []);

  const answer = useCallback((index: number) => {
    const current = stateRef.current;
    if (current.screen !== "play" || current.phase !== "question" || current.paused || current.mapOpen) return;
    initAudio();
    setSelected(index);
    if (index === LEVELS[current.levelIdx].correct) {
      current.phase = "correct";
      setPhase("correct");
      statsRef.current.score += 10;
      setScore(statsRef.current.score);
      sfx.correct();
      engineRef.current?.answerCorrect();
      engineRef.current?.addFloater("+10 bintang!", window.innerWidth < 760 ? 0.6 : 0.36, window.innerWidth < 760 ? 0.32 : 0.39, "#fff4a8", 35);
    } else {
      current.phase = "wrong";
      setPhase("wrong");
      statsRef.current.mistakes += 1;
      setMistakes(statsRef.current.mistakes);
      sfx.wrong();
      engineRef.current?.answerWrong();
    }
  }, []);

  const openLearn = useCallback(() => {
    if (stateRef.current.phase !== "wrong") return;
    initAudio(); sfx.learn();
    stateRef.current.phase = "learn"; setPhase("learn");
  }, []);

  const retry = useCallback(() => {
    if (stateRef.current.phase !== "learn") return;
    initAudio(); sfx.click();
    engineRef.current?.forceIdle();
    stateRef.current.phase = "question";
    setSelected(null); setPhase("question");
  }, []);

  const next = useCallback(() => {
    const current = stateRef.current;
    if (current.phase !== "cleared" || current.paused || current.mapOpen) return;
    sfx.whoosh();
    if (current.levelIdx === LEVELS.length - 1) {
      current.phase = "treasure";
      setPhase("treasure");
      engineRef.current?.toCave();
    } else {
      const index = current.levelIdx + 1;
      current.levelIdx = index; current.phase = "question";
      setLevelIdx(index); setPhase("question"); setSelected(null);
      engineRef.current?.setLevel(LEVELS[index].scene);
    }
  }, []);

  const togglePause = useCallback(() => {
    const current = stateRef.current;
    if (current.screen !== "play" || current.phase === "final" || current.mapOpen) return;
    initAudio(); sfx.click();
    current.paused = !current.paused;
    setPaused(current.paused);
    engineRef.current?.setPaused(current.paused);
  }, []);

  const toggleMap = useCallback(() => {
    const current = stateRef.current;
    if (current.screen !== "play" || current.paused || current.phase === "final") return;
    initAudio(); sfx.click();
    current.mapOpen = !current.mapOpen;
    setMapOpen(current.mapOpen);
    engineRef.current?.setPaused(current.mapOpen);
  }, []);

  const toggleMute = useCallback(() => {
    const mute = !stateRef.current.muted;
    stateRef.current.muted = mute;
    setMuted(mute); saveMuted(mute); setAudioMuted(mute);
    if (!mute) { initAudio(); sfx.click(); }
  }, []);

  const goMenu = useCallback(() => {
    initAudio(); sfx.click();
    stateRef.current.screen = "menu";
    stateRef.current.paused = false;
    stateRef.current.mapOpen = false;
    setScreen("menu"); setPaused(false); setMapOpen(false); setResult(null);
    engineRef.current?.toMenu();
    setBest(loadHighScores()[0] ?? null);
  }, []);

  const navigate = useCallback((destination: Screen) => {
    initAudio(); sfx.click();
    stateRef.current.screen = destination;
    setScreen(destination); setResult(null);
  }, []);

  useEffect(() => {
    if (screen !== "play" || paused || mapOpen || phase === "final") return;
    let last = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      timeRef.current += Math.min((now - last) / 1000, 1);
      last = now;
      setTime(timeRef.current);
    }, 250);
    return () => window.clearInterval(interval);
  }, [screen, phase, paused, mapOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.target instanceof HTMLElement && event.target.matches("input, textarea, select")) return;
      const current = stateRef.current;
      const key = event.key.toLowerCase();
      if (key === "m") { toggleMute(); return; }
      if (current.mapOpen) {
        if (key === "escape") { event.preventDefault(); toggleMap(); }
        return;
      }
      if (key === "p" || key === "escape") {
        event.preventDefault();
        if (current.screen === "play" && current.phase !== "final") togglePause();
        else if (current.screen !== "menu") goMenu();
        return;
      }
      if (key === "r" && current.screen === "play" && (current.paused || current.phase === "final")) { event.preventDefault(); start(); return; }
      const enter = key === "enter" || key === " ";
      if (enter && event.target instanceof HTMLElement && event.target.closest("button, summary")) return;
      if (enter) event.preventDefault();
      if (current.screen === "menu") { if (enter) start(); return; }
      if (current.screen !== "play") return;
      if (current.paused) { if (enter) togglePause(); return; }
      if (current.phase === "final") { if (enter) start(); return; }
      if (current.phase === "question") {
        const number = ["1", "2", "3", "4"].indexOf(key);
        const letter = ["a", "b", "c", "d"].indexOf(key);
        if (number >= 0 || letter >= 0) { event.preventDefault(); answer(number >= 0 ? number : letter); }
      } else if (enter && current.phase === "cleared") next();
      else if (enter && current.phase === "wrong") openLearn();
      else if (enter && current.phase === "learn") retry();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, goMenu, next, openLearn, retry, start, toggleMap, toggleMute, togglePause]);

  useEffect(() => {
    const onVisibility = () => {
      const current = stateRef.current;
      if (document.hidden && current.screen === "play" && !current.paused && !current.mapOpen && current.phase !== "final") togglePause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [togglePause]);

  useLayoutEffect(() => {
    const element = screen === "menu" ? document.querySelector<HTMLElement>(".menu-panel") : panelRef.current;
    const measure = () => engineRef.current?.setBottomInset(window.innerWidth < 760 && element ? window.innerHeight - element.getBoundingClientRect().top : 0);
    measure();
    const observer = new ResizeObserver(measure);
    if (element) observer.observe(element);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [screen, phase, levelIdx]);

  const inCave = screen === "play" && (phase === "treasure" || phase === "final");
  const crossing = screen === "play" && (levelIdx === 1 || levelIdx === 3);
  const background = inCave ? "treasure-cave.jpg" : crossing ? "forest-crossing.jpg" : "forest-trail.jpg";
  const questionVisible = screen === "play" && phase !== "treasure" && phase !== "final";

  return <main className={`adventure-app ${inCave ? "cave-scene" : ""}`}>
    <div className="scene-background"><img src={`/images/${background}`} alt="" fetchPriority="high" draggable={false} /></div>
    <canvas ref={canvasRef} className="game-canvas" aria-hidden="true" />
    <div className="scene-vignette" />
    {screen === "play" && phase !== "final" && <HUD levelIdx={levelIdx} score={score} onPause={togglePause} />}
    {questionVisible && <QuestionPanel panelRef={element => { panelRef.current = element; }} level={LEVELS[levelIdx]} levelIdx={levelIdx} phase={phase === "learn" ? "wrong" : phase} selected={selected} onAnswer={answer} onOpenLearn={openLearn} onNext={next} />}
    {screen === "play" && phase !== "final" && <GameFooter levelIdx={levelIdx} onMenu={goMenu} onMap={toggleMap} muted={muted} onMute={toggleMute} />}
    {screen === "menu" && <MenuScreen onStart={start} onNav={navigate} best={best} />}
    {screen === "materi" && <MateriScreen onBack={goMenu} />}
    {screen === "badges" && <BadgesScreen unlocked={unlockedAll} onBack={goMenu} />}
    {screen === "scores" && <ScoresScreen scores={loadHighScores()} onBack={goMenu} />}
    {screen === "tips" && <TipsScreen onBack={goMenu} />}
    {screen === "play" && phase === "learn" && !paused && !mapOpen && <LearnModal lesson={LEVELS[levelIdx].lesson} onDone={retry} />}
    {screen === "play" && mapOpen && <MapModal levelIdx={levelIdx} earned={earned} onClose={toggleMap} />}
    {screen === "play" && paused && <PauseOverlay onResume={togglePause} onRestart={start} onMenu={goMenu} muted={muted} onMute={toggleMute} score={score} time={time} />}
    {screen === "play" && phase === "final" && result && <ResultModal total={result.total} bonus={result.bonus} mistakes={mistakes} stars={result.stars} time={result.time} isNewBest={result.isNewBest} newBadges={result.newBadges} onMenu={goMenu} onRestart={start} onMateri={() => navigate("materi")} />}
  </main>;
}