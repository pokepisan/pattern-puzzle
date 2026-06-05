import { useState, useEffect, useRef, useCallback } from "react";

const LIGHT_COLORS = [
  { lc: "#ff3300", lcDark: "#1e0403", lcDim: "#380808", lcFlash: "#6a0a00" },
  { lc: "#ff8800", lcDark: "#1e0e00", lcDim: "#381800", lcFlash: "#6a2a00" },
  { lc: "#ffdd00", lcDark: "#1e1b00", lcDim: "#383000", lcFlash: "#6a5500" },
  { lc: "#33dd55", lcDark: "#021a07", lcDim: "#083015", lcFlash: "#0a5520" },
  { lc: "#2299ff", lcDark: "#011020", lcDim: "#042040", lcFlash: "#0a3070" },
  { lc: "#cc44ff", lcDark: "#0e0220", lcDim: "#1e0840", lcFlash: "#3a0a70" },
];

function shuffle(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = "idle" | "countdown" | "playing" | "wrong" | "won";

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${s}.${tenths}s`;
}

export default function App() {
  const [sequence, setSequence] = useState<number[]>(() => shuffle([0, 1, 2, 3, 4, 5]));
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [wrongCount, setWrongCount] = useState(0);
  const [finalTime, setFinalTime] = useState(0);
  const [hintLight, setHintLight] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Countdown ticker: 3 → 2 → 1 → playing
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown === 0) {
      startTimeRef.current = Date.now();
      setPhase("playing");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  const startGame = useCallback(() => {
    setPhase("countdown");
  }, []);

  const pressSwitch = useCallback(
    (idx: number) => {
      if (phase !== "playing") return;
      if (sequence[progress] === idx) {
        const next = progress + 1;
        if (next === 6) {
          const ft =
            startTimeRef.current !== null ? Date.now() - startTimeRef.current : 0;
          setFinalTime(ft);
          setProgress(6);
          setPhase("won");
        } else {
          setProgress(next);
        }
      } else {
        setHintLight(sequence.indexOf(idx));
        setWrongCount((w) => w + 1);
        setPhase("wrong");
        setTimeout(() => {
          setProgress(0);
          setHintLight(null);
          setPhase("playing");
        }, 800);
      }
    },
    [sequence, progress, phase]
  );

  const newGame = useCallback(() => {
    setSequence(shuffle([0, 1, 2, 3, 4, 5]));
    setProgress(0);
    setPhase("idle");
    setCountdown(3);
    setWrongCount(0);
    setFinalTime(0);
    setHintLight(null);
    startTimeRef.current = null;
  }, []);

  const litLights =
    phase === "won"
      ? new Set([0, 1, 2, 3, 4, 5])
      : phase === "wrong"
      ? new Set<number>()
      : new Set(Array.from({ length: progress }, (_, i) => i));

  return (
    <div className="game">
      <h1>Pattern Puzzle</h1>
      <p className="instructions">
        Find the correct order to turn on all 6 lights.
        Press the wrong switch and everything goes dark — start over!
      </p>

      {phase === "idle" && (
        <button className="start-btn" onClick={startGame}>
          Start
        </button>
      )}

      {phase === "countdown" && (
        <div key={countdown} className="countdown-display">
          {countdown}
        </div>
      )}

      <div className={`panel${phase === "idle" || phase === "countdown" ? " panel-dim" : ""}`}>
        <div className="lights-row">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className={[
                "light",
                litLights.has(i) ? "on" : "",
                phase === "wrong" ? "flash" : "",
                phase === "wrong" && hintLight === i ? "hint" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                "--lc": LIGHT_COLORS[i].lc,
                "--lc-dark": LIGHT_COLORS[i].lcDark,
                "--lc-dim": LIGHT_COLORS[i].lcDim,
                "--lc-flash": LIGHT_COLORS[i].lcFlash,
              } as React.CSSProperties}
            />
          ))}
        </div>
        <div className="divider" />
        <div className="switches-row">
          {Array.from({ length: 6 }, (_, i) => (
            <button
              key={i}
              className="switch-btn"
              disabled={phase !== "playing"}
              onClick={() => pressSwitch(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="status">
        {phase === "idle" && (
          <span className="status-idle">Press Start when you're ready.</span>
        )}
        {phase === "countdown" && (
          <span className="status-idle">Get ready…</span>
        )}
        {phase === "playing" && progress === 0 && (
          <span className="status-idle">Press a switch to begin.</span>
        )}
        {phase === "playing" && progress > 0 && (
          <span className="status-progress">{progress} of 6 — keep going!</span>
        )}
        {phase === "wrong" && (
          <span className="status-wrong">Wrong switch! Start over…</span>
        )}
        {phase === "won" && (
          <div className="report">
            <p className="report-title">Puzzle Solved!</p>
            <div className="report-stats">
              <div className="report-stat">
                <span className="stat-label">Time</span>
                <span className="stat-value">{formatTime(finalTime)}</span>
              </div>
              <div className="report-divider" />
              <div className="report-stat">
                <span className="stat-label">Wrong attempts</span>
                <span className="stat-value">{wrongCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <button className="new-game-btn" onClick={newGame}>
        New Game
      </button>
    </div>
  );
}
