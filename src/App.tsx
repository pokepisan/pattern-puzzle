import { useState, useEffect, useRef, useCallback } from "react";

function shuffle(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = "countdown" | "playing" | "wrong" | "won";

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${s}.${tenths}s`;
}

export default function App() {
  const [sequence, setSequence] = useState<number[]>(() => shuffle([0, 1, 2, 3, 4, 5]));
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [finalTime, setFinalTime] = useState(0);
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

  // Live timer — runs during playing and wrong phases
  useEffect(() => {
    if (phase !== "playing" && phase !== "wrong") return;
    const id = setInterval(() => {
      if (startTimeRef.current !== null) {
        setElapsed(Date.now() - startTimeRef.current);
      }
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

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
        setWrongCount((w) => w + 1);
        setPhase("wrong");
        setTimeout(() => {
          setProgress(0);
          setPhase("playing");
        }, 800);
      }
    },
    [sequence, progress, phase]
  );

  const newGame = useCallback(() => {
    setSequence(shuffle([0, 1, 2, 3, 4, 5]));
    setProgress(0);
    setPhase("countdown");
    setCountdown(3);
    setElapsed(0);
    setWrongCount(0);
    setFinalTime(0);
    startTimeRef.current = null;
  }, []);

  const litLights =
    phase === "won"
      ? new Set([0, 1, 2, 3, 4, 5])
      : phase === "wrong"
      ? new Set<number>()
      : new Set(sequence.slice(0, progress));

  return (
    <div className="game">
      <h1>Pattern Puzzle</h1>
      <p className="instructions">
        Find the correct order to turn on all 6 lights.
        Press the wrong switch and everything goes dark — start over!
      </p>

      {phase === "countdown" && (
        <div key={countdown} className="countdown-display">
          {countdown}
        </div>
      )}

      <div className={`panel${phase === "countdown" ? " panel-dim" : ""}`}>
        <div className="lights-row">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className={[
                "light",
                litLights.has(i) ? "on" : "",
                phase === "wrong" ? "flash" : "",
              ]
                .filter(Boolean)
                .join(" ")}
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

      <div className="timer-row">
        {(phase === "playing" || phase === "wrong") && (
          <span className="timer">{formatTime(elapsed)}</span>
        )}
      </div>

      <div className="status">
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
