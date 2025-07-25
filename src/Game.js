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
  ArrowRight: [ 1,  0],
  // WASD support
  w: [ 0, -1],
  s: [ 0,  1],
  a: [-1,  0],
  d: [ 1,  0]
};

// Difficulty settings with corresponding speeds
const DIFFICULTY = {
  easy: { speed: 180, label: 'Easy' },
  medium: { speed: 130, label: 'Medium' },
  hard: { speed: 80, label: 'Hard' },
  extreme: { speed: 50, label: 'Extreme' }
};

function Game() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [dir, setDir]     = useState(DIRECTIONS.ArrowRight);
  const [food, setFood]   = useState(generateFood(INITIAL_SNAKE));
  const [gameOver, setGameOver] = useState(false);

  // Enhanced state
  const [score, setScore]     = useState(0);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [highScore, setHighScore] = useState(
    parseInt(localStorage.getItem('snakeHighScore') || '0')
  );
  const [difficulty, setDifficulty] = useState('medium');
  const [showControls, setShowControls] = useState(false);

  const moveRef = useRef(dir);
  const touchStartRef = useRef(null);
  const gameSpeedRef = useRef(DIFFICULTY[difficulty].speed);
  useEffect(() => { 
    moveRef.current = dir;
    gameSpeedRef.current = DIFFICULTY[difficulty].speed;
  }, [dir, difficulty]);

  // handle mobile swipe to change direction
  useEffect(() => {
    const handleTouchStart = (e) => {
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY };
    };
    
    const handleTouchMove = (e) => {
      if (!touchStartRef.current || !started || paused) return;
      
      const t = e.touches[0];
      const start = touchStartRef.current;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      
      // Minimum swipe distance to trigger direction change
      const minSwipeDistance = 30;
      
      if (Math.abs(dx) > minSwipeDistance || Math.abs(dy) > minSwipeDistance) {
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
        // Reset after processing to allow new swipes
        touchStartRef.current = { x: t.clientX, y: t.clientY };
      }
    };

    const handleTouchEnd = () => {
      touchStartRef.current = null;
    };
    
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [started, paused]);

  // reset helper
  function reset() {
    setSnake(INITIAL_SNAKE);
    setDir(DIRECTIONS.ArrowRight);
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setGameOver(false);
    setStarted(true);
    setPaused(false);
  }

  // game loop
  useEffect(() => {
    if (gameOver || !started || paused) return;
    
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
          
          // Update high score if needed
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('snakeHighScore', score.toString());
          }
          
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
    }, gameSpeedRef.current);
    
    return () => clearInterval(id);
  }, [food, gameOver, started, paused, score, highScore]);

  // keyboard handler
  useEffect(() => {
    const handler = e => {
      // Direction keys
      if (DIRECTIONS[e.key]) {
        e.preventDefault();
        const [dx,dy] = DIRECTIONS[e.key];
        const [cx,cy] = moveRef.current;
        // prevent reversing
        if (dx + cx !== 0 || dy + cy !== 0) {
          setDir(DIRECTIONS[e.key]);
        }
      }
      
      // Pause game with 'p' or 'Escape'
      if ((e.key === 'p' || e.key === 'Escape') && started && !gameOver) {
        setPaused(p => !p);
      }
      
      // Start/restart with Enter
      if (e.key === 'Enter') {
        if (gameOver) {
          reset();
        } else if (!started) {
          setStarted(true);
        } else if (paused) {
          setPaused(false);
        }
      }
    };
    
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [started, gameOver, paused]);

  // Determine if a segment is head, tail or body for styling
  function getSegmentClass(x, y) {
    for (let i = 0; i < snake.length; i++) {
      const [sx, sy] = snake[i];
      if (sx === x && sy === y) {
        if (i === 0) return 'cell snake head';
        if (i === snake.length - 1) return 'cell snake tail';
        return 'cell snake body';
      }
    }
    return false;
  }

  return (
    <div className="game-wrapper">
      <header className="score-board">
        <div>
          <div className="label">Score</div>
          <div className="value">{score}</div>
        </div>
        <div>
          <div className="label">High Score</div>
          <div className="value">{highScore}</div>
        </div>
        <div>
          <div className="label">Level</div>
          <div className="value">{DIFFICULTY[difficulty].label}</div>
        </div>
      </header>

      {!started && !gameOver &&
        <div className="overlay menu">
          <h1>Snake Master</h1>
          <div className="difficulty-selector">
            <p>Select Difficulty:</p>
            <div className="difficulty-buttons">
              {Object.entries(DIFFICULTY).map(([key, value]) => (
                <button 
                  key={key} 
                  className={difficulty === key ? 'active' : ''}
                  onClick={() => setDifficulty(key)}
                >
                  {value.label}
                </button>
              ))}
            </div>
          </div>
          <button className="primary-button" onClick={() => setStarted(true)}>Start Game</button>
          <button onClick={() => setShowControls(true)}>How to Play</button>
        </div>
      }

      {showControls &&
        <div className="overlay controls">
          <h2>How to Play</h2>
          <div className="control-instructions">
            <p><strong>Desktop:</strong> Use arrow keys or WASD to move</p>
            <p><strong>Mobile:</strong> Swipe in direction you want to go</p>
            <p><strong>Pause:</strong> Press P or ESC key</p>
          </div>
          <button onClick={() => setShowControls(false)}>Close</button>
        </div>
      }

      {gameOver &&
        <div className="overlay game-over">
          <h1>Game Over</h1>
          <p className="final-score">Your score: {score}</p>
          {score >= highScore && <p className="new-record">New High Score!</p>}
          <button className="primary-button" onClick={reset}>Play Again</button>
          <button onClick={() => {setGameOver(false); setStarted(false);}}>Main Menu</button>
        </div>
      }
      
      {paused &&
        <div className="overlay pause-menu">
          <h2>Game Paused</h2>
          <button className="primary-button" onClick={() => setPaused(false)}>Resume</button>
          <button onClick={() => {setPaused(false); setStarted(false);}}>Quit</button>
        </div>
      }

      <div className="board">
        {Array.from({ length: BOARD_SIZE }).flatMap((_, y) =>
          Array.from({ length: BOARD_SIZE }).map((_, x) => {
            const snakeClass = getSegmentClass(x, y);
            const isFood  = food[0]===x && food[1]===y;
            const cls = snakeClass || (isFood ? 'cell food' : 'cell');
            const direction = snakeClass && snakeClass.includes('head') ? 
              `dir-${
                moveRef.current[0] === 1 ? 'right' :
                moveRef.current[0] === -1 ? 'left' :
                moveRef.current[1] === 1 ? 'down' :
                'up'
              }` : '';
            return <div className={`${cls} ${direction}`} key={`${x}-${y}`} />;
          })
        )}
      </div>
      
      {started && !gameOver && !paused && 
        <button className="pause-button" onClick={() => setPaused(true)}>
          II
        </button>
      }
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