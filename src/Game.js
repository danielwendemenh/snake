import React, { useState, useEffect, useRef } from 'react';
import './Game.css';

const BOARD_SIZE = 20;
const INITIAL_SNAKE = [
  [8, 8],
  [7, 8]
];
const DIRECTIONS = {
  ArrowUp:    [ 0, -1],
  ArrowDown:  [ 0,  1],
  ArrowLeft:  [-1,  0],
  ArrowRight: [ 1,  0]
};

function Game() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [dir, setDir]     = useState(DIRECTIONS.ArrowRight);
  const [food, setFood]   = useState(generateFood(INITIAL_SNAKE));
  const [gameOver, setGameOver] = useState(false);

  // new state for score and menu
  const [score, setScore]     = useState(0);
  const [started, setStarted] = useState(false);

  const moveRef = useRef(dir);
  const touchStartRef = useRef(null);
  useEffect(() => { moveRef.current = dir; }, [dir]);

  // handle mobile swipe to change direction
  useEffect(() => {
    const handleTouchStart = (e) => {
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY };
    };
    const handleTouchEnd = (e) => {
      const t = e.changedTouches[0];
      const start = touchStartRef.current;
      if (!start) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      // decide swipe axis
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && moveRef.current[0] !== -1)
          setDir(DIRECTIONS.ArrowRight);
        else if (dx < 0 && moveRef.current[0] !== 1)
          setDir(DIRECTIONS.ArrowLeft);
      } else {
        if (dy > 0 && moveRef.current[1] !== -1)
          setDir(DIRECTIONS.ArrowDown);
        else if (dy < 0 && moveRef.current[1] !== 1)
          setDir(DIRECTIONS.ArrowUp);
      }
      touchStartRef.current = null;
    };
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend',   handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend',   handleTouchEnd);
    };
  }, []);

  // reset helper
  function reset() {
    setSnake(INITIAL_SNAKE);
    setDir(DIRECTIONS.ArrowRight);
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setGameOver(false);
    setStarted(true);
  }

  // game loop
  useEffect(() => {
    if (gameOver || !started) return;
    const id = setInterval(() => {
      setSnake(prev => {
        const head = prev[0];
        // move and wrap at borders
        let x = head[0] + moveRef.current[0];
        let y = head[1] + moveRef.current[1];
        const newHead = [
          (x + BOARD_SIZE) % BOARD_SIZE,
          (y + BOARD_SIZE) % BOARD_SIZE
        ];
        // self‐collision only
        if (prev.some(seg => seg[0] === newHead[0] && seg[1] === newHead[1])) {
          setGameOver(true);
          clearInterval(id);
          return prev;
        }

        let newSnake = [newHead, ...prev];
        // food?
        if (newHead[0] === food[0] && newHead[1] === food[1]) {
          setFood(generateFood(newSnake));
          setScore(s => s + 1);
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    }, 150);
    return () => clearInterval(id);
  }, [food, gameOver, started]);

  // keyboard handler
  useEffect(() => {
    const handler = e => {
      if (DIRECTIONS[e.key]) {
        const [dx,dy] = DIRECTIONS[e.key];
        const [cx,cy] = moveRef.current;
        // prevent reversing
        if (dx + cx !== 0 || dy + cy !== 0) {
          setDir(DIRECTIONS[e.key]);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="game-wrapper">
      <header className="score-board">
        <div className="label">Score</div>
        <div className="value">{score}</div>
      </header>

      {!started && !gameOver &&
        <div className="overlay menu">
          <h1>Snake</h1>
          <button onClick={() => setStarted(true)}>Start Game</button>
        </div>
      }

      {gameOver &&
        <div className="overlay game-over">
          <h1>Game Over</h1>
          <button onClick={reset}>Restart</button>
        </div>
      }

      <div className="board">
        {Array.from({ length: BOARD_SIZE }).flatMap((_, y) =>
          Array.from({ length: BOARD_SIZE }).map((_, x) => {
            const isSnake = snake.some(s => s[0]===x && s[1]===y);
            const isFood  = food[0]===x && food[1]===y;
            const cls = isSnake ? 'cell snake' : isFood ? 'cell food' : 'cell';
            return <div className={cls} key={`${x}-${y}`} />;
          })
        )}
      </div>
    </div>
  );
}

function generateFood(snake) {
  const free = [];
  for (let x = 0; x < BOARD_SIZE; x++) {
    for (let y = 0; y < BOARD_SIZE; y++) {
      if (!snake.some(seg => seg[0] === x && seg[1] === y)) free.push([x, y]);
    }
  }
  return free[Math.floor(Math.random() * free.length)];
}

export default Game;