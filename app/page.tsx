"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const BOARD_WIDTH = 900;
const BOARD_HEIGHT = 620;
const PADDLE_Y = 570;
const BRICK_COLORS = ["#ff6448", "#ff9f43", "#f4d44d", "#49c5a5", "#6b8cff", "#a66cff"];

type GameStatus = "ready" | "playing" | "paused" | "gameover" | "won";

type Brick = {
  x: number;
  y: number;
  width: number;
  height: number;
  hits: number;
  maxHits: number;
  color: string;
  row: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
};

type GameData = {
  ball: { x: number; y: number; vx: number; vy: number; radius: number };
  paddle: { x: number; width: number; targetX: number };
  bricks: Brick[];
  particles: Particle[];
  score: number;
  combo: number;
  lives: number;
  lastTime: number;
};

function createBricks(): Brick[] {
  const columns = 9;
  const rows = 6;
  const gap = 9;
  const margin = 38;
  const width = (BOARD_WIDTH - margin * 2 - gap * (columns - 1)) / columns;

  return Array.from({ length: columns * rows }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const maxHits = row < 2 && column % 3 === 1 ? 2 : 1;

    return {
      x: margin + column * (width + gap),
      y: 72 + row * 42,
      width,
      height: 30,
      hits: maxHits,
      maxHits,
      color: BRICK_COLORS[row],
      row,
    };
  });
}

