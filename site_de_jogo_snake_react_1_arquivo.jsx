import React, { useEffect, useMemo, useRef, useState } from "react";

// ====== Jogo Snake com Paredes ======
// - Paredes fixas nas bordas
// - Se encostar nelas → Game Over

export default function SnakeGameSite() {
  const size = 20; // células por lado
  const cell = 20; // px por célula => canvas 400x400
  const canvasRef = useRef(null);

  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [dir, setDir] = useState({ x: 1, y: 0 });
  const [food, setFood] = useState(randFood({ avoid: [{ x: 10, y: 10 }], size }));
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(8);
  const [score, setScore] = useState(0);
  const [high, setHigh] = useState(() => {
    const v = localStorage.getItem("snake-high");
    return v ? Number(v) : 0;
  });

  const fps = useMemo(() => Math.max(2, Math.min(20, speed)), [speed]);
  const nextFrameRef = useRef(0);
  const rafRef = useRef(0);

  // ====== Loop do jogo ======
  useEffect(() => {
    if (!running || gameOver) return;

    const step = (t) => {
      if (!nextFrameRef.current) nextFrameRef.current = t;
      const interval = 1000 / fps;
      if (t - nextFrameRef.current >= interval) {
        nextFrameRef.current = t;
        tick();
        draw();
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, gameOver, snake, dir, food, fps]);

  // ====== Controles ======
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "w"].includes(k) && dir.y !== 1) setDir({ x: 0, y: -1 });
      else if (["arrowdown", "s"].includes(k) && dir.y !== -1) setDir({ x: 0, y: 1 });
      else if (["arrowleft", "a"].includes(k) && dir.x !== 1) setDir({ x: -1, y: 0 });
      else if (["arrowright", "d"].includes(k) && dir.x !== -1) setDir({ x: 1, y: 0 });
      else if (k === " ") toggleRun();
      else if (k === "r") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dir]);

  // ====== Lógica ======
  function tick() {
    setSnake((prev) => {
      const head = prev[0];
      const nx = head.x + dir.x;
      const ny = head.y + dir.y;
      const newHead = { x: nx, y: ny };

      // colisão com paredes
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) {
        triggerGameOver();
        return prev;
      }

      // colisão com corpo
      if (prev.some((p) => p.x === nx && p.y === ny)) {
        triggerGameOver();
        return prev;
      }

      let newSnake = [newHead, ...prev];
      if (nx === food.x && ny === food.y) {
        setScore((s) => s + 1);
        setFood(randFood({ avoid: newSnake, size }));
      } else {
        newSnake.pop();
      }
      return newSnake;
    });
  }

  function triggerGameOver() {
    setGameOver(true);
    setRunning(false);
    if (score > high) {
      setHigh(score);
      localStorage.setItem("snake-high", String(score));
    }
  }

  // ====== Desenho ======
  function draw() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, size * cell, size * cell);

    // paredes
    ctx.fillStyle = "#64748b";
    for (let i = 0; i < size; i++) {
      ctx.fillRect(i * cell, 0, cell, cell); // topo
      ctx.fillRect(i * cell, (size - 1) * cell, cell, cell); // base
      ctx.fillRect(0, i * cell, cell, cell); // esquerda
      ctx.fillRect((size - 1) * cell, i * cell, cell, cell); // direita
    }

    // comida
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(food.x * cell, food.y * cell, cell, cell);

    // cobra
    ctx.fillStyle = "#22c55e";
    snake.forEach((s, i) => {
      const pad = i === 0 ? 2 : 4;
      ctx.fillRect(s.x * cell + pad, s.y * cell + pad, cell - pad * 2, cell - pad * 2);
    });
  }

  useEffect(() => {
    draw();
  }, [snake, food]);

  function toggleRun() {
    if (gameOver) return;
    setRunning((r) => !r);
  }

  function reset() {
    setSnake([{ x: 10, y: 10 }]);
    setDir({ x: 1, y: 0 });
    setFood(randFood({ avoid: [{ x: 10, y: 10 }], size }));
    setScore(0);
    setGameOver(false);
    setRunning(false);
    nextFrameRef.current = 0;
    draw();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="max-w-5xl mx-auto px-4 py-8 flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Snake com Paredes</h1>
        <div className="text-sm opacity-80">Feira de Profissões</div>
      </header>

      <main className="max-w-5xl mx-auto px-4 grid gap-6 md:grid-cols-5">
        <section className="md:col-span-3">
          <div className="bg-slate-900 rounded-2xl shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Badge>Score: {score}</Badge>
                <Badge variant="subtle">Recorde: {high}</Badge>
                {gameOver && <Badge color="red">Game Over</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={toggleRun} className="btn-primary">{running ? "Pausar" : "Iniciar"}</button>
                <button onClick={reset} className="btn-ghost">Reiniciar</button>
              </div>
            </div>

            <div className="aspect-square w-full max-w-[400px] mx-auto">
              <canvas ref={canvasRef} width={size * cell} height={size * cell} className="w-full rounded-xl ring-1 ring-slate-800 bg-slate-900" />
            </div>

            <div className="mt-4 flex items-center gap-3 text-sm">
              <label className="opacity-80">Velocidade</label>
              <input type="range" min={2} max={20} value={fps} onChange={(e) => setSpeed(Number(e.target.value))} />
              <span>{fps} fps</span>
            </div>
          </div>
        </section>

        <aside className="md:col-span-2 space-y-6">
          <Card>
            <h2 className="text-xl font-semibold mb-2">Engenheiro de Software</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm opacity-90">
              <li>Cria e mantém sistemas de software.</li>
              <li>Resolve problemas com lógica e programação.</li>
              <li>Trabalha em equipe para desenvolver apps e jogos.</li>
            </ul>
          </Card>
        </aside>
      </main>
    </div>
  );
}

function Badge({ children, variant = "solid", color }) {
  const base = "inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium";
  const styles =
    variant === "subtle"
      ? "bg-slate-800 text-slate-200"
      : color === "red"
      ? "bg-red-500 text-white"
      : "bg-indigo-500 text-white";
  return <span className={`${base} ${styles}`}>{children}</span>;
}

function Card({ children }) {
  return <div className="bg-slate-900 rounded-2xl shadow p-4 ring-1 ring-slate-800">{children}</div>;
}

function randFood({ avoid, size }) {
  while (true) {
    const f = { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) };
    if (!avoid.some((p) => p.x === f.x && p.y === f.y)) return f;
  }
}
