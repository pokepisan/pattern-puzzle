import { useState, useCallback } from "react";

function shuffle(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type GameState = "playing" | "won" | "wrong";

export default function App() {
  const [sequence, setSequence] = useState<number[]>(() => shuffle([0, 1, 2, 3, 4, 5]));
  const [progress, setProgress] = useState(0);
  const [gameState, setGameState] = useState<GameState>("playing");

  const pressSwitch = useCallback((idx: number) => {
    if (gameState !== "playing") return;

    if (sequence[progress] === idx) {
      const next = progress + 1;
      if (next === 6) {
        setProgress(6);
        setGameState("won");
      } else {
        setProgress(next);
      }
    } else {
      setGameState("wrong");
      setTimeout(() => {
        setProgress(0);
        setGameState("playing");
      }, 800);
    }
  }, [sequence, progress, gameState]);

  const newGame = useCallback(() => {
    setSequence(shuffle([0, 1, 2, 3, 4, 5]));
    setProgress(0);
    setGameState("playing");
  }, []);

  const litLights =
    gameState === "won"
      ? new Set([0, 1, 2, 3, 4, 5])
      : gameState === "wrong"
      ? new Set<number>()
      : new Set(sequence.slice(0, progress));

  return (
    <div className="game">
      <h1>Pattern Puzzle</h1>
      <p className="instructions">
        Find the correct order to turn on all 6 lights.
        Press the wrong switch and everything goes dark — start over!
      </p>

      <div className="panel">
        <div className="lights-row">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className={[
                "light",
                litLights.has(i) ? "on" : "",
                gameState === "wrong" ? "flash" : "",
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
              disabled={gameState !== "playing"}
              onClick={() => pressSwitch(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="status">
        {gameState === "won" && (
          <span className="status-won">You solved it! All lights on!</span>
        )}
        {gameState === "wrong" && (
          <span className="status-wrong">Wrong switch! Lights out...</span>
        )}
        {gameState === "playing" && progress === 0 && (
          <span className="status-idle">Press a switch to begin.</span>
        )}
        {gameState === "playing" && progress > 0 && (
          <span className="status-progress">{progress} of 6 — keep going!</span>
        )}
      </div>

      <button className="new-game-btn" onClick={newGame}>
        New Game
      </button>
    </div>
  );
}