function createGame(): GameData {
  const paddleWidth = 124;
  const paddleX = (BOARD_WIDTH - paddleWidth) / 2;

  return {
    ball: {
      x: BOARD_WIDTH / 2,
      y: PADDLE_Y - 13,
      vx: 330,
      vy: -410,
      radius: 8,
    },
    paddle: { x: paddleX, width: paddleWidth, targetX: paddleX },
    bricks: createBricks(),
    particles: [],
    score: 0,
    combo: 0,
    lives: 3,
    lastTime: 0,
  };
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameData>(createGame());
  const statusRef = useRef<GameStatus>("ready");
  const keysRef = useRef({ left: false, right: false });
  const audioRef = useRef<AudioContext | null>(null);
  const soundRef = useRef(true);
  const [status, setStatus] = useState<GameStatus>("ready");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [best, setBest] = useState(0);
  const [combo, setCombo] = useState(0);
  const [soundOn, setSoundOn] = useState(true);

  const changeStatus = useCallback((next: GameStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const playTone = useCallback((kind: "paddle" | "brick" | "life" | "win") => {
    if (!soundRef.current || typeof window === "undefined") return;

    try {
      const context = audioRef.current ?? new AudioContext();
      audioRef.current = context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const frequencies = { paddle: 220, brick: 420, life: 120, win: 660 };
      const durations = { paddle: 0.04, brick: 0.055, life: 0.16, win: 0.24 };
      const now = context.currentTime;

      oscillator.type = kind === "life" ? "sawtooth" : "square";
      oscillator.frequency.setValueAtTime(frequencies[kind], now);
      if (kind === "win") oscillator.frequency.exponentialRampToValueAtTime(990, now + 0.18);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durations[kind]);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + durations[kind]);
    } catch {
      // Audio is optional; the game remains fully playable without it.
    }
  }, []);

  const saveBest = useCallback(
    (nextScore: number) => {
      if (nextScore <= best) return;
      setBest(nextScore);
      try {
        window.localStorage.setItem("brick-room-best", String(nextScore));
      } catch {
        // Local storage can be disabled without affecting play.
      }
    },
    [best],
  );

  const resetBall = useCallback(() => {
    const game = gameRef.current;
    game.paddle.x = (BOARD_WIDTH - game.paddle.width) / 2;
    game.paddle.targetX = game.paddle.x;
    game.ball.x = BOARD_WIDTH / 2;
    game.ball.y = PADDLE_Y - 13;
    game.ball.vx = Math.random() > 0.5 ? 330 : -330;
    game.ball.vy = -410;
    game.combo = 0;
    setCombo(0);
  }, []);

  const newGame = useCallback(() => {
    gameRef.current = createGame();
    setScore(0);
    setLives(3);
    setCombo(0);
    changeStatus("playing");
    playTone("paddle");
  }, [changeStatus, playTone]);

  const startOrResume = useCallback(() => {
    if (statusRef.current === "gameover" || statusRef.current === "won") {
      newGame();
      return;
    }

    if (statusRef.current === "ready" || statusRef.current === "paused") {
      changeStatus("playing");
      playTone("paddle");
    }
  }, [changeStatus, newGame, playTone]);

  const togglePause = useCallback(() => {
    if (statusRef.current === "playing") changeStatus("paused");
    else if (statusRef.current === "paused") changeStatus("playing");
    else startOrResume();
  }, [changeStatus, startOrResume]);

  useEffect(() => {
    try {
      setBest(Number(window.localStorage.getItem("brick-room-best") ?? 0));
    } catch {
      setBest(0);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrame = 0;

    const burst = (x: number, y: number, color: string) => {
      const game = gameRef.current;
      for (let i = 0; i < 7; i += 1) {
        game.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 260,
          vy: (Math.random() - 0.8) * 220,
          life: 0.55 + Math.random() * 0.25,
          color,
          size: 3 + Math.random() * 4,
        });
      }
    };

    const draw = () => {
      const game = gameRef.current;
      const { ball, paddle, bricks, particles } = game;

      context.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
      context.fillStyle = "#111510";
      context.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

      context.strokeStyle = "rgba(241, 237, 223, 0.05)";
      context.lineWidth = 1;
      for (let x = 0; x <= BOARD_WIDTH; x += 36) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, BOARD_HEIGHT);
        context.stroke();
      }
      for (let y = 0; y <= BOARD_HEIGHT; y += 36) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(BOARD_WIDTH, y);
        context.stroke();
      }

      context.fillStyle = "rgba(244, 239, 223, 0.45)";
      context.font = "700 12px Arial, sans-serif";
      context.letterSpacing = "2px";
      context.fillText("BREAK / ROOM · FLOOR 01", 38, 42);
      context.textAlign = "right";
      context.fillText(`${bricks.length.toString().padStart(2, "0")} BLOCKS`, BOARD_WIDTH - 38, 42);
      context.textAlign = "left";

      bricks.forEach((brick) => {
        context.fillStyle = "rgba(0, 0, 0, 0.42)";
        context.fillRect(brick.x + 4, brick.y + 5, brick.width, brick.height);
        context.fillStyle = brick.hits < brick.maxHits ? "#f5eee0" : brick.color;
        context.fillRect(brick.x, brick.y, brick.width, brick.height);
        context.fillStyle = "rgba(255, 255, 255, 0.35)";
        context.fillRect(brick.x + 4, brick.y + 4, brick.width - 8, 3);
        if (brick.maxHits > 1 && brick.hits === brick.maxHits) {
          context.fillStyle = "rgba(17, 21, 16, 0.5)";
          context.fillRect(brick.x + brick.width / 2 - 2, brick.y, 4, brick.height);
        }
      });

      particles.forEach((particle) => {
        context.globalAlpha = Math.max(particle.life * 1.5, 0);
        context.fillStyle = particle.color;
        context.fillRect(particle.x, particle.y, particle.size, particle.size);
      });
      context.globalAlpha = 1;

      context.fillStyle = "#ff6448";
      context.fillRect(paddle.x + 6, PADDLE_Y + 7, paddle.width, 12);
      context.fillStyle = "#f4d44d";
      context.fillRect(paddle.x, PADDLE_Y, paddle.width, 12);
      context.fillStyle = "#fff9e9";
      context.fillRect(paddle.x + 7, PADDLE_Y + 3, paddle.width - 14, 3);

      context.beginPath();
      context.arc(ball.x + 3, ball.y + 4, ball.radius, 0, Math.PI * 2);
      context.fillStyle = "rgba(0, 0, 0, 0.45)";
      context.fill();
      context.beginPath();
      context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      context.fillStyle = "#fff8e6";
      context.fill();
    };

    const update = (time: number) => {
      const game = gameRef.current;
      if (!game.lastTime) game.lastTime = time;
      const delta = Math.min((time - game.lastTime) / 1000, 0.025);
      game.lastTime = time;

      const { ball, paddle } = game;
      const statusNow = statusRef.current;
      const keyboardSpeed = 640 * delta;

      if (keysRef.current.left) paddle.targetX -= keyboardSpeed;
      if (keysRef.current.right) paddle.targetX += keyboardSpeed;
      paddle.targetX = Math.max(0, Math.min(BOARD_WIDTH - paddle.width, paddle.targetX));
      paddle.x += (paddle.targetX - paddle.x) * Math.min(delta * 18, 1);

      if (statusNow === "ready") {
        ball.x = paddle.x + paddle.width / 2;
        ball.y = PADDLE_Y - 13;
      }

      if (statusNow === "playing") {
        const previousX = ball.x;
        const previousY = ball.y;
        ball.x += ball.vx * delta;
        ball.y += ball.vy * delta;

        if (ball.x - ball.radius <= 0 && ball.vx < 0) {
          ball.x = ball.radius;
          ball.vx *= -1;
        } else if (ball.x + ball.radius >= BOARD_WIDTH && ball.vx > 0) {
          ball.x = BOARD_WIDTH - ball.radius;
          ball.vx *= -1;
        }

        if (ball.y - ball.radius <= 0 && ball.vy < 0) {
          ball.y = ball.radius;
          ball.vy *= -1;
        }

        if (
          ball.vy > 0 &&
          ball.y + ball.radius >= PADDLE_Y &&
          ball.y - ball.radius <= PADDLE_Y + 16 &&
          ball.x >= paddle.x - ball.radius &&
          ball.x <= paddle.x + paddle.width + ball.radius
        ) {
          const hitPosition = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
          const speed = Math.min(Math.hypot(ball.vx, ball.vy) * 1.025, 720);
          const angle = hitPosition * 1.05;
          ball.vx = Math.sin(angle) * speed;
          ball.vy = -Math.abs(Math.cos(angle) * speed);
          ball.y = PADDLE_Y - ball.radius - 1;
          playTone("paddle");
        }

        const hitIndex = game.bricks.findIndex(
          (brick) =>
            ball.x + ball.radius >= brick.x &&
            ball.x - ball.radius <= brick.x + brick.width &&
            ball.y + ball.radius >= brick.y &&
            ball.y - ball.radius <= brick.y + brick.height,
        );

        if (hitIndex >= 0) {
          const brick = game.bricks[hitIndex];
          const cameFromTop = previousY + ball.radius <= brick.y;
          const cameFromBottom = previousY - ball.radius >= brick.y + brick.height;
          const cameFromLeft = previousX + ball.radius <= brick.x;
          const cameFromRight = previousX - ball.radius >= brick.x + brick.width;

          if (cameFromTop || cameFromBottom) ball.vy *= -1;
          else if (cameFromLeft || cameFromRight) ball.vx *= -1;
          else ball.vy *= -1;

          brick.hits -= 1;
          playTone("brick");

          if (brick.hits <= 0) {
            burst(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);
            game.bricks.splice(hitIndex, 1);
            game.combo += 1;
            game.score += 100 + brick.row * 20 + Math.min(game.combo, 12) * 10;
            setCombo(game.combo);
          } else {
            game.score += 40;
          }
          setScore(game.score);

          if (game.bricks.length === 0) {
            changeStatus("won");
            saveBest(game.score);
            playTone("win");
          }
        }

        if (ball.y - ball.radius > BOARD_HEIGHT) {
          game.lives -= 1;
          game.combo = 0;
          setLives(game.lives);
          setCombo(0);
          playTone("life");

          if (game.lives <= 0) {
            saveBest(game.score);
            changeStatus("gameover");
          } else {
            resetBall();
            changeStatus("ready");
          }
        }
      }

      game.particles = game.particles
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.vx * delta,
          y: particle.y + particle.vy * delta,
          vy: particle.vy + 360 * delta,
          life: particle.life - delta,
        }))
        .filter((particle) => particle.life > 0);

      draw();
      animationFrame = window.requestAnimationFrame(update);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "Space", "KeyA", "KeyD", "KeyP"].includes(event.code)) {
        event.preventDefault();
      }
      if (event.code === "ArrowLeft" || event.code === "KeyA") keysRef.current.left = true;
      if (event.code === "ArrowRight" || event.code === "KeyD") keysRef.current.right = true;
      if (event.code === "Space") startOrResume();
      if (event.code === "KeyP") togglePause();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "ArrowLeft" || event.code === "KeyA") keysRef.current.left = false;
      if (event.code === "ArrowRight" || event.code === "KeyD") keysRef.current.right = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    animationFrame = window.requestAnimationFrame(update);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [changeStatus, playTone, resetBall, saveBest, startOrResume, togglePause]);

  const movePaddle = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const position = ((clientX - bounds.left) / bounds.width) * BOARD_WIDTH;
    const paddle = gameRef.current.paddle;
    paddle.targetX = position - paddle.width / 2;
  };

  const setDirection = (direction: "left" | "right", pressed: boolean) => {
    keysRef.current[direction] = pressed;
  };

  const toggleSound = () => {
    const next = !soundRef.current;
    soundRef.current = next;
    setSoundOn(next);
  };

  const overlayCopy = {
    ready: {
      tag: score > 0 ? "BALL READY" : "INSERT SOME COURAGE",
      title: score > 0 ? "다시 한 번!" : "게임 시작",
      body: score > 0 ? "패들을 움직여 남은 벽돌을 부수세요." : "패들을 움직이고, 공이 떨어지지 않게 받아내세요.",
      button: score > 0 ? "계속하기" : "플레이",
    },
    paused: {
      tag: "TIME OUT",
      title: "잠깐 멈춤",
      body: "숨을 고르고 다시 리듬을 이어가세요.",
      button: "계속하기",
    },
    gameover: {
      tag: "NO MORE BALLS",
      title: "게임 오버",
      body: `이번 점수는 ${score.toLocaleString("ko-KR")}점. 다시 기록을 노려보세요.`,
      button: "다시 도전",
    },
    won: {
      tag: "FLOOR CLEARED",
      title: "완벽해요!",
      body: `모든 벽돌을 정리하고 ${score.toLocaleString("ko-KR")}점을 기록했어요.`,
      button: "한 판 더",
    },
  } as const;

  const currentOverlay = status === "playing" ? null : overlayCopy[status];

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#game" aria-label="브레이크 룸 게임으로 이동">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>BREAK / ROOM</span>
        </a>

        <div className="topbar-actions">
          <span className="best-score">BEST {best.toString().padStart(6, "0")}</span>
          <button className="sound-button" type="button" onClick={toggleSound} aria-pressed={soundOn}>
            SOUND <span>{soundOn ? "ON" : "OFF"}</span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="intro-copy">
            <p className="eyebrow">
              <span>NO. 01</span> KOREAN WEB ARCADE
            </p>
            <h1>
              벽돌을 깨고,
              <br />
              <em>리듬을 타세요.</em>
            </h1>
            <p className="lead">
              간단한 규칙, 선명한 타격감. 패들 하나로 화면 속 모든 벽돌을 정리하는 클래식
              아케이드입니다.
            </p>

            <button className="primary-button" type="button" onClick={newGame}>
              <span>{status === "playing" ? "처음부터 다시" : "게임 시작하기"}</span>
              <span aria-hidden="true">↗</span>
            </button>

            <div className="control-note">
              <span className="control-icon" aria-hidden="true">
                ←
              </span>
              <span className="control-icon" aria-hidden="true">
                →
              </span>
              <p>
                <strong>MOVE</strong>
                방향키 · A/D · 마우스 · 터치
              </p>
            </div>
          </div>

          <div className="game-column" id="game">
            <div className="game-meta" aria-live="polite">
              <div>
                <span>SCORE</span>
                <strong>{score.toString().padStart(6, "0")}</strong>
              </div>
              <div>
                <span>COMBO</span>
                <strong>×{combo.toString().padStart(2, "0")}</strong>
              </div>
              <div>
                <span>BALLS</span>
                <strong>
                  {Array.from({ length: 3 }, (_, index) => (
                    <i className={index < lives ? "life active" : "life"} key={index} />
                  ))}
                </strong>
              </div>
              <button
                className="pause-button"
                type="button"
                onClick={togglePause}
                aria-label={status === "paused" ? "게임 계속하기" : "게임 일시정지"}
              >
                {status === "paused" ? "▶" : "Ⅱ"}
              </button>
            </div>

            <div className="game-frame">
              <canvas
                ref={canvasRef}
                width={BOARD_WIDTH}
                height={BOARD_HEIGHT}
                aria-label="벽돌깨기 게임 화면. 방향키, A와 D 키, 마우스 또는 터치로 패들을 움직입니다."
                onPointerMove={(event) => movePaddle(event.clientX)}
                onPointerDown={(event) => {
                  movePaddle(event.clientX);
                  if (statusRef.current !== "playing") startOrResume();
                }}
              />

              {currentOverlay && (
                <div className="game-overlay">
                  <p>{currentOverlay.tag}</p>
                  <h2>{currentOverlay.title}</h2>
                  <span>{currentOverlay.body}</span>
                  <button type="button" onClick={startOrResume}>
                    {currentOverlay.button} <b aria-hidden="true">→</b>
                  </button>
                </div>
              )}
            </div>

            <div className="mobile-controls" aria-label="모바일 게임 조작">
              <button
                type="button"
                aria-label="왼쪽으로 이동"
                onPointerDown={() => setDirection("left", true)}
                onPointerUp={() => setDirection("left", false)}
                onPointerLeave={() => setDirection("left", false)}
                onPointerCancel={() => setDirection("left", false)}
              >
                ←
              </button>
              <button type="button" onClick={togglePause}>
                {status === "playing" ? "PAUSE" : "PLAY"}
              </button>
              <button
                type="button"
                aria-label="오른쪽으로 이동"
                onPointerDown={() => setDirection("right", true)}
                onPointerUp={() => setDirection("right", false)}
                onPointerLeave={() => setDirection("right", false)}
                onPointerCancel={() => setDirection("right", false)}
              >
                →
              </button>
            </div>

            <div className="game-caption">
              <span>CLASSIC MODE / 3 BALLS</span>
              <span>SPACE: START · P: PAUSE</span>
            </div>
          </div>
        </section>

        <section className="rules" aria-labelledby="rules-title">
          <div className="rules-heading">
            <p>HOW TO PLAY</p>
            <h2 id="rules-title">세 가지만 기억하세요.</h2>
          </div>
          <ol>
            <li>
              <span>01</span>
              <strong>받아내기</strong>
              <p>공이 바닥으로 떨어지기 전에 패들로 정확하게 받아내세요.</p>
            </li>
            <li>
              <span>02</span>
              <strong>각도 만들기</strong>
              <p>패들 가장자리에 맞힐수록 공이 더 날카로운 각도로 튕겨 나갑니다.</p>
            </li>
            <li>
              <span>03</span>
              <strong>콤보 쌓기</strong>
              <p>실수 없이 벽돌을 연속으로 깨고 더 높은 보너스 점수를 노리세요.</p>
            </li>
          </ol>
        </section>
      </main>

      <footer>
        <span>BREAK / ROOM © 2026</span>
        <p>ONE PADDLE. ONE BALL. ZERO EXCUSES.</p>
        <a href="#game">BACK TO GAME ↑</a>
      </footer>
    </div>
  );
}
